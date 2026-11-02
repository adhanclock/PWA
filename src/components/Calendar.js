import React, { useState } from 'react'
import '../css/Calendar.css';
import { islamicHolidays, calendarStrings } from '../data/CalendarData';

/* Combined Hijri + Gregorian calendar, ported from the PTX extension's Calendar tab. */

const LANG = 'en';
const T = (key) => calendarStrings[key] || key;

const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };
const startOfDay = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };

/* Hijri (islamic-umalqura) parts as integers; 'en' keeps digits ASCII */
const hijriParts = (date) => {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
    const o = {};
    for (const p of parts) {
        if (p.type === 'year') o.hy = parseInt(p.value.replace(/[^0-9]/g, ''), 10);
        else if (p.type === 'month') o.hm = parseInt(p.value, 10);
        else if (p.type === 'day') o.hd = parseInt(p.value, 10);
    }
    return o;
};

const hijriMonthName = (date, style) =>
    new Intl.DateTimeFormat(LANG + '-u-ca-islamic-umalqura', { month: style }).format(date);

const hijriDateString = (date) =>
    new Intl.DateTimeFormat(LANG + '-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
        .replace(/ ?AH$/, '');

/* Gregorian Date on which a Hijri (year, month, day) falls, matched against the same calendar */
const hijriToGregorian = (hy, hm, hd) => {
    const total = (y, m, d) => (y - 1) * 354.367 + (m - 1) * 29.53 + d;
    const target = total(hy, hm, hd);
    let guess = new Date();
    guess.setHours(12, 0, 0, 0);
    for (let i = 0; i < 6; i++) {
        const p = hijriParts(guess);
        const diff = Math.round(target - total(p.hy, p.hm, p.hd));
        if (diff === 0) break;
        guess = addDays(guess, diff);
    }
    for (let off = 0; off <= 20; off++) {
        for (const s of (off === 0 ? [0] : [off, -off])) {
            const d = addDays(guess, s);
            const p = hijriParts(d);
            if (p.hy === hy && p.hm === hm && p.hd === hd) return startOfDay(d);
        }
    }
    return null;
};

/* a holy day's Hijri day-of-month: fixed `day`, or first `firstWeekday` of its month (Laylat al-Raghaib) */
const holidayDay = (hol, hy) => {
    if (typeof hol.day === 'number') return hol.day;
    if (typeof hol.firstWeekday === 'number') {
        const first = hijriToGregorian(hy, hol.month, 1);
        if (!first) return null;
        return 1 + ((hol.firstWeekday - first.getDay() + 7) % 7);
    }
    return null;
};

const firstDayOfWeek = () => {
    try {
        const loc = new Intl.Locale(navigator.language || LANG);
        const wi = (typeof loc.getWeekInfo === 'function') ? loc.getWeekInfo() : loc.weekInfo;
        if (wi && wi.firstDay) return wi.firstDay % 7;
    } catch (e) { /* fall through */ }
    return 0;
};

const upcomingHolydays = () => {
    const today = startOfDay(new Date());
    const todayH = hijriParts(today);
    const items = [];
    for (const hy of [todayH.hy, todayH.hy + 1]) {
        for (const hol of islamicHolidays) {
            const hd = holidayDay(hol, hy);
            if (!hd) continue;
            const date = hijriToGregorian(hy, hol.month, hd);
            if (!date) continue;
            const daysRemaining = Math.round((date.getTime() - today.getTime()) / 86400000);
            if (daysRemaining >= 0) items.push({ hol, date, daysRemaining });
        }
    }
    items.sort((a, b) => a.daysRemaining - b.daysRemaining);
    const seen = {};
    return items.filter(it => (seen[it.hol.key] ? false : (seen[it.hol.key] = true)));   /* soonest occurrence of each */
};

export default function Calendar() {
    const [view, setView] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

    const goMonth = (delta) => setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));
    const goToday = () => { const n = new Date(); setView(new Date(n.getFullYear(), n.getMonth(), 1)); };

    const viewMonth = view.getMonth();
    const first = new Date(view.getFullYear(), viewMonth, 1);
    const last = new Date(view.getFullYear(), viewMonth + 1, 0);

    /* title: Gregorian month/year + the Hijri month(s) spanning it */
    const gregTitle = new Intl.DateTimeFormat(LANG, { month: 'long', year: 'numeric' }).format(first);
    const hFirst = hijriParts(first), hLast = hijriParts(last);
    const nFirst = hijriMonthName(first, 'long');
    let hijriTitle;
    if (hFirst.hm === hLast.hm && hFirst.hy === hLast.hy) hijriTitle = nFirst + ' ' + hFirst.hy;
    else if (hFirst.hy === hLast.hy) hijriTitle = nFirst + ' – ' + hijriMonthName(last, 'long') + ' ' + hLast.hy;
    else hijriTitle = nFirst + ' ' + hFirst.hy + ' – ' + hijriMonthName(last, 'long') + ' ' + hLast.hy;

    const firstDow = firstDayOfWeek();
    const weekdayFmt = new Intl.DateTimeFormat(LANG, { weekday: 'short' });
    const knownSunday = new Date(2023, 0, 1);
    const weekdays = [0, 1, 2, 3, 4, 5, 6].map(i => weekdayFmt.format(addDays(knownSunday, (firstDow + i) % 7)));

    const lead = (first.getDay() - firstDow + 7) % 7;
    const gridStart = addDays(first, -lead);
    const today = startOfDay(new Date());
    const days = [];
    for (let i = 0; i < 42; i++) {
        const d = startOfDay(addDays(gridStart, i));
        const h = hijriParts(d);
        const holy = islamicHolidays.find(x => x.month === h.hm && holidayDay(x, h.hy) === h.hd);
        let cls = 'cal-day';
        if (d.getMonth() !== viewMonth) cls += ' other-month';
        if (d.getTime() === today.getTime()) cls += ' today';
        if (h.hd === 1) cls += ' cal-hijri-month-start';
        if (holy) cls += ' holyday';
        days.push(
            <div key={i} className={cls} title={holy ? T(holy.key) : undefined}>
                {holy && <span className="cal-dot"></span>}
                <span className="cal-greg">{d.getDate()}</span>
                <span className="cal-hijri">{h.hd === 1 ? hijriMonthName(d, 'short') : h.hd}</span>
            </div>
        );
    }

    const upcoming = upcomingHolydays();
    const gregFmt = new Intl.DateTimeFormat(LANG, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div id="calendarTab" className="text-center">
            <div className="d-flex flex-column h-100" style={{ overflow: 'hidden' }}>
                <div className="cal-nav d-flex flex-row align-items-center justify-content-between gap-1 flex-shrink-0">
                    <button type="button" className="btn btn-darkish btn-sm cal-nav-btn" aria-label="Previous month" onClick={() => goMonth(-1)}>‹</button>
                    <div className="cal-title pointerOn flex-fill" title={T('today')} onClick={goToday} style={{ cursor: 'pointer' }}>
                        <div className="cal-title-greg">{gregTitle}</div>
                        <div className="cal-title-hijri">{hijriTitle}</div>
                    </div>
                    <button type="button" className="btn btn-darkish btn-sm cal-nav-btn" aria-label="Next month" onClick={() => goMonth(1)}>›</button>
                </div>

                <div className="cal-grid cal-weekdays flex-shrink-0">{weekdays.map((w, i) => <div key={i}>{w}</div>)}</div>
                <div className="cal-grid cal-days flex-shrink-0">{days}</div>

                <div className="cal-upcoming-title flex-shrink-0">{T('upcomingHolydays')}</div>
                <div className="cal-upcoming flex-grow-1 csb pe-1">
                    {!upcoming.length && <div className="cal-upcoming-empty">{T('noUpcoming')}</div>}
                    {upcoming.map(it => {
                        let remaining, remClass = '';
                        if (it.daysRemaining === 0) { remaining = T('today'); remClass = ' remaining-today'; }
                        else if (it.daysRemaining === 1) remaining = T('tomorrow');
                        else remaining = T('inDays').replace('{n}', it.daysRemaining);
                        return (
                            <div key={it.hol.key} className={'cal-holyday-item' + (it.daysRemaining <= 7 ? ' is-soon' : '')}>
                                <div className="cal-holyday-emoji">{it.hol.emoji}</div>
                                <div className="cal-holyday-info">
                                    <div className="cal-holyday-name">{T(it.hol.key)}</div>
                                    <div className="cal-holyday-dates">
                                        <div className="cal-holyday-greg">{gregFmt.format(it.date)}</div>
                                        <div className="cal-holyday-hijri">{hijriDateString(it.date)}</div>
                                    </div>
                                </div>
                                <div className={'cal-holyday-remaining' + remClass}>{remaining}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}
