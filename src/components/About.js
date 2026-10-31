import React from 'react'
import { FontAwesome } from '../data/FontAwesome';
import lenovoM8Image from '../images/lenovo-m8-tab.jpg'
import lenovoM10Image from '../images/lenovo-m10-tab.jpg'
import zakatTrackerLogo from '../images/zakattracker-logo.svg'

export default function About() {

    return (
        <div>

            As Salamu Alaykum
            <p></p>
            Use AdhanClock.com to turn any Android, Amazon Echo or Raspberry Pi device into an actual adhan clock.
            <p></p>

            <div className='d-flex flex-column gap-2'>
                <div className='d-flex flex-row'>
                    <div className='mx-1'>{FontAwesome.Check}</div>
                    <div>Free, safe and open source.</div>
                </div>

                <div className='d-flex flex-row'>
                    <div className='mx-1'>{FontAwesome.Check}</div>
                    <div>No registrations or subscriptions.</div>
                </div>

                <div className='d-flex flex-row'>
                    <div className='mx-1'>{FontAwesome.Check}</div>
                    <div>Works even when offline.</div>
                </div>

            </div>

            <p></p>

            <div className='badge bg-warning text-dark'>Android or RPi Devices</div>
            <div className='ps-1 mt-1'>
                Add adhanclock.com to your home screen and run it.
            </div>

            <p></p>

            <div className='badge bg-warning text-dark'>Amazon Echo Devices</div>
            <div className='ps-1 mt-1'>
                Say, "Alexa, open Silk browser", navigate to adhanclock.com and click on the button to keep it always ON.
            </div>

            <div className='rtl fs-5 text-center mt-4 bg-success rounded p-2'>
                الحمد لله والشكر لله، أزكى صلاتي وسلامي على رسول الله وآله وصحبه أجمعين
            </div>
            <p></p>
            {
                navigator.onLine ? (
                    <div className='card p-0'>
                        <div className='card-body px-2 ps-2 pb-0'>

                            <div className='d-flex flex-row align-items-start'>

                                <div className='text-start flex-grow-1'>
                                    <div className='badge text-dark'>Device suggestions</div>

                                    <a className='badge text-dark' href="https://www.google.com/search?tbm=shop&q=amazon+echo+show" target="_blank">
                                        Amazon Echo Show
                                    </a>
                                    <a className='badge text-dark' href="https://www.google.com/search?tbm=shop&q=lenovo+m8+smart+tab" target="_blank">
                                        Lenovo M8
                                    </a>
                                    <a className='badge text-dark' href="https://www.google.com/search?tbm=shop&q=lenovo+m10+smart+dock" target="_blank">
                                        Lenovo M10
                                    </a>
                                </div>
                                <div className='text-center'>
                                    <a href="https://www.google.com/search?tbm=shop&q=lenovo+m8+smart+tab" target="_blank">
                                        <img src={lenovoM8Image} className="img-fluid" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null
            }

            <p></p>

            <a className='d-flex align-items-center gap-3 text-decoration-none rounded p-2 mt-2'
                href="https://zakattracker.com/" target="_blank" rel="noreferrer" style={{ backgroundColor: 'white' }}>
                <img src={zakatTrackerLogo} alt="Zakat Tracker" width="44" height="44" className="rounded" />
                <div>
                    <div className='fw-bold text-dark'>ZakatTracker.com</div>
                    <div className='text-muted small'>Calculate and Track Your Zakat Easily</div>
                </div>
            </a>

            <div className='d-flex flex-row justify-content-between gap-1 align-items-center mt-4'>
                <div>
                    <a className='whiteLink fs-3' title='Privacy Policy' href="/privacy-policy/" rel="noreferrer">{FontAwesome.Shield}</a>
                </div>
                <div>
                    <a className='whiteLink fs-3' title='Open Source Code' href="https://github.com/adhanclock/pwa" rel="noreferrer">{FontAwesome.Github}</a>
                </div>
                <div>
                    <a className='whiteLink fs-3' title='Prayer Times Chrome Extension' href="https://chrome.google.com/webstore/detail/prayer-times-chrome-exten/fbkmgnkliklgbmanjkmiihkdioepnkce">{FontAwesome.Chrome}</a>
                </div>
                <div>
                    <a className='whiteLink fs-3' title='adhanclock@gmail.com' href="mailto:adhanclock@gmail.com">{FontAwesome.Envelope}</a>
                </div>
            </div>

            <p></p>

        </div>
    )
}

