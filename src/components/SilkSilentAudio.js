import React, { useRef, useState, useContext } from 'react'
import { AppContext } from '../AppContext';
import audioSilence from '../mp3s/silence.mp3';

export default function SilkSilentAudio() {
       const { showMsg } = useContext(AppContext)
       const silencePlayer = useRef(null);
       const [isSilkOn, setIsSilkOn] = useState(false);
       const setSilkOn = (event) => {
              showMsg('AdhanClock is set to be always ON!');
              setIsSilkOn(true);
              if (silencePlayer.current) {
                     silencePlayer.current.currentTime = 0;
                     silencePlayer.current.volume = 0.1;
                     silencePlayer.current.play();
              }

       };
       const silenceContinue = () => {
              if (isSilkOn && silencePlayer.current) {
                     silencePlayer.current.currentTime = 0;
                     silencePlayer.current.play();
              }
       };
       return (
              <div id='silkSettingDiv' style={{ display: isSilkOn ? 'none' : 'block' }} >
                     <button className='btn btn-sm btn-primary' onClick={setSilkOn}>Click here to keep AdhanClock always ON on your Amazon device</button>
                     <audio id='silencePlayer' src={audioSilence} ref={silencePlayer} onPause={silenceContinue} onEnded={silenceContinue} />
              </div>
       )
}