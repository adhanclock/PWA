//import { toast } from 'react-toastify';
import React from 'react';

const isLocalhost = Boolean(window.location.hostname === 'localhost');

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';
      if (!isLocalhost) {
        navigator.serviceWorker.register(swUrl).then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  //toast.info(<div><a href="/" onClick={() => window.location.reload()}>A new version is available! Please click here to update.</a></div>,{ toastId: "PWAVersionUpdate", autoClose: false, closeOnClick: false, draggable: false });
                }
              };
            }
          };
        })
          .catch((error) => {
            console.error('Error during service worker registration:', error);
          });
        /*
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          toast.success('You AdhanClock app is now up-to-date.', { toastId: "PWAUpdatedVersion", autoClose: 5000 });
        });
        */
      } else {
        console.log('Running on localhost. SW is not registered.');
      }
    });
  }
}
