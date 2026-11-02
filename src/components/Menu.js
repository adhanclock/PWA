import React, { useContext, useEffect } from 'react'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { Tab } from 'bootstrap';
import { Tabs } from 'react-bootstrap';
import Settings from './Settings'
import Quran from './Quran';
import Calendar from './Calendar';
import Salawat from './Salawat';
import salawatIcon from '../images/salawat.svg';
import { QuranPlayer } from '../scripts/QuranPlayer';
import Alarms from './Alarms';
import About from './About';
import { AppContext } from '../AppContext';
import { FontAwesome } from '../data/FontAwesome';


export default function Menu() {

    const { showMenu, setShowMenu, deviceSettings, refreshClock } = useContext(AppContext)

    /* opening the menu while the Qur'an is playing lands on the Qur'an tab instead of Settings */
    useEffect(() => {
        if (!showMenu || !navigator.onLine || !QuranPlayer.getState().isPlaying) return;
        const t = setTimeout(() => {
            const tab = document.getElementById('quran-tab');
            if (tab) tab.click();
        }, 50);
        return () => clearTimeout(t);
    }, [showMenu]);

    return (
        <Offcanvas placement="end" scroll="false" show={showMenu} onHide={() => setShowMenu(false)} className="bg-dark">
            <Offcanvas.Header className='py-2'>
                <div className='d-flex flex-row w-100 align-items-center justify-content-between'>
                    <div id='topMenu'>
                        <ul className="nav nav-pills">
                            <li className='nav-item'>
                                <button className="nav-link active fs-4" id="home-tab" data-bs-toggle="tab"
                                    data-bs-target="#home" type="button" role="tab" aria-controls="home" aria-selected="true">
                                    {FontAwesome.Gear}
                                </button>
                            </li>

                            {deviceSettings.azanCallsEnabled === 'Y' ? (<li className='nav-item'>
                                <button className="nav-link fs-4" id="alarms-tab" data-bs-toggle="tab"
                                    data-bs-target="#alarms" type="button" role="tab">
                                    {FontAwesome.Bell}
                                </button>
                            </li>) : null}

                            <li className='nav-item'>
                                <button className="nav-link fs-4" id="calendar-tab" data-bs-toggle="tab"
                                    data-bs-target="#calendar" type="button" role="tab">
                                    {FontAwesome.Calendar}
                                </button>
                            </li>

                            {navigator.onLine ? (<li className='nav-item'>
                                <button className="nav-link fs-4" id="salawat-tab" data-bs-toggle="tab"
                                    data-bs-target="#salawat" type="button" role="tab">
                                    <img src={salawatIcon} alt="Salawat" style={{ height: '0.95em', width: 'auto', verticalAlign: '-0.1em' }} />
                                </button>
                            </li>) : null}

                            {navigator.onLine ? (<li className='nav-item'>
                                <button className="nav-link fs-4" id="quran-tab" data-bs-toggle="tab"
                                    data-bs-target="#quran" type="button" role="tab">
                                    {FontAwesome.Book}
                                </button>
                            </li>) : null}


                            <li className='nav-item'>
                                <button className="nav-link fs-4" id="about-tab" data-bs-toggle="tab"
                                    data-bs-target="#about" type="button" role="tab">
                                    {FontAwesome.Info}
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className='px-3'>
                        <span onClick={() => { setShowMenu(false) }} className="pointer bg-dark text-secondary fs-2">
                            {FontAwesome.Close}
                        </span>
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="tab-content pt-0">
                    <div className="tab-pane fade show active" id="home">
                        <div className='px-3'>
                            <Settings />
                            <div className='d-flex flex-row justify-content-between align-items-center gap-3 mt-3'>

                                {!navigator.onLine ? (<div>
                                    <span title='Looks like you are no longer connected to the Internet. No worries. AdhanClock will still work.' className='badge'>
                                        {FontAwesome.Plug} Offline
                                    </span>
                                </div>) : null}

                                {navigator.onLine ? (<div className='col-6'>
                                    <button className='btn btn-sm col-12 btn-primary' type='button' onClick={refreshClock}>Refresh</button>
                                </div>) : null}

                                {navigator.onLine ? (<div className='col-6'>
                                    <a className='btn btn-sm col-12 btn-danger' href="/reset/">Reset</a>
                                </div>) : null}

                            </div>
                        </div>
                    </div>
                    <div className="tab-pane fade" id="calendar">
                        <div className='px-3 text-light'>
                            <Calendar />
                        </div>
                    </div>
                    <div className="tab-pane fade" id="salawat">
                        <div className='px-3 text-light'>
                            <Salawat />
                        </div>
                    </div>
                    <div className="tab-pane fade" id="quran">
                        <div className='px-3 text-light'>
                            <Quran />
                        </div>
                    </div>
                    <div className="tab-pane fade" id="about">
                        <div className='px-3 text-light'>
                            <About />
                        </div>
                    </div>
                    <div className="tab-pane fade" id="alarms">
                        <div className='px-3 text-light'>
                            <Alarms />
                        </div>
                    </div>
                </div>
            </Offcanvas.Body>
        </Offcanvas >
    )
}



