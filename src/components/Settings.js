import React, { useContext, createRef, useRef, useEffect } from 'react'
import Address from './Address';
import DropDown from './DropDown';
import Options from './Options';
import { AzanCallOptions } from '../data/AzanCallOptions';
import { ClockFaces } from '../data/ClockFaces';
import { DeviceModes } from '../data/DeviceModes';
import { FajrAzans, Azans } from '../data/Audios';
import { CalculationMethods, AsrCalculationMethods } from '../data/CalculationMethods';
import { AppContext } from '../AppContext';
import { FontAwesome } from '../data/FontAwesome';
import { format12 } from '../scripts/SmartAzanClock';

export default function Settings() {

    const { vakits, arcVakits, calculationSettings, locationSettings, deviceSettings, azanSettings,
        offsetSettings, updateOffset, previewAudio, oneThirdTime, twoThirdTime, midnightTime } = useContext(AppContext)

    const CalculationMethodValues = [];
    Object.keys(CalculationMethods).forEach(k => {
        CalculationMethodValues.push({ id: k, name: CalculationMethods[k].name });
    })

    const isRamadan = new Intl.DateTimeFormat('en-u-ca-islamic', { month: 'numeric' }).format(new Date()) === '9';
    const azanEnabled = deviceSettings.azanCallsEnabled === 'Y';
    const azanSettingsHTML = [];
    const Vakits = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    Vakits.map((item) => {

        let cVakit = item.toLowerCase();
        let azanValue = azanSettings[cVakit];
        let offsetValue = offsetSettings[cVakit];
        let values = (item === "Fajr") ? FajrAzans : Azans;
        let vTime = vakits.find(v => v.name === item).displayTime;

        azanSettingsHTML.push(

            <div key={item} className="mt-2">

                <div className='d-flex flex-row justify-content-between'>
                    <div><span className='badge p-0'>{item} Adhan @ {vTime}</span></div>
                    <div className='col-4'><span className='badge'>Minute Offset</span></div>
                </div>

                <div className='d-flex flex-row gap-1'>

                    <div className='col-6'>
                        <DropDown name={'azanSettings.' + cVakit} selectedValue={azanValue} values={values} disabled={!azanEnabled} />
                    </div>
                    <div className='col-2'>
                        <button onClick={() => { previewAudio(azanValue * 1); document.activeElement.blur(); }}
                            type='button'
                            disabled={!azanEnabled}
                            className='btn btn-sm btn-primary col-12'>{FontAwesome.Play}</button>
                    </div>
                    <div>
                        <div className='d-flex flex-row gap-1 align-items-center'>
                            <div className='col-4'><button type='button' onClick={() => { updateOffset(cVakit, '-'); document.activeElement.blur(); }} className='btn btn-sm btn-light col-12'>{FontAwesome.Minus}</button></div>
                            <div className='col-4'><button type='button' onClick={() => { updateOffset(cVakit, '0'); document.activeElement.blur(); }} className={'btn btn-sm col-12 ' + ((offsetValue === 0) ? 'btn-light' : 'btn-danger')}>{offsetValue}</button></div>
                            <div className='col-4'><button type='button' onClick={() => { updateOffset(cVakit, '+'); document.activeElement.blur(); }} className='btn btn-sm btn-light col-12'>{FontAwesome.Plus}</button></div>
                        </div>
                    </div>
                </div>

            </div >

        )
    })

    return (
        <div>

            {isRamadan && <div className='alert alert-warning p-2 mb-2' style={{ fontSize: '0.85rem' }}>
                🌙 <strong>Ramadan Tip:</strong> Many people add a few extra minutes to the Maghrib offset during Ramadan to ensure sunset has fully occurred. May Allah accept all our fasting. 🤲
            </div>}

            <Address value={locationSettings.address} />

            <div className="mt-2">
                <span className='badge mb-1 p-0'>Calculation Method</span>
                <DropDown name="calculationSettings.method" selectedValue={calculationSettings.method} values={CalculationMethodValues} />
            </div>

            <div className="mt-2">
                <span className='badge mb-1 p-0'>Asr Calculation Method</span>
                <Options name="calculationSettings.asrMethod" selectedValue={calculationSettings.asrMethod} values={AsrCalculationMethods} />
            </div>

            <div className="mt-2">
                <span className='badge mb-1 p-0'>Clock Face</span>
                <Options name="deviceSettings.clockFace" selectedValue={deviceSettings.clockFace} values={ClockFaces} />
            </div>

            <div className="mt-2">
                <span className='badge mb-1 p-0'>Display Mode</span>
                <Options name="deviceSettings.mode" selectedValue={deviceSettings.mode} values={DeviceModes} />
            </div>

            <div className="mt-2">
                <span className='badge mb-1 p-0'>Screen Saver Mode</span>
                <Options name="deviceSettings.screenSaver" selectedValue={deviceSettings.screenSaver} values={AzanCallOptions} />
            </div>

            <div className="mt-2">
                <span className='badge mb-1 p-0'>Enable Adhan Calls & Alarms</span>
                <Options name="deviceSettings.azanCallsEnabled" selectedValue={deviceSettings.azanCallsEnabled} values={AzanCallOptions} />
            </div>

            {azanSettingsHTML}

            <div className='d-flex flex-row justify-content-start gap-2 mt-3'>
                <div className='badge bg-secondary p-1'>Imsak @ {format12(arcVakits.find(f => f.name == 'Imsak').time)}</div>
                <div className='badge bg-secondary p-1'>Duha @ {format12(arcVakits.find(f => f.name == 'Duha').time)} - {format12(arcVakits.find(f => f.name == 'Duhaend').time)}</div>
            </div>
            <div className='d-flex flex-row justify-content-start gap-2 mt-2'>
                <div className='badge bg-secondary p-1'>1/3 @ {format12(oneThirdTime)}</div>
                <div className='badge bg-secondary p-1'>Midnight @ {format12(midnightTime)}</div>
                <div className='badge bg-secondary p-1'>2/3 @ {format12(twoThirdTime)}</div>
            </div>

        </div >
    )
}
