import React, { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify';
import { SmartAzanClock } from './scripts/SmartAzanClock';
import { AAA } from './data/Audios';
import { DefaultSettings } from './data/DefaultSettings';
import Menu from './components/Menu';
import Loading from './components/Loading';
import Clock from './components/Clock';
import AudioPlayer from './components/AudioPlayer';
import SilkSilentAudio from './components/SilkSilentAudio'

export const AppContext = React.createContext();

export default function AppContextProvider() {

    const [showMenu, setShowMenu] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isSilkBrowser, setIsSilkBrowser] = useState(false);
    const [previewVakit, setPreviewVakit] = useState(null);   /* which prayer's adhan is being previewed from Settings */

    const [output, setOutput] = useState(() => {

        let settings = JSON.parse(localStorage.getItem('settings'));
        if (!settings) {
            setShowLoading(true);
            initUser('new user - with no settings');
            return null;
        }
        else {
            return SmartAzanClock.run('existing user - first load');
        }

    })

    useEffect(() => {

        const interval = setInterval(() => {
            let seconds = new Date().getSeconds();

            let settings = JSON.parse(localStorage.getItem('settings'));
            if (!settings || settings.settingsVersion !== DefaultSettings.settingsVersion) {
                initUser('initUser: settings removed or upgraded');
            }
            else {
                if (!output || seconds === 0 || showMenu) {
                    setOutput(SmartAzanClock.run('appContext-useEffect'))
                }
                setShowLoading(false);
            }
        }, 1000);
        return () => clearInterval(interval)
    })

    useEffect(() => {
        const userAgent = navigator.userAgent || '';
        if (userAgent.includes('Silk')) {
            setIsSilkBrowser(true);
        }
        requestWakeLock();
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
                setOutput(SmartAzanClock.run('on-visible-again'));
            }
        });
    }, [])

    const showMsg = (msg, type) => {
        if (type === "error")
            toast.error(msg, { position: toast.POSITION.BOTTOM_RIGHT });
        else
            toast.success(msg, { position: toast.POSITION.BOTTOM_RIGHT });
    }

    // show a toast that stays on screen until the user closes it
    const showPersistentToast = (msg) => {
        toast.info(msg, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false
        });
    }

    const updateSettings = (kv, msg) => {
        let currentSettings = JSON.parse(localStorage.getItem('settings'));
        let newSettings = { ...currentSettings, ...kv }
        localStorage.setItem('settings', JSON.stringify({ ...newSettings }));
        setOutput(SmartAzanClock.run("set" + JSON.stringify(kv)));
        if (msg)
            showMsg(msg);
    }

    const updateOffset = (vakit, op) => {

        let limit = 30;
        let currentSettings = JSON.parse(localStorage.getItem('settings'));
        let offsetSettings = currentSettings.offsetSettings;
        let newOffset = {};
        let finalOffsets = {}
        let newValue = offsetSettings[vakit] + (op === '+' ? 1 : -1)
        if (op === '0') {
            newValue = 0;
        }
        if (newValue > limit || newValue < -limit) {
            showMsg('Limit reached: ' + limit + ' minutes')
            return;
        }
        newOffset[vakit] = newValue
        finalOffsets['offsetSettings'] = { ...offsetSettings, ...newOffset };
        let newSettings = { ...currentSettings, ...finalOffsets }
        localStorage.setItem('settings', JSON.stringify({ ...newSettings }));
        setOutput(SmartAzanClock.run("set" + JSON.stringify(finalOffsets)));
    }

    const requestWakeLock = async () => {
        let wlock;
        try {
            wlock = await navigator.wakeLock.request('screen');
            dol('Screen Wake Lock is active');
        } catch (err) {
            /* console.error(err); */
        }
    };

    /* the preview button toggles: pressing it again while its adhan plays stops it */
    const previewAudio = (id, vakit) => {
        const start = () => {
            setPreviewVakit(vakit);
            let AU = new AAA(id, output.time, false);
            localStorage.setItem("AAA", JSON.stringify({ ...AU }));
        };
        if (isAudioPlaying || previewVakit) {   /* previewVakit stays set while the preview is paused */
            window.dispatchEvent(new Event('stopAdhanAudio'));
            if (vakit !== previewVakit) setTimeout(start, 100);   /* switching to another prayer's preview */
            return;
        }
        start();
    }

    const refreshClock = () => {
        window.location.reload();
    }

    return (
        <AppContext.Provider value={{ showMenu, setShowMenu, showMsg, showPersistentToast, isAudioPlaying, setIsAudioPlaying, previewVakit, setPreviewVakit, ...output, updateSettings, updateOffset, previewAudio, refreshClock, dol }}>
            {output ? <Clock /> : null}
            {showLoading ? <Loading /> : null}
            {output ? <Menu /> : null}
            {output ? <AudioPlayer /> : null}
            <ToastContainer autoClose={2000} limit={1} />
            {isSilkBrowser && <SilkSilentAudio />}
        </AppContext.Provider>
    )

}

const dol = (log) => { /* development only error */
    if (process.env.NODE_ENV === 'development')
        console.log(log + ' (dev only log)')
}

const initUser = (info) => {

    dol('InitUser: ' + (info ?? ''));

    let settings = { ...DefaultSettings };
    let currentSettings = JSON.parse(localStorage.getItem('settings'));

    if (isIOS()) {
        settings.deviceSettings.azanCallsEnabled = 'N';
    }

    if (currentSettings) {
        settings['locationSettings'] = { ...DefaultSettings.locationSettings, ...currentSettings.locationSettings }
        settings['calculationSettings'] = { ...DefaultSettings.calculationSettings, ...currentSettings.calculationSettings }
        settings['azanSettings'] = { ...DefaultSettings.azanSettings, ...currentSettings.azanSettings }
        settings['deviceSettings'] = { ...DefaultSettings.deviceSettings, ...currentSettings.deviceSettings }
        settings['offsetSettings'] = { ...DefaultSettings.offsetSettings, ...currentSettings.offsetSettings }
        settings['settingsVersion'] = DefaultSettings.settingsVersion;
        if (currentSettings.alarmSettings)
            settings['alarmSettings'] = currentSettings.alarmSettings;
        if (currentSettings.naflAlarmSettings)
            settings['naflAlarmSettings'] = currentSettings.naflAlarmSettings;
        localStorage.setItem('settings', JSON.stringify({ ...settings }));
        dol('Previous version carried over: ' + settings.locationSettings.address);
    }
    else {
        let ceCallURL = 'https://smartazanclock.com/iplocation';
        fetch(ceCallURL, { method: 'POST' }).then((response) => {
            if (response.status === 200) {
                response.json().then((data) => {
                    settings.locationSettings.address = data.address;
                    settings.locationSettings.lat = data.lat;
                    settings.locationSettings.lng = data.lng;
                    settings.locationSettings.timeZoneID = data.timeZoneID;
                    localStorage.setItem('settings', JSON.stringify({ ...settings }));
                    dol('Initiated using IP:' + settings.locationSettings.address);
                });
            }
        }).catch(err => { localStorage.setItem('settings', JSON.stringify({ ...settings })); dol(err); });
    }
}

const isIOS = () => {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}
