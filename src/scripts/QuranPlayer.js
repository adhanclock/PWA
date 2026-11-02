import { useEffect, useState } from 'react';
import {
    quranSurahs, QURAN_SURAH_COUNT, QURAN_DEFAULT_RECITER, QURAN_ADHAN_RESUME_REWIND, quranSurahAudioUrl
} from '../data/QuranData';

/* Qur'an player singleton. Lives outside React so playback survives the menu (offcanvas)
   closing; the Quran tab subscribes through useQuran(). Persists to localStorage 'quran'.
   Mirrors the PTX extension's service worker + offscreen player:
   - a finished surah is auto-marked completed, then the next one starts (auto-continue) or is cued
   - an adhan/alarm pauses playback and, once it ends, resumes ~10s earlier
   - seeking a long surah to its exact end hangs the media element, so a seek that lands within
     QURAN_END_EPS of the end is treated as the surah finishing */

const STORAGE_KEY = 'quran';
const QURAN_END_EPS = 0.75;
const QURAN_ADVANCE_DELAY_MS = 1500;
const QURAN_PREV_RESTART_BUFFER = 3;   /* seconds */

const clampSurah = (n) => Math.max(1, Math.min(QURAN_SURAH_COUNT, n || 1));

const load = () => {
    try {
        const s = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        return {
            currentSurah: clampSurah(s.currentSurah),
            currentTime: s.currentTime > 0 ? s.currentTime : 0,
            reciter: s.reciter || QURAN_DEFAULT_RECITER,
            favorites: Array.isArray(s.favorites) ? s.favorites : [],
            completed: Array.isArray(s.completed) ? s.completed : [],
            autoContinue: s.autoContinue !== false
        };
    } catch (e) {
        return { currentSurah: 1, currentTime: 0, reciter: QURAN_DEFAULT_RECITER, favorites: [], completed: [], autoContinue: true };
    }
};

const saved = load();

const state = {
    ...saved,
    duration: 0,
    isPlaying: false,
    wasPlayingBeforeAdhan: false,
    miniPinned: false,   /* paused from the mini player itself → it stays up (paused view); pausing from the Qur'an tab hides it */
    advancing: false     /* between surahs (auto-continue delay) — counts as playing so the mini player doesn't flicker */
};

const listeners = new Set();
let audio = null;
let errorStreak = 0;
let lastPersist = 0;
let advanceTimer = null;
let pendingStart = 0;   /* seek applied once the new source's metadata loads */

const persist = () => {
    lastPersist = Date.now();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            currentSurah: state.currentSurah,
            currentTime: state.currentTime,
            reciter: state.reciter,
            favorites: state.favorites,
            completed: state.completed,
            autoContinue: state.autoContinue
        }));
    } catch (e) { /* storage unavailable */ }
};

/* new snapshot per change so React subscribers re-render */
let snapshot = { ...state };
const emit = (save) => {
    if (save) persist();
    snapshot = { ...state };
    listeners.forEach((fn) => fn(snapshot));
};

const updateMediaSession = () => {
    if (!('mediaSession' in navigator) || typeof window.MediaMetadata === 'undefined') return;
    const s = quranSurahs.find((x) => x.number === state.currentSurah);
    try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
            title: s ? s.englishName : 'Surah ' + state.currentSurah,
            artist: 'Qur\'an'
        });
    } catch (e) { /* unsupported */ }
};

