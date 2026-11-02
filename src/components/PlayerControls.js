import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesome } from '../data/FontAwesome';

export const formatTime = (seconds) => {
    seconds = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = String(seconds % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/* The floating bottom-left audio control bar, rendered once by AudioPlayer for whichever source
   (adhan/alarm or Qur'an) is active. Presentational only: the caller owns the audio.
   While playing: pause + seek bar. While paused: play, rewind 5s and stop as well.
   The seek happens on release, so dragging doesn't fire a seek per pixel. */
export default function PlayerControls(
    { isPlaying, currentTime, duration, onToggle, onRewind, onStop, onSeek }) {

    const [scrub, setScrub] = useState(null);
    const shown = scrub !== null ? scrub : currentTime;
    const commit = () => { if (scrub !== null) onSeek(scrub); setScrub(null); };

    /* portaled to <body>: #root is its own stacking context, which would otherwise keep this
       beneath the menu (offcanvas) when it is open */
    return createPortal(
        <div className="audioPlayerFixed" style={{ visibility: 'visible' }}>
            <div className='d-flex flex-row gap-3'>
                <button className='btn btn-light audioPlayerBtn' onClick={onToggle}>{isPlaying ? FontAwesome.Pause : FontAwesome.Play}</button>
                {!isPlaying && <button className='btn btn-light audioPlayerBtn' onClick={onRewind}>{FontAwesome.Backward} 5s</button>}
                {!isPlaying && <button className='btn btn-light audioPlayerBtn' onClick={onStop}>{FontAwesome.Stop}</button>}
            </div>
            <div className='d-flex align-items-center gap-2 mt-2 w-100'>
                <input type='range' className='flex-grow-1' min={0} max={duration || 0} step={0.1} value={shown}
                    onChange={(e) => setScrub(parseFloat(e.target.value))}
                    onMouseUp={commit} onTouchEnd={commit} onKeyUp={commit} />
                <span className='text-light' style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatTime(shown)} / {formatTime(duration)}</span>
            </div>
        </div>,
        document.body
    )
}
