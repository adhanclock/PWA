import React, { useEffect, useRef, useState } from 'react'
import '../css/Quran.css';
import progressSvg from '../images/quran-progress.svg';
import { quranSurahs, quranSajdaSurahs, quranReciters, QURAN_SURAH_COUNT } from '../data/QuranData';
import { QuranPlayer, useQuran } from '../scripts/QuranPlayer';

const SAJDA_TIP = 'This surah contains a verse of prostration (ayat as-sajdah)';

/* m:ss normally; h:mm:ss once past an hour (withHours keeps the elapsed/total pair aligned) */
const fmtTime = (sec, withHours) => {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const ss = (s < 10 ? '0' : '') + s;
    if (withHours || h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + ss;
    return m + ':' + ss;
};

export const Svg = ({ children, ...p }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...p}>{children}</svg>;

export const Arrow = ({ dir, className = '', ...p }) => {
    const id = 'quranArrowGold' + dir;
    return (
        <button type="button" className={'quran-disp-nav quran-disp-' + (dir === 'L' ? 'prev' : 'next') + (className ? ' ' + className : '')} {...p}>
            <Svg aria-hidden="true">
                <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fdeeb8" /><stop offset="0.55" stopColor="#e7cf86" /><stop offset="1" stopColor="#d4af37" /></linearGradient></defs>
                <path d={dir === 'L' ? 'M16 3 6.9 11.3Q6.2 12 6.9 12.7L16 21 11.6 12Z' : 'M8 3 17.1 11.3Q17.8 12 17.1 12.7L8 21 12.4 12Z'} fill={'url(#' + id + ')'} />
            </Svg>
        </button>
    );
};

export const Check = () => <Svg fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></Svg>;

const Heart = () => (
    <Svg aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2 0 3.2 1 4 2.2h4C14.8 6 16 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21z" />
    </Svg>
);

function KhatmBar({ completed, current }) {
    const host = useRef(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let dead = false;
        fetch(progressSvg).then(r => r.text()).then(txt => {
            if (dead || !host.current) return;
            host.current.innerHTML = txt;
            const svg = host.current.querySelector('svg');
            if (svg) {                        /* crop to the bar; the 8px numbers are sub-pixel at this width */
                svg.setAttribute('viewBox', '0 111 1000 42');
                svg.removeAttribute('width');
                svg.removeAttribute('height');
            }
            setLoaded(true);
        }).catch(() => { });
        return () => { dead = true; };
    }, []);

    useEffect(() => {
        if (!loaded || !host.current) return;
        const done = new Set(completed);
        for (let n = 1; n <= QURAN_SURAH_COUNT; n++) {
            const g = host.current.querySelector('#surah-' + String(n).padStart(3, '0'));
            if (!g) continue;
            /* completion wins; otherwise the loaded surah is gold, the rest slate */
            const isDone = done.has(n);
            const isCur = !isDone && n === current;
            g.classList.toggle('read', isDone);
            g.classList.toggle('current', isCur);
            g.classList.toggle('unread', !isDone && !isCur);
        }
    }, [loaded, completed, current]);

    return <div id="quranKhatmBar" ref={host} className="quran-khatm-bar" />;
}