const getAudio = () => {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', () => {
        if (isFinite(audio.duration) && audio.duration > 0) {
            state.duration = audio.duration;
            if (pendingStart > 0) {
                try { audio.currentTime = pendingStart; } catch (e) { /* not seekable yet */ }
            }
            pendingStart = 0;
            emit(false);
        }
    });
    audio.addEventListener('timeupdate', () => {
        state.currentTime = audio.currentTime || 0;
        emit(Date.now() - lastPersist >= 3000);
    });
    audio.addEventListener('play', () => { state.isPlaying = true; state.miniPinned = false; emit(true); });
    audio.addEventListener('pause', () => {
        if (audio.ended) return;
        state.isPlaying = false;
        emit(true);
    });
    audio.addEventListener('ended', () => advance());
    audio.addEventListener('error', () => { if (audio.currentSrc) handleError(); });

    if ('mediaSession' in navigator) {
        try {
            navigator.mediaSession.setActionHandler('play', () => QuranPlayer.toggle());
            navigator.mediaSession.setActionHandler('pause', () => QuranPlayer.toggle());
            navigator.mediaSession.setActionHandler('previoustrack', () => QuranPlayer.step(-1));
            navigator.mediaSession.setActionHandler('nexttrack', () => QuranPlayer.step(1));
        } catch (e) { /* unsupported action */ }
    }
    return audio;
};

const clearAdvanceTimer = () => { if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; } };

const loadSource = (surah, startTime) => {
    const a = getAudio();
    a.src = quranSurahAudioUrl(surah, state.reciter);
    pendingStart = startTime > 0 ? startTime : 0;
    updateMediaSession();
};

/* audio element currently holds this surah + reciter */
const isLoaded = (surah) => {
    const a = getAudio();
    return !!a.currentSrc && a.currentSrc === new URL(quranSurahAudioUrl(surah, state.reciter), window.location.href).href;
};

const playAt = (surah, startTime) => {
    clearAdvanceTimer();
    state.currentSurah = clampSurah(surah);
    state.currentTime = startTime || 0;
    state.duration = 0;
    state.wasPlayingBeforeAdhan = false;
    state.advancing = false;
    state.miniPinned = false;
    loadSource(state.currentSurah, state.currentTime);
    emit(true);
    getAudio().play().catch(() => { state.isPlaying = false; emit(false); });
};

/* load a surah without playing, learn its length so the bar shows 0:00 / total */
const cue = (surah) => {
    clearAdvanceTimer();
    const a = getAudio();
    a.pause();
    state.currentSurah = clampSurah(surah);
    state.currentTime = 0;
    state.duration = 0;
    state.isPlaying = false;
    state.wasPlayingBeforeAdhan = false;
    state.advancing = false;
    state.miniPinned = false;
    loadSource(state.currentSurah, 0);
    emit(true);
};

const markCompleted = (surah, value) => {
    const set = new Set(state.completed);
    if (value) set.add(surah); else set.delete(surah);
    state.completed = Array.from(set).sort((a, b) => a - b);
    return state.completed.length;
};

const stopAll = () => {
    clearAdvanceTimer();
    const a = getAudio();
    a.pause();
    a.removeAttribute('src');
    a.load();
    state.currentSurah = 1;
    state.currentTime = 0;
    state.duration = 0;
    state.isPlaying = false;
    state.wasPlayingBeforeAdhan = false;
    state.advancing = false;
    state.miniPinned = false;
    emit(true);
};

const advance = () => {
    const finished = state.currentSurah;
    const completedCount = markCompleted(finished, true);
    errorStreak = 0;
    state.isPlaying = false;
    state.advancing = true;
    emit(true);
    if (completedCount >= QURAN_SURAH_COUNT) { stopAll(); return; }   /* whole khatm done: the tab shows the celebration */
    if (finished >= QURAN_SURAH_COUNT) {                              /* reached 114 with earlier surahs still unread */
        state.currentTime = 0;
        state.duration = 0;
        state.advancing = false;
        emit(true);
        return;
    }
    if (!state.autoContinue) { cue(finished + 1); return; }
    clearAdvanceTimer();
    advanceTimer = setTimeout(() => { advanceTimer = null; playAt(finished + 1, 0); }, QURAN_ADVANCE_DELAY_MS);   /* let the green check land first */
};

const handleError = () => {
    errorStreak++;
    if (errorStreak > 5 || state.currentSurah >= QURAN_SURAH_COUNT) { errorStreak = 0; stopAll(); return; }
    playAt(state.currentSurah + 1, 0);   /* skip a surah that failed to load */
};

/* Qur'an control bar (bottom-left) rule: up while playing (or between auto-continued surahs);
   pausing from the Qur'an tab hides it, pausing from the bar itself (miniPinned) keeps it up. */
