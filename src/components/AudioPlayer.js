import React, { useContext, useRef, useEffect, useState } from 'react'
import { AppContext } from '../AppContext';
import { Audios } from '../data/Audios';
import { QuranPlayer, quranMiniShown, useQuran } from '../scripts/QuranPlayer';
import { FontAwesome } from '../data/FontAwesome';
import PlayerControls from './PlayerControls';

/* The one audio UI. Owns the adhan/alarm <audio> element and renders the single floating
   control bar (bottom-left) for whichever source is active: the adhan/alarm/preview first,
   otherwise the Qur'an. All visibility is derived from state, nothing toggles styles by hand. */
export default function AudioPlayer() {

    const { time, locationSettings, dol, setIsAudioPlaying, setPreviewVakit } = useContext(AppContext)
    const audioPlayer = useRef(null)
    const [adhanVisible, setAdhanVisible] = useState(false)     /* adhan control bar up (playing or paused) */
    const [needsTap, setNeedsTap] = useState(false)             /* browser blocked autoplay: "tap to play" overlay */
    const [isPaused, setIsPaused] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const quran = useQuran()

    /* runs after every render on purpose: it is the once-a-second check for an adhan/alarm that is due */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {

        if (!audioPlayer.current.paused) {
            dol('Already playing audio.')
            return;
        }

        let AU = JSON.parse(localStorage.getItem("AAA"));
        if (AU) {
            if (AU.time === time) {
                if (!AU.isPlayed) {
                    AU.isPlayed = true;
                    localStorage.setItem("AAA", JSON.stringify({ ...AU }));
                    let audio = Audios.find(a => a.id === AU.id);
                    audioPlayer.current.src = audio.source;

                    let promise = audioPlayer.current.play();
                    if (promise) {
                        promise.then(_ => {
                            // autoplay started!
                            dol('Azan called: ' + locationSettings.address);
                            setAdhanVisible(true);
                            setNeedsTap(false);
                        }).catch(error => {
                            dol(error);
                            setAdhanVisible(false);
                            setNeedsTap(true);
                        });
                    }
                }
            }
            else {
                localStorage.removeItem("AAA");
                setNeedsTap(false);
            }

        }

    })

    const stopAudio = () => {
        setIsAudioPlaying(false);
        setPreviewVakit(null);
        audioPlayer.current.pause();
        audioPlayer.current.currentTime = 0;
        setAdhanVisible(false);
        setNeedsTap(false);
        QuranPlayer.resumeAfterAdhan();   /* adhan/alarm over: pick the Qur'an back up */
    }

    /* lets the Settings preview button stop the adhan it started */
    useEffect(() => {
        window.addEventListener('stopAdhanAudio', stopAudio);
        return () => window.removeEventListener('stopAdhanAudio', stopAudio);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const playAdhan = () => {
        audioPlayer.current.play();
        setAdhanVisible(true);
        setNeedsTap(false);
    }

    const toggleAdhan = () => {
        if (audioPlayer.current.paused)
            playAdhan();
        else
            audioPlayer.current.pause();
    }

    const audioPaused = () => {
        if (audioPlayer.current.ended) return;
        setIsAudioPlaying(false);
        setIsPaused(true);
    }

    const audioPlayed = () => {
        QuranPlayer.pauseForAdhan();   /* adhan/alarm/preview interrupts Qur'an playback */
        setIsAudioPlaying(true)
        setIsPaused(false);
    }

    /* the control bar's source: adhan first, else the Qur'an while it plays (or was paused from the bar) */
    let controls = null;
    if (adhanVisible) {
        controls = {
            key: 'adhan', isPlaying: !isPaused, currentTime, duration,
            onToggle: toggleAdhan,
            onRewind: () => { audioPlayer.current.currentTime = Math.max(0, audioPlayer.current.currentTime - 5); },
            onStop: stopAudio,
            onSeek: (t) => { audioPlayer.current.currentTime = t; setCurrentTime(t); }
        };
    } else if (quranMiniShown(quran)) {
        controls = {
            key: 'quran', isPlaying: quran.isPlaying, currentTime: quran.currentTime, duration: quran.duration,
            onToggle: () => (quran.isPlaying ? QuranPlayer.pauseFromMini() : QuranPlayer.toggle()),
            onRewind: () => QuranPlayer.skip(-5),
            onStop: () => QuranPlayer.stopMini(),
            onSeek: (t) => QuranPlayer.seek(t)
        };
    }

    return (
        <>
            <audio id="audioPlayer" ref={audioPlayer} onPlay={audioPlayed} onPause={audioPaused} onEnded={stopAudio}
                onTimeUpdate={() => setCurrentTime(audioPlayer.current.currentTime)}
                onLoadedMetadata={() => setDuration(audioPlayer.current.duration)} style={{ display: 'none' }} />
            {controls && <PlayerControls {...controls} />}
            {needsTap && <div onClick={playAdhan} className="audioButtonDiv" style={{ visibility: 'visible' }}>
                <div className='d-flex h-100 justify-content-start align-items-top'>
                    <div className='fs-4 text-light p-2'>
                        {FontAwesome.Play} Tap screen to play audio
                    </div>
                </div>
            </div>}
        </>
    )
}