function SurahPicker({ q, onClose }) {
    const listRef = useRef(null);
    const done = new Set(q.completed);

    useEffect(() => {
        const cur = listRef.current && listRef.current.querySelector('.quran-srow.current');
        if (cur) cur.scrollIntoView({ block: 'center' });
    }, []);

    return (
        <div className="quran-picker" style={{ display: 'flex' }}>
            <div className="quran-picker-head">
                <span>Surah</span>
                <button type="button" className="quran-picker-close" aria-label="Close" onClick={onClose}>&times;</button>
            </div>
            <div ref={listRef} className="quran-picker-list csb">
                {quranSurahs.map(s => (
                    <div key={s.number} className={'quran-srow' + (s.number === q.currentSurah ? ' current' : '')}
                        data-surah={s.number} onClick={() => { QuranPlayer.selectSurah(s.number); onClose(); }}>
                        <span className="quran-srow-num">{s.number}</span>
                        <span className="quran-srow-name">{s.englishName}</span>
                        <span className="quran-srow-ar">{s.name}</span>
                        {quranSajdaSurahs.has(s.number)
                            ? <span className="quran-srow-sajda" title={SAJDA_TIP} aria-label={SAJDA_TIP}>۩</span>
                            : <span className="quran-srow-sajda" aria-hidden="true"></span>}
                        <button type="button" aria-label="Mark completed"
                            className={'quran-srow-check' + (done.has(s.number) ? ' done' : '')}
                            onClick={(e) => { e.stopPropagation(); QuranPlayer.toggleCompleted(s.number); }}>
                            <Check />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReciterPicker({ q, onClose }) {
    const listRef = useRef(null);
    /* order is fixed while the picker is open so tapping a heart never moves the row under the finger */
    const [order] = useState(() => {
        const fav = new Set(q.favorites);
        const all = quranReciters.slice().sort((a, b) => a.englishName.localeCompare(b.englishName, 'en', { sensitivity: 'base' }));
        return [...all.filter(r => fav.has(r.identifier)), ...all.filter(r => !fav.has(r.identifier))];
    });

    useEffect(() => {
        const cur = listRef.current && listRef.current.querySelector('.quran-picker-item.current');
        if (cur) cur.scrollIntoView({ block: 'center' });
    }, []);

    return (
        <div className="quran-picker" style={{ display: 'flex' }}>
            <div className="quran-picker-head">
                <span>Reciter</span>
                <button type="button" className="quran-picker-close" aria-label="Close" onClick={onClose}>&times;</button>
            </div>
            <div ref={listRef} className="quran-picker-list csb">
                {order.map(r => {
                    const faved = q.favorites.includes(r.identifier);
                    return (
                        <div key={r.identifier} className={'quran-picker-item' + (r.identifier === q.reciter ? ' current' : '')}
                            onClick={() => { if (r.identifier !== q.reciter) QuranPlayer.setReciter(r.identifier); onClose(); }}>
                            <span className="quran-picker-item-text">
                                <span className="quran-picker-item-name">{r.englishName}</span>
                                <span className="quran-picker-item-ar">{r.name}</span>
                            </span>
                            <button type="button" aria-label="Favorite" aria-pressed={faved}
                                className={'quran-reciter-fav' + (faved ? ' faved' : '')}
                                onClick={(e) => { e.stopPropagation(); QuranPlayer.toggleFavorite(r.identifier); }}>
                                <Heart />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Quran() {
    const q = useQuran();
    const [picker, setPicker] = useState(null);   /* 'surah' | 'reciter' | null */
    const [scrub, setScrub] = useState(null);     /* seconds while dragging the seek bar */
    const [pos, setPos] = useState(q.currentTime);
    const [anim, setAnim] = useState(false);
    const lastSurah = useRef(q.currentSurah);
    const firstRender = useRef(true);

    /* interpolate the position between the store's updates */
    const base = useRef({ time: 0, wall: 0 });
    base.current = { time: q.currentTime, wall: Date.now() };
    useEffect(() => {
        setPos(q.currentTime);
        if (!q.isPlaying) return;
        const t = setInterval(() => {
            const cur = base.current.time + (Date.now() - base.current.wall) / 1000;
            setPos(q.duration > 0 ? Math.min(cur, q.duration) : cur);
        }, 500);
        return () => clearInterval(t);
    }, [q.currentTime, q.isPlaying, q.duration]);

    /* title fade-in only on an actual surah change */
    useEffect(() => {
        if (firstRender.current) { firstRender.current = false; return; }
        if (q.currentSurah !== lastSurah.current) {
            lastSurah.current = q.currentSurah;
            setAnim(false);
            requestAnimationFrame(() => setAnim(true));
        }
    }, [q.currentSurah]);

    const n = q.currentSurah;
    const s = quranSurahs.find(x => x.number === n);
    const reciter = quranReciters.find(r => r.identifier === q.reciter);
    const withHours = q.duration >= 3600;
    const shown = scrub !== null ? scrub : pos;
    const pct = q.duration > 0 ? Math.min(1000, Math.max(0, (shown / q.duration) * 1000)) : 0;
    const done = q.completed.includes(n);

    const onSeekEnd = () => {
        if (scrub !== null && q.duration > 0) QuranPlayer.seek(scrub);
        setScrub(null);
    };

    return (
        <div id="quranTab">
            <div className="quran-player d-flex flex-column h-100">
                <div className="quran-controls d-flex flex-column flex-grow-1 justify-content-center">

                    <div className={'quran-display' + (anim ? ' quran-anim' : '')}>
                        <Arrow dir="L" aria-label="Previous surah" title="Previous surah" disabled={n <= 1} onClick={() => QuranPlayer.step(-1)} />
                        <Arrow dir="R" aria-label="Next surah" title="Next surah" disabled={n >= QURAN_SURAH_COUNT} onClick={() => QuranPlayer.step(1)} />
                        <div className="quran-surah-caption" aria-label={'Surah ' + n}>
                            <span className="quran-surah-number">{n}</span>
                        </div>
                        <div className="quran-surah-arabic" onClick={() => setPicker('surah')} style={{ cursor: 'pointer' }}>{s ? s.name : ''}</div>
                        <div className="quran-surah-name-row">
                            <button type="button" className="quran-name-link" aria-label="Change surah" onClick={() => setPicker('surah')}>
                                <span className="quran-surah-name">{s ? s.englishName : 'Surah ' + n}</span>
                            </button>
                            <span className="quran-sajda-badge" aria-hidden="true" title={SAJDA_TIP}
                                style={{ display: quranSajdaSurahs.has(n) ? '' : 'none' }}><span className="quran-sajda-mark">۩</span></span>
                        </div>
                        <div className="quran-check-row">
                            <span className="quran-check-center">
                                <span className={'quran-name-check' + (done ? ' done' : '')} role="button" aria-label="Toggle completed"
                                    onClick={() => QuranPlayer.toggleCompleted()}><Check /></span>
                            </span>
                        </div>
                        <div className="quran-links-row d-flex flex-row align-items-center justify-content-center">
                            <button type="button" className="quran-reciter-btn" aria-label="Reciter"
                                title={'Reciter: ' + (reciter ? reciter.englishName : q.reciter)} onClick={() => setPicker('reciter')}>
                                <Svg className="quran-mic" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="19" x2="12" y2="22" />
                                </Svg>
                                <span className="quran-reciter-name">{reciter ? reciter.englishName : q.reciter}</span>
                            </button>
                            <a className="quran-reciter-btn quran-com-link" target="_blank" rel="noopener noreferrer"
                                aria-label="Open this surah on quran.com" title="Open on quran.com" href={'https://quran.com/' + n}>
                                <Svg className="quran-mic" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </Svg>
                                <span className="quran-reciter-name">{'quran.com/' + n}</span>
                            </a>
                        </div>
                    </div>

                    <div className="quran-playback d-flex flex-column">
                        <div className="quran-progress-row">
                            <div className="quran-time d-flex flex-row justify-content-between">
                                <span>{fmtTime(shown, withHours)}</span>
                                <span>{fmtTime(q.duration, withHours)}</span>
                            </div>
                            <input type="range" className="quran-progress" min="0" max="1000" step="1" aria-label="Seek"
                                value={pct} style={{ '--quran-pct': (pct / 10) + '%' }}
                                onChange={(e) => setScrub((e.target.value / 1000) * (q.duration || 0))}
                                onMouseUp={onSeekEnd} onTouchEnd={onSeekEnd} onKeyUp={onSeekEnd} />
                        </div>

                        <div className="quran-transport d-flex flex-row align-items-center">
                            <button type="button" className="quran-skip" aria-label="Back 10 seconds" onClick={() => QuranPlayer.skip(-10)}>
                                <Svg fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                                    <text x="12" y="15.5" fontSize="7" fontWeight="700" stroke="none" fill="currentColor" textAnchor="middle" fontFamily="sans-serif">10</text>
                                </Svg>
                            </button>
                            <button type="button" className="quran-nav-btn" aria-label="Previous" onClick={() => QuranPlayer.step(-1)}>
                                <Svg fill="currentColor"><path d="M7 6h2v12H7z" /><path d="M20 6v12l-9-6z" /></Svg>
                            </button>
                            <button type="button" className={'quran-toggle' + (q.isPlaying ? ' playing' : '')}
                                aria-label={q.isPlaying ? 'Pause' : 'Listen'} onClick={() => QuranPlayer.toggle()}>
                                <Svg className="qicon qplay" fill="currentColor"><path d="M8 5v14l11-7z" /></Svg>
                                <Svg className="qicon qpause" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></Svg>
                            </button>
                            <button type="button" className="quran-nav-btn" aria-label="Next" onClick={() => QuranPlayer.step(1)}>
                                <Svg fill="currentColor"><path d="M15 6h2v12h-2z" /><path d="M4 6v12l9-6z" /></Svg>
                            </button>
                            <button type="button" className="quran-skip" aria-label="Forward 10 seconds" onClick={() => QuranPlayer.skip(10)}>
                                <Svg fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
                                    <text x="12" y="15.5" fontSize="7" fontWeight="700" stroke="none" fill="currentColor" textAnchor="middle" fontFamily="sans-serif">10</text>
                                </Svg>
                            </button>
                        </div>
                    </div>

                    <div className="quran-khatm">
                        <div className="quran-khatm-head">
                            <span>Khatm progress</span>
                            <span>{q.completed.length + ' / ' + QURAN_SURAH_COUNT}</span>
                        </div>
                        <KhatmBar completed={q.completed} current={n} />
                    </div>

                    <div className="quran-footer">
                        <button type="button" className="quran-auto-toggle" role="switch" aria-checked={q.autoContinue}
                            onClick={() => QuranPlayer.setAutoContinue(!q.autoContinue)}>
                            <span className="quran-auto-label">Auto-continue next surah</span>
                            <span className="quran-switch" aria-hidden="true"><span className="quran-switch-knob"></span></span>
                        </button>
                    </div>
                </div>
            </div>

            {q.completed.length >= QURAN_SURAH_COUNT && (
                <div className="quran-congrats-overlay" style={{ display: 'flex' }}>
                    <div className="quran-congrats-inner">
                        <div className="quran-congrats-flourish" aria-hidden="true"><span className="quran-congrats-diamond"></span></div>
                        <div className="quran-congrats-text">Congratulations on your khatm!</div>
                        <div className="quran-congrats-dua csb" dir="rtl" lang="ar">
                            <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ <span className="quran-dua-divider" aria-hidden="true">،</span> الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ<span className="quran-dua-comma">،</span> وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَأَصْحَابِهِ أَجْمَعِينَ <span className="quran-dua-divider" aria-hidden="true">،</span> اللَّهُمَّ رَبَّنَا يَا رَبَّنَا<span className="quran-dua-comma">،</span> تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ<span className="quran-dua-comma">،</span> وَتُبْ عَلَيْنَا يَا مَوْلَانَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ <span className="quran-dua-divider" aria-hidden="true">،</span> وَاهْدِنَا إِلَى الْحَقِّ وَإِلَى صِرَاطٍ مُسْتَقِيمٍ<span className="quran-dua-comma">،</span> وَوَفِّقْنَا لِاتِّبَاعِهِ<span className="quran-dua-comma">،</span> بِبَرَكَةِ الْقُرْآنِ الْعَظِيمِ وَبِحُرْمَةِ حَبِيبِكَ وَرَسُولِكَ الْكَرِيمِ <span className="quran-dua-divider" aria-hidden="true">،</span> وَاعْفُ عَنَّا يَا كَرِيمُ<span className="quran-dua-comma">،</span> وَاعْفُ عَنَّا يَا رَحِيمُ<span className="quran-dua-comma">،</span> وَاغْفِرْ لَنَا ذُنُوبَنَا بِفَضْلِكَ وَكَرَمِكَ يَا أَكْرَمَ الْأَكْرَمِينَ وَيَا أَرْحَمَ الرَّاحِمِينَ <span className="quran-dua-divider" aria-hidden="true">،</span> اللَّهُمَّ زَيِّنَّا بِزِينَةِ الْقُرْآنِ<span className="quran-dua-comma">،</span> وَأَكْرِمْنَا بِكَرَامَةِ الْقُرْآنِ<span className="quran-dua-comma">،</span> وَشَرِّفْنَا بِشَرَافَةِ الْقُرْآنِ<span className="quran-dua-comma">،</span> وَأَلْبِسْنَا خِلْعَةَ الْقُرْآنِ<span className="quran-dua-comma">،</span> وَأَدْخِلْنَا الْجَنَّةَ بِشَفَاعَةِ الْقُرْآنِ <span className="quran-dua-divider" aria-hidden="true">،</span> وَارْحَمْ جَمِيعَ أُمَّةِ مُحَمَّدٍ يَا رَحِيمُ يَا رَحْمَٰنُ <span className="quran-dua-divider" aria-hidden="true">،</span> اللَّهُمَّ اجْعَلِ الْقُرْآنَ لَنَا فِي الدُّنْيَا قَرِينًا<span className="quran-dua-comma">،</span> وَفِي الْقَبْرِ مُؤْنِسًا<span className="quran-dua-comma">،</span> وَيَوْمَ الْقِيَامَةِ شَفِيعًا<span className="quran-dua-comma">،</span> وَعَلَى الصِّرَاطِ نُورًا<span className="quran-dua-comma">،</span> وَإِلَى الْجَنَّةِ رَفِيقًا<span className="quran-dua-comma">،</span> وَمِنَ النَّارِ سِتْرًا وَحِجَابًا<span className="quran-dua-comma">،</span> وَإِلَى الْخَيْرَاتِ كُلِّهَا دَلِيلًا وَإِمَامًا <span className="quran-dua-divider" aria-hidden="true">،</span> بِفَضْلِكَ وَجُودِكَ وَكَرَمِكَ يَا أَكْرَمَ الْأَكْرَمِينَ وَيَا أَرْحَمَ الرَّاحِمِينَ <span className="quran-dua-divider" aria-hidden="true">،</span> يَا قَاضِيَ الْحَاجَاتِ<span className="quran-dua-comma">،</span> وَيَا مُجِيبَ الدَّعَوَاتِ<span className="quran-dua-comma">،</span> اسْتَجِبْ لِدُعَائِنَا بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ <span className="quran-dua-divider" aria-hidden="true">،</span> وَصَلَّى اللَّهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ <span className="quran-dua-divider" aria-hidden="true">،</span> سُبْحَانَ رَبِّكَ رَبِّ الْعِزَّةِ عَمَّا يَصِفُونَ<span className="quran-dua-comma">،</span> وَسَلَامٌ عَلَى الْمُرْسَلِينَ<span className="quran-dua-comma">،</span> وَالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ</p>
                        </div>
                        <button type="button" className="quran-congrats-reset" onClick={() => QuranPlayer.resetKhatm()}>Restart</button>
                    </div>
                </div>
            )}

            {picker === 'surah' && <SurahPicker q={q} onClose={() => setPicker(null)} />}
            {picker === 'reciter' && <ReciterPicker q={q} onClose={() => setPicker(null)} />}
        </div>
    )
}