export const quranMiniShown = (q) => q.isPlaying || q.advancing || q.miniPinned;

export const QuranPlayer = {
    getState: () => snapshot,

    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },

    /* make sure the audio element exists and shows the saved surah's length on first open */
    init() {
        if (audio) return;
        if (state.currentSurah) {
            loadSource(state.currentSurah, state.currentTime);
        }
    },

    toggle() {
        const a = getAudio();
        if (state.isPlaying) { a.pause(); return; }
        errorStreak = 0;
        if (isLoaded(state.currentSurah) && a.readyState > 0) {
            a.play().catch(() => { });
        } else {
            playAt(state.currentSurah, state.currentTime);
        }
    },

    selectSurah(n) {   /* picked from the list: cue it up, don't play */
        errorStreak = 0;
        cue(n);
    },

    step(delta) {
        errorStreak = 0;
        if (delta < 0 && state.currentTime > QURAN_PREV_RESTART_BUFFER) { QuranPlayer.seek(0); return; }
        const next = state.currentSurah + delta;
        if (next < 1 || next > QURAN_SURAH_COUNT) return;
        cue(next);
    },

    seek(seconds) {
        const a = getAudio();
        const dur = a.duration;
        if (state.isPlaying && isFinite(dur) && dur > 0 && seconds >= dur - QURAN_END_EPS) {
            a.pause();
            state.currentTime = dur;
            state.isPlaying = false;
            emit(false);
            advance();
            return;
        }
        state.currentTime = Math.max(0, seconds || 0);
        try { a.currentTime = state.currentTime; } catch (e) { /* not ready */ }
        emit(true);
    },

    skip(delta) {
        if (state.duration <= 0) return;
        QuranPlayer.seek(Math.max(0, Math.min(state.duration, state.currentTime + delta)));
    },

    setReciter(id) {
        state.reciter = id;
        persist();
        cue(state.currentSurah);   /* new reciter loads on next play */
    },

    toggleFavorite(id) {
        const set = new Set(state.favorites);
        if (set.has(id)) set.delete(id); else set.add(id);
        state.favorites = Array.from(set);
        emit(true);
    },

    setAutoContinue(on) {
        state.autoContinue = !!on;
        emit(true);
    },

    toggleCompleted(n) {
        const surah = n || state.currentSurah;
        markCompleted(surah, !state.completed.includes(surah));
        emit(true);
    },

    resetKhatm() {
        state.completed = [];
        stopAll();
    },

    /* mini player's stop: pause and dismiss it (position is kept) */
    stopMini() {
        clearAdvanceTimer();
        state.wasPlayingBeforeAdhan = false;
        if (audio) audio.pause();
        state.isPlaying = false;
            state.advancing = false;
        state.miniPinned = false;
        emit(true);
    },

    /* pause pressed on the floating player: unlike pausing from the Qur'an tab, it keeps the player up */
    pauseFromMini() {
        if (!state.isPlaying) return;
        state.miniPinned = true;
        getAudio().pause();
    },

    pause() {
        if (state.isPlaying) getAudio().pause();
    },

    /* an adhan / alarm / preview interrupts playback; remember to resume afterwards */
    pauseForAdhan() {
        if (!state.isPlaying) return;
        state.wasPlayingBeforeAdhan = true;
        getAudio().pause();
    },

    resumeAfterAdhan() {
        if (!state.wasPlayingBeforeAdhan) return;
        state.wasPlayingBeforeAdhan = false;
        const t = Math.max(0, state.currentTime - QURAN_ADHAN_RESUME_REWIND);
        const a = getAudio();
        try { a.currentTime = t; } catch (e) { /* not seekable */ }
        state.currentTime = t;
        a.play().catch(() => { });
    }
};

export function useQuran() {
    const [snap, setSnap] = useState(QuranPlayer.getState());
    useEffect(() => {
        QuranPlayer.init();
        setSnap(QuranPlayer.getState());
        return QuranPlayer.subscribe(setSnap);
    }, []);
    return snap;
}
