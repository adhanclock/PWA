import PrayTimes from './PrayTimes'
import { AAA } from '../data/Audios';
import { HijriMonths } from '../data/Common';
import { Backgrounds } from '../data/Backgrounds';
import { DefaultSettings } from '../data/DefaultSettings';
import { CalculationMethods } from '../data/CalculationMethods';
import { TimeToRadians } from './Common';

const prayTimes = new PrayTimes();

export const SmartAzanClock = {
    settings: { ...DefaultSettings },
    output: {},
    colors: { black: 'black', white: 'whitesmoke' },
    getPrayerTime(vakit) { return this.prayerTimes[vakit].replace(/^0/, ''); },
    run(info) {

        //console.log('SmartAzanClock.run: ' + (info ?? ''))

        let storedSettings = JSON.parse(localStorage.getItem('settings'));
        if (storedSettings)
            this.settings = { ...this.settings, ...storedSettings }

        prayTimes.setMethod(this.settings.calculationSettings.method);
        if (this.settings.calculationSettings.asrMethod === 'H') { prayTimes.adjust({ asr: 'Hanafi' }) } else { prayTimes.adjust({ asr: 'Standard' }) }
        let baseTuneValues = { imsak: 0, sunrise: 0, fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
        let methodDefaultTuneValues = CalculationMethods[this.settings.calculationSettings.method].methodOffsets;
        let tuneValues = { ...baseTuneValues, ...methodDefaultTuneValues }
        tuneValues.fajr += parseInt(this.settings.offsetSettings.fajr);
        tuneValues.dhuhr += parseInt(this.settings.offsetSettings.dhuhr);
        tuneValues.asr += parseInt(this.settings.offsetSettings.asr);
        tuneValues.maghrib += parseInt(this.settings.offsetSettings.maghrib);
        tuneValues.isha += parseInt(this.settings.offsetSettings.isha);
        prayTimes.tune({ fajr: tuneValues.fajr, sunrise: tuneValues.sunrise, dhuhr: tuneValues.dhuhr, asr: tuneValues.asr, maghrib: tuneValues.maghrib, isha: tuneValues.isha });

        let nD = new Date();
        this.currentDateTime = new Date(nD.toLocaleString("en-US", { timeZone: this.settings.locationSettings.timeZoneID }));
        this.currentTimeString = this.currentDateTime.getHours() + ':' + fillInZeros(this.currentDateTime.getMinutes());
        this.prayerTimes = prayTimes.getTimes(this.currentDateTime, [this.settings.locationSettings.lat, this.settings.locationSettings.lng, 0], getOffsetHoursForCalendarDate(this.settings.locationSettings.timeZoneID, this.currentDateTime), 0, '24h');

        let vakits = [];
        let arcVakits = [];

        let imsakVakit = new Vakit('Imsak', this.getPrayerTime('imsak'), this.getPrayerTime('fajr'), this.currentTimeString, 'orange');
        let fajrVakit = new Vakit('Fajr', this.getPrayerTime('fajr'), this.getPrayerTime('sunrise'), this.currentTimeString, 'darkorange');
        let sunriseVakit = new Vakit('Sunrise', this.getPrayerTime('sunrise'), this.getPrayerTime('dhuhr'), this.currentTimeString, '#EBDE67');
        let sunriseDuhaVakit = new Vakit('Sunrise', this.getPrayerTime('sunrise'), this.getPrayerTime('duha'), this.currentTimeString, 'yellow');
        let duhaVakit = new Vakit('Duha', this.getPrayerTime('duha'), this.getPrayerTime('duhaend'), this.currentTimeString, '#EBDE67');
        let duhaendVakit = new Vakit('Duhaend', this.getPrayerTime('duhaend'), this.getPrayerTime('dhuhr'), this.currentTimeString, 'yellow');
        let dhuhrVakit = new Vakit('Dhuhr', this.getPrayerTime('dhuhr'), this.getPrayerTime('asr'), this.currentTimeString, 'seagreen');
        let asrVakit = new Vakit('Asr', this.getPrayerTime('asr'), this.getPrayerTime('maghrib'), this.currentTimeString, '#0099FF');
        let maghribVakit = new Vakit('Maghrib', this.getPrayerTime('maghrib'), this.getPrayerTime('isha'), this.currentTimeString, 'tomato');
        let ishaImsakVakit = new Vakit('Isha', this.getPrayerTime('isha'), this.getPrayerTime('imsak'), this.currentTimeString, '#334051');
        let ishaVakit = new Vakit('Isha', this.getPrayerTime('isha'), this.getPrayerTime('fajr'), this.currentTimeString, '#334051');

        arcVakits.push(imsakVakit);
        arcVakits.push(fajrVakit);
        arcVakits.push(sunriseDuhaVakit);
        arcVakits.push(duhaVakit);
        arcVakits.push(duhaendVakit);
        arcVakits.push(dhuhrVakit);
        arcVakits.push(asrVakit);
        arcVakits.push(maghribVakit);
        arcVakits.push(ishaImsakVakit);

        vakits.push(fajrVakit);
        vakits.push(sunriseVakit);
        vakits.push(dhuhrVakit);
        vakits.push(asrVakit);
        vakits.push(maghribVakit);
        vakits.push(ishaVakit);

        this.cvi = vakits.findIndex(v => v.isCurrentVakit());
        this.nvi = (this.cvi + 1) % vakits.length;
        this.currentVakit = vakits[this.cvi];
        this.nextVakit = vakits[this.nvi];

        this.acvi = arcVakits.findIndex(v => v.isCurrentVakit());
        this.currentArcVakit = arcVakits[this.acvi];

        this.output.vakits = vakits;
        this.output.arcVakits = arcVakits;
        this.output.currentVakit = this.currentVakit;
        this.output.nextVakit = this.nextVakit;
        this.output.currentArcVakit = this.currentArcVakit;
        this.output.elapsed = diffBetweenTimes(this.currentVakit.time, this.currentTimeString);
        let nextText = this.currentVakit.nextVakitIn();

        this.output.todaysDate =
            nD.toLocaleString("en-US", { timeZone: this.settings.locationSettings.timeZoneID, weekday: 'long' })
            + ' ' +
            nD.toLocaleString("en-US", { timeZone: this.settings.locationSettings.timeZoneID, day: 'numeric' })
            + ' ' +
            nD.toLocaleString("en-US", { timeZone: this.settings.locationSettings.timeZoneID, month: 'long', year: 'numeric' });

        let hijriDay = nD.toLocaleDateString('en-SA-u-ca-islamic-umalqura', { timeZone: this.settings.locationSettings.timeZoneID, day: 'numeric' });
        let hijriMonth = nD.toLocaleDateString('en-SA-u-ca-islamic-umalqura', { timeZone: this.settings.locationSettings.timeZoneID, month: 'numeric' });
        let hijriYear = nD.toLocaleDateString('en-SA-u-ca-islamic-umalqura', { timeZone: this.settings.locationSettings.timeZoneID, year: 'numeric' });
        this.output.hijriDate = hijriDay + ' ' + HijriMonths[hijriMonth - 1] + ' ' + hijriYear.replace(/\D/g, '');
        this.output.nextText = nextText;
        this.output.time = this.currentTimeString;
        this.output.displayTime = format12(this.currentTimeString);
        this.output.hourAngle = TimeToRadians(this.currentDateTime.getHours() + ':' + this.currentDateTime.getMinutes(), 24);
        this.output.background = Backgrounds[this.currentVakit.name.toLowerCase() + (hijriDay % 3)];
        this.output.clockOpacity = 0.93;
        this.output.dim = 0;

        this.output.isWeekDay = this.currentDateTime.getDay() > 0 && this.currentDateTime.getDay() < 6;
        this.output.midnightTime = this.getPrayerTime('midnight')
        this.output.midnightAngle = TimeToRadians(this.output.midnightTime, 24);
        let totalMinutesInTheNight = diffMinutesBetweenTimes(this.getPrayerTime('maghrib'), this.getPrayerTime('fajr'));
        let oneThird = Math.ceil(totalMinutesInTheNight / 3);
        let twoThird = oneThird * 2;
        this.output.oneThirdTime = addMinutesToTime(this.getPrayerTime('maghrib'), oneThird);
        this.output.twoThirdTime = addMinutesToTime(this.getPrayerTime('maghrib'), twoThird);
        this.output.oneThirdAngle = (TimeToRadians(this.getPrayerTime('maghrib'), 24) + oneThird * Math.PI / 720) % (2 * Math.PI);
        this.output.twoThirdAngle = (TimeToRadians(this.getPrayerTime('maghrib'), 24) + twoThird * Math.PI / 720) % (2 * Math.PI);

        if (
            this.settings.deviceSettings.mode === 'D'
            ||
            (this.settings.deviceSettings.mode === 'A'
                &&
                (
                    this.currentVakit.name === 'Fajr'
                    ||
                    this.currentVakit.name === 'Isha'
                )
            )
        ) {
            this.output.dim = 1;
            this.output.clockOpacity = 0.7;   /* dim mode: was 0.25, too faint to see on some screens */
            this.output.background = '';
        }

        if (this.currentTimeString === this.currentVakit.time && this.settings.deviceSettings.azanCallsEnabled === 'Y') {
            let cvakit = this.currentVakit.name.toLowerCase();
            if (this.settings.azanSettings[cvakit]) {
                let aaID = this.settings.azanSettings[cvakit] * 1;
                setAAA(aaID, this.currentTimeString);
            }
        }

        this.settings.alarmSettings.map((a) => {
            if (this.currentTimeString === a.time
                && this.settings.deviceSettings.azanCallsEnabled === 'Y'
                && ((a.frequency === 'E') || (a.frequency === 'W' && this.output.isWeekDay))
            ) {
                setAAA(a.id, a.time);
            }
        })

        this.settings.naflAlarmSettings.map((a, index) => {
            let addMinutes = a.when === 'before' ? -a.minutes : a.minutes;

            if (a.vakit.indexOf('1/3') === 0) {
                a.time = addMinutesToTime(this.output.oneThirdTime, addMinutes);
            }
            else if (a.vakit.indexOf('2/3') === 0) {
                a.time = addMinutesToTime(this.output.twoThirdTime, addMinutes);
            }
            else if (a.vakit.indexOf('Midnight') === 0) {
                a.time = addMinutesToTime(this.output.midnightTime, addMinutes);
            }
            else {
                a.time = addMinutesToTime(vakits.filter(v => v.name === a.vakit)[0].time, addMinutes);
            }

            a.angle = TimeToRadians(a.time, 24);
            this.settings.naflAlarmSettings[index] = a;
            localStorage.setItem('settings', JSON.stringify({ ...this.settings }));
            if (this.currentTimeString === a.time && this.settings.deviceSettings.azanCallsEnabled === 'Y') {
                setAAA(a.id, a.time);
            }
        })

        this.output = { ...this.output, ...this.settings };
        return this.output;

    }
};

const setAAA = (id, time) => {
    let AU = new AAA(id, time, false);
    let storedAU = JSON.parse(localStorage.getItem("AAA"));
    if (!storedAU || storedAU.time !== AU.time) {
        localStorage.setItem("AAA", JSON.stringify({ ...AU }));
    }
}

class Vakit {
    constructor(name, time, nextTime, currentTime, color) {
        this.currentTime = currentTime;
        this.name = name;
        this.time = time;
        this.displayTime = format12(time);
        this.nextTime = nextTime;
        this.color = color;
        this.startAngle12 = () => { return TimeToRadians(this.time, 12); };
        this.endAngle12 = () => { return TimeToRadians(nextTime, 12); };
        this.startAngle24 = () => { return TimeToRadians(this.time, 24) };
        this.endAngle24 = () => { return TimeToRadians(nextTime, 24) };
        this.nextVakitIn = () => { return diffBetweenTimes(currentTime, nextTime); };
        this.isCurrentVakit = () => { return isTimeBetweenTheTwo(currentTime, time, nextTime); };
    }
}

export const format12 = (t) => {
    let tt = t.split(':');
    let th = tt[0];
    let tm = tt[1];
    /*
    let ap = 'ᴬ';
    if (th >= 12)
        ap = 'ᴾ'
    */
    th = th % 12;
    if (th === 0)
        th = 12;
    return th + ':' + tm; /* + ap */
}

const fillInZeros = (n) => {
    if (n < 10) {
        n = '0' + n
    }
    return n;
}
const diffBetweenTimes = (startTime, endTime) => {
    let diffMinutes = diffMinutesBetweenTimes(startTime, endTime);
    let diffH = Math.floor(diffMinutes / 60);
    let diffM = diffMinutes % 60;
    let r = diffH + ':' + fillInZeros(diffM);
    return (r);
}
const diffMinutesBetweenTimes = (startTime, endTime) => {
    let st = getTotalMinutes(startTime);
    let et = getTotalMinutes(endTime);
    let diffMinutes = et - st;
    if (st > et) {
        diffMinutes = 1440 - (st - et);
    }
    return diffMinutes;
}
const isTimeBetweenTheTwo = (time, startTime, endTime) => {
    let t = getTotalMinutes(time);
    let s = getTotalMinutes(startTime);
    let e = getTotalMinutes(endTime);

    let r = false;

    if (e > s) {
        if (t >= s && t < e) {
            r = true;
        }
    }
    else {
        r = !isTimeBetweenTheTwo(time, endTime, startTime);
    }

    return r;

}
const getTotalMinutes = (t) => {
    let tt = t.split(':');
    return tt[0] * 60 + tt[1] * 1;
}
const getOffsetHoursFromTimeZone = (tz, date = new Date()) => {
    // Build the zone's wall-clock time as if it were UTC and compare with the real instant.
    // Unlike parsing formatted strings with new Date(), this doesn't depend on the device's
    // own zone, so it stays correct around local DST transitions.
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).formatToParts(date);
    const v = {};
    parts.forEach(p => { v[p.type] = +p.value; });
    const wallAsUtc = Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second);
    const instant = date.getTime() - date.getMilliseconds();
    return (wallAsUtc - instant) / 3600000;
}

// Offset in effect at local noon of the given calendar date (Y/M/D taken from d's local fields),
// so a whole day's prayer times use that day's offset, even across a DST switch.
const getOffsetHoursForCalendarDate = (tz, d) => {
    const utcNoon = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    const guess = getOffsetHoursFromTimeZone(tz, new Date(utcNoon));
    return getOffsetHoursFromTimeZone(tz, new Date(utcNoon - guess * 3600000));
};

const addMinutesToTime = (t, m) => {
    let thisTime = new Date();
    let tt = t.split(':');
    thisTime.setHours(tt[0], tt[1], 0);
    thisTime.setMinutes(thisTime.getMinutes() + m * 1);
    return (thisTime.getHours() + ':' + fillInZeros(thisTime.getMinutes()));
};