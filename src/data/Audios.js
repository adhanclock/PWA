import audio1 from '../mp3s/1.mp3';
import audio2 from '../mp3s/2.mp3';
import audio3 from '../mp3s/3.mp3';
import audio4 from '../mp3s/4.mp3';
import audio5 from '../mp3s/5.mp3';
import audio6 from '../mp3s/6.mp3';
import audio7 from '../mp3s/7.mp3';
import audio8 from '../mp3s/8.mp3';
import audio9 from '../mp3s/9.mp3';
import audio10 from '../mp3s/10.mp3';
import audio11 from '../mp3s/11.mp3';
import audio12 from '../mp3s/12.mp3';
import audio13 from '../mp3s/13.mp3';
import audio14 from '../mp3s/14.mp3';
import audio101 from '../mp3s/101.mp3';
import audio102 from '../mp3s/102.mp3';
import audio103 from '../mp3s/103.mp3';

import { TimeToRadians } from '../scripts/Common';

export const Audios = [
    { id: 1, source: audio1, name: 'Bosnian Style by Eldin Huseinbegovic (3:11)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 2, source: audio2, name: 'Dubai Style by Abdulrahman Al-Hindi (2:32)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 3, source: audio3, name: 'Egyptian Style (3:25)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 4, source: audio4, name: 'Heartwarming Adhan Recitation (3:47)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 5, source: audio5, name: 'Makkah Al-Mukarramah Style (3:44)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 6, source: audio6, name: 'Masjid Al-Aqsa Style (4:07)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 7, source: audio7, name: 'Mishary Al-Afasy (4:17)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 8, source: audio8, name: 'Ottoman Style by Mawlana Shaykh Nazim (2:38)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 9, source: audio9, name: 'Turkish Style by Remzi Er (4:08)', isAzan: true, isFajrAzan: false, isAlarm: false },
    { id: 10, source: audio10, name: 'Fajr Adhan by Mansoor Az-Zahrani (3:26)', isAzan: false, isFajrAzan: true, isAlarm: false },
    { id: 11, source: audio11, name: 'Fajr Adhan by Mishary Al-Afasy (3:24)', isAzan: false, isFajrAzan: true, isAlarm: false },
    { id: 12, source: audio12, name: 'Madina Fajr Adhan by Shaykh Surayhi (4:54)', isAzan: false, isFajrAzan: true, isAlarm: false },
    { id: 13, source: audio13, name: 'Fajr Adhan by Shaykh Ali Ahmed Mullah (4:35)', isAzan: false, isFajrAzan: true, isAlarm: false },
    { id: 14, source: audio14, name: 'Muhammad Al-Sharif (3:29)', isAzan: true, isFajrAzan: true, isAlarm: false },
    { id: 101, source: audio101, name: 'Bismillahirrahmanirrahim (0:05)', isAzan: true, isFajrAzan: true, isAlarm: true },
    { id: 102, source: audio102, name: 'Soft Beep Sound (0:01)', isAzan: true, isFajrAzan: true, isAlarm: true },
    { id: 103, source: audio103, name: 'As-Salatu Khayrun Minan Nawm (0:28)', isAzan: false, isFajrAzan: false, isAlarm: true }
]

/* Surahs commonly recited after Salah */
export const QuranAudios = [
    { id: '018', name: 'Al-Kahf', reciter: 'Shaykh Maher Al-Muaiqly', mp3: 'https://server12.mp3quran.net/maher/018.mp3' },
    { id: '032', name: 'Al-Sajdah', reciter: 'Shaykh Maher Al-Muaiqly', mp3: 'https://server12.mp3quran.net/maher/032.mp3' },
    { id: '036', name: 'YaSin', reciter: 'Shaykh Maher Al-Muaiqly', mp3: 'https://server12.mp3quran.net/maher/036.mp3' },
    { id: '067', name: 'Al-Mulk', reciter: 'Shaykh Maher Al-Muaiqly', mp3: 'https://server12.mp3quran.net/maher/067.mp3' },
    { id: '076', name: 'Al-Insan', reciter: 'Shaykh Maher Al-Muaiqly', mp3: 'https://server12.mp3quran.net/maher/076.mp3' },
    { id: '078', name: 'An-Naba', reciter: 'Shaykh Maher Al-Muaiqly', mp3: 'https://server12.mp3quran.net/maher/078.mp3' }
]

export const Azans = Audios.filter(a => a.isAzan);
export const FajrAzans = Audios.filter(a => a.isFajrAzan);
export const AlarmAudios = Audios.filter(a => a.isAlarm);

export class AAA { /* Adhan or Alarm Audio */
    constructor(id, time, isPlayed) {
        this.id = id;
        this.time = time;
        this.isPlayed = isPlayed;
    }
}

export class AlarmSetting {
    constructor(id, frequency, hour, minute, ap) {
        this.id = id
        this.hour = hour
        this.minute = minute
        this.ap = ap
        this.frequency = frequency
        this.time = (this.hour === '12' ? (this.ap === 'pm' ? 12 : 0) : ((this.ap === 'pm') ? this.hour * 1 + 12 : this.hour)) + ':' + this.minute
        this.angle = TimeToRadians(this.time, 24)
    }
}

export class NaflAlarmSetting {
    constructor(id, minutes, when, vakit) {
        this.id = id
        this.minutes = minutes
        this.when = when
        this.vakit = vakit
        this.time = null
        this.angle = null
    }
}
