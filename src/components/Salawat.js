import React, { useEffect, useRef, useState } from 'react'
import '../css/Salawat.css';
import { Arrow, Check, Svg } from './Quran';
import { shareSalawat } from '../scripts/SalawatShare';

/* One salawat at a time from smartazanclock.com/salawat (json: id, title, arabic, ...).
   ?id=<current>&go=next|previous returns the neighbour (the server wraps around at either end).
   Ported from the PTX extension's Salawat tab. */

const SALAWAT_URL = 'https://smartazanclock.com/salawat';

const store = {
    get: (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? fallback : v; } catch (e) { return fallback; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    remove: (k) => { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
};

const split = (v) => (v || '').split(/[,،]/).map(x => x.trim()).filter(Boolean);

/* the highest id is what going 'previous' from the first returns; once every id 1..N is read, start over */
let salawatTotal = 0;

export default function Salawat() {
    const [current, setCurrent] = useState(() => store.get('salawatLast', null));
    const [read, setRead] = useState(() => store.get('salawatRead', {}));
    const [prefs, setPrefs] = useState(() => ({ translit: true, en: true, ...store.get('salawatPrefs', {}) }));
    const [status, setStatus] = useState('');      /* '' | '…' | '⚠' */
    const [fading, setFading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const req = useRef(0);
    const scrollRef = useRef(null);
    const currentRef = useRef(current);
    currentRef.current = current;
    const loading = status === '…';

    const load = (go) => {
        const my = ++req.current;
        const cur = currentRef.current;
        let url = SALAWAT_URL;
        if (go && cur) url += '?id=' + encodeURIComponent(cur.id) + '&go=' + go;
        setStatus('…');
        setFading(true);
        const fadeOut = new Promise(res => setTimeout(res, 200));   /* let the old text finish fading before it is swapped */
        fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(d => fadeOut.then(() => d))
            .then(d => {
                if (my !== req.current) return;
                setCurrent(d);
                store.set('salawatLast', d);
                setStatus('');
                setFading(false);
                if (scrollRef.current) scrollRef.current.scrollTop = 0;
            })
            .catch(() => {
                if (my !== req.current) return;
                setStatus('⚠');
                setFading(false);
            });
    };

    /* resume where the user left off; if that one is marked read, or there is none yet, fetch the next/first */
    useEffect(() => {
        if (current) { if (read[current.id]) load('next'); }
        else load(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reset = () => {
        setRead({});
        store.remove('salawatRead');
        store.remove('salawatLast');
        currentRef.current = null;
        setCurrent(null);
        load(null);
    };

    const checkComplete = async (nextRead) => {
        if (Object.keys(nextRead).length < Math.max(salawatTotal, 1)) return;
        try {
            const r = await fetch(SALAWAT_URL + '?id=1&go=previous');
            if (!r.ok) return;
            salawatTotal = Number((await r.json()).id) || 0;
        } catch (e) { return; }
        if (!salawatTotal) return;
        for (let i = 1; i <= salawatTotal; i++) if (!nextRead[i]) return;
        setTimeout(reset, 700);   /* a beat to see the last check land, then back to the first salawat */
    };

    const toggleRead = () => {
        if (!current) return;
        const next = { ...read };
        if (next[current.id]) delete next[current.id]; else next[current.id] = true;
        setRead(next);
        store.set('salawatRead', next);
        if (next[current.id]) checkComplete(next);
    };

    const togglePref = (key) => {
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        store.set('salawatPrefs', next);
    };

    const share = async () => {
        if (sharing) return;
        setSharing(true);
        try { await shareSalawat(current); } finally { setSharing(false); }
    };

    const d = current || {};
    const arabic = (d.arabic || '').trim();
    const len = arabic.length;
    const sizeCls = len < 260 ? 'salawat-xl' : len < 520 ? 'salawat-md' : 'salawat-sm';
    const names = split(d.asma_ar), namesEn = split(d.asma_en), namesTr = split(d.asma);   /* asma = transliteration of the names */
    const title = (d.title || '').trim();
    const showTr = prefs.translit && !!d.transliteration;
    const showEn = prefs.en && !!d.en;
    let host = '';
    try { const u = new URL(d.link); if (u.protocol === 'https:') host = u.hostname.replace(/^www\./, ''); } catch (e) { /* no valid link */ }
    const done = !!(current && read[current.id]);

    return (
        <div id="salawatTab">
            <div className="salawat-wrap d-flex flex-column h-100">
                <div className={'salawat-card' + (fading ? ' salawat-out' : '')}>
                    <div className={'salawat-asma-row' + (!names.length ? ' title-only' : title ? ' has-title' : '')}>
                        <Arrow dir="L" className="salawat-arrow" aria-label="Previous" title="Previous" disabled={loading} onClick={() => load('previous')} />
                        {(names.length > 0 || !!title) && (
                            <div id="salawatAsma" className={'salawat-asma' + (names.length <= 1 ? ' single' : '')}>
                                {names.length > 0 && title && <div className="salawat-asma-title small">{title}</div>}
                                {names.map((n, i) => (
                                    <div key={i} className="salawat-asma-name">
                                        <div className="salawat-asma-ar" dir="rtl" lang="ar">{n}</div>
                                        {namesTr.length === names.length && <div className="salawat-asma-tr">{namesTr[i]}</div>}
                                        {namesEn.length === names.length && <div className="salawat-asma-en">{namesEn[i]}</div>}
                                    </div>
                                ))}
                                {!names.length && title && <div className="salawat-asma-title">{title}</div>}
                            </div>
                        )}
                        <Arrow dir="R" className="salawat-arrow" aria-label="Next" title="Next" disabled={loading} onClick={() => load('next')} />
                    </div>
                    <div id="salawatScroll" ref={scrollRef} className="salawat-scroll csb">
                        <div id="salawatArabic" className={'salawat-arabic ' + sizeCls} dir="rtl" lang="ar">{arabic}</div>
                        {current && (
                            <div id="salawatCheckRow" className="quran-check-row">
                                <span className="quran-check-center">
                                    <span id="salawatCheck" className={'quran-name-check' + (done ? ' done' : '')} role="button"
                                        aria-label={done ? 'Read' : 'Mark as read'} title={done ? 'Read' : 'Mark as read'} onClick={toggleRead}><Check /></span>
                                </span>
                            </div>
                        )}
                        {(showTr || showEn) && (
                            <div id="salawatMore" className="salawat-more">
                                {showTr && <div id="salawatTranslit" className="salawat-translit" dir="ltr">{d.transliteration}</div>}
                                {showEn && <div id="salawatEn" className="salawat-en" dir="ltr">{d.en}</div>}
                            </div>
                        )}
                        <div id="salawatStatus" className="salawat-status" style={{ display: status ? '' : 'none' }}>{status}</div>
                        <div className="salawat-foot d-flex flex-row align-items-center justify-content-between">
                            <div className="salawat-nav d-flex flex-row">
                                <button type="button" className={'salawat-nav-btn salawat-toggle' + (prefs.translit ? ' on' : '')} aria-pressed={prefs.translit}
                                    aria-label="Transliteration" title="Transliteration" disabled={loading} onClick={() => togglePref('translit')}>Aa</button>
                                <button type="button" className={'salawat-nav-btn salawat-toggle' + (prefs.en ? ' on' : '')} aria-pressed={prefs.en}
                                    aria-label="English translation" title="English translation" disabled={loading} onClick={() => togglePref('en')}>EN</button>
                            </div>
                            <div className="salawat-nav d-flex flex-row">
                                <button type="button" className="salawat-nav-btn" aria-label="Share" title="Share" disabled={loading || sharing || !current} onClick={share}>
                                    <Svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" />
                                    </Svg>
                                </button>
                                {host && (
                                    <a className="salawat-nav-btn" target="_blank" rel="noopener noreferrer" href={d.link} aria-label="Source" title={host}>
                                        <Svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                                        </Svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
