/* Hijri holy days for the Calendar tab (ported from the PTX extension, js/vars.js). */

export const islamicHolidays = [
    { key: 'hijriNewYear', month: 1, day: 1, emoji: '🌙' },
    { key: 'ashura', month: 1, day: 10, emoji: '🕌' },
    { key: 'mawlid', month: 3, day: 12, emoji: '🌹' },
    { key: 'rajabStart', month: 7, day: 1, emoji: '🌙' },
    /* Laylat al-Raghaib: first Friday night of Rajab — its Hijri day varies by
       year, so it is resolved from firstWeekday (5 = Friday) at render time. */
    { key: 'laylatAlRaghaib', month: 7, firstWeekday: 5, emoji: '🤲' },
    { key: 'israMiraj', month: 7, day: 27, emoji: '🕌' },
    { key: 'midShaban', month: 8, day: 15, emoji: '🌕' },
    { key: 'ramadanStart', month: 9, day: 1, emoji: '🌟' },
    { key: 'laylatAlQadr', month: 9, day: 27, emoji: '✨' },
    { key: 'eidAlFitr', month: 10, day: 1, emoji: '🎉' },
    { key: 'dhulHijjahStart', month: 12, day: 1, emoji: '🌙' },
    { key: 'tarwiyah', month: 12, day: 8, emoji: '🕋' },
    { key: 'arafah', month: 12, day: 9, emoji: '🕌' },
    { key: 'eidAlAdha', month: 12, day: 10, emoji: '🐏' }
];

export const calendarStrings = {
        calendarTitle: 'Calendar', upcomingHolydays: 'Upcoming Holy Days',
        today: 'Today', tomorrow: 'Tomorrow', inDays: 'in {n} days',
        noUpcoming: 'No upcoming holy days',
        hijriNewYear: 'Islamic New Year', ashura: 'Day of Ashura',
        mawlid: 'Mawlid an-Nabi ﷺ', israMiraj: "Isra and Mi'raj",
        rajabStart: 'First Day of Rajab', laylatAlRaghaib: 'Laylat al-Raghaib',
        midShaban: "Mid-Sha'ban", ramadanStart: 'First Day of Ramadan',
        laylatAlQadr: 'Laylat al-Qadr', eidAlFitr: 'Eid al-Fitr',
        dhulHijjahStart: 'First Day of Dhu al-Hijjah', tarwiyah: 'Day of Tarwiyah',
        arafah: 'Day of Arafah', eidAlAdha: 'Eid al-Adha'
};
