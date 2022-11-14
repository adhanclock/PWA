import React, { useState, useContext, useRef, useEffect } from 'react'
import { AppContext } from '../AppContext';
import { FA } from '../scripts/Vars';

export default function Address(props) {

    const { locationSettings, updateSettings, showMsg, dol } = useContext(AppContext)
    const [address, setAddress] = useState(props.value)

    const updateButton = useRef(null)
    const detectButton = useRef(null)
    const searchIcon = useRef(null)
    const detectIcon = useRef(null)
    const locationSpinner = useRef(null)
    const detectSpinner = useRef(null)
    //const marker = useRef(null)

    useEffect(() => {
        setAddress(locationSettings.address)
    }, [locationSettings.address])


    function changeAddress(e) {
        setAddress(e.target.value);
    }

    function updateAddress(e) {
        e.preventDefault();
        updateButton.current.disabled = true;
        searchIcon.current.style.display = 'none';
        locationSpinner.current.style.display = 'inline-block';
        let ceCallURL = 'https://smartazanclock.com/geolocation?address=' + address;

        fetch(ceCallURL, { method: 'POST' }).then((response) => {

            if (response.status === 200) {
                response.json().then((data) => {
                    let newSettings = { locationSettings: { address: data.address, timeZoneID: data.timeZoneID, lat: data.lat, lng: data.lng } };
                    updateSettings(newSettings, 'Your location is updated.');
                });
            }
            else {
                showMsg("Couldn't find that location. Please try again.", "error")
                setAddress(locationSettings.address)
            }
        })
            .catch(err => { showMsg("Couldn't find that location. Please make sure you are connected to Internet and try again.", "error"); })
            .finally(() => {
                updateButton.current.disabled = false;
                searchIcon.current.style.display = 'inline-block';
                locationSpinner.current.style.display = 'none';
            });
    }


    function detectLocation() {

        detectButton.current.disabled = true;
        detectIcon.current.style.display = 'none';
        detectSpinner.current.style.display = 'inline-block';

        let cSettings = JSON.parse(localStorage.getItem('settings'));
        let ceCallURL = 'https://smartazanclock.com/iplocation';
        fetch(ceCallURL, { method: 'POST' }).then((response) => {
            if (response.status === 200) {
                response.json().then((data) => {
                    cSettings.locationSettings.address = data.address;
                    cSettings.locationSettings.lat = data.lat;
                    cSettings.locationSettings.lng = data.lng;
                    cSettings.locationSettings.timeZoneID = data.timeZoneID;
                    localStorage.setItem('settings', JSON.stringify({ ...cSettings }));
                    showMsg("Your location is updated based on your IP.")
                });
            }
        }).catch(err => { dol(err) }).finally(() => {
            detectButton.current.disabled = false;
            detectIcon.current.style.display = 'inline-block';
            detectSpinner.current.style.display = 'none';
        });

    }

    return (
        <form method='post' onSubmit={updateAddress}>
            <span className='badge p-0 mb-2'>Set Your Location</span>
            <div className='d-flex flex-row gap-2'>
                <div className='flex-grow-1'>
                    <input id="address" type="text" className='form-control form-control-sm' placeholder='Enter any address or location' onChange={changeAddress} value={address} />
                </div>
                <div className='col-2'>
                    <button ref={updateButton} type='submit' className='btn col-12 btn-sm btn-primary'>
                        <span ref={searchIcon}>{FA.search}</span>
                        <span ref={locationSpinner} className="spinner-border spinner-border-sm mx-1" style={{ display: 'none' }}></span>
                    </button>
                </div>
                {
                    /*
                <div className='col-2'>
                    <button ref={detectButton} onClick={detectLocation} type='button' className='btn col-12 btn-sm btn-light'>
                        <i ref={detectIcon} className='fa-solid fa-location-dot'></i>
                        <span ref={detectSpinner} className="spinner-border spinner-border-sm mx-1" style={{ display: 'none' }}></span>
                    </button>
                </div>    
                    */
                }

            </div>
        </form>
    )
}
