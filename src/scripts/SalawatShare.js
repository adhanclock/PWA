/* Salawat share-as-image, ported from the PTX extension (js/index.js salawatShare). */

/* Share: render the whole salawat card (not just the visible part of the scroll area) to a PNG and
   hand it to the OS share sheet; where that is unavailable, download the PNG instead. */
/* the shared image is laid out at its own width (css px), independent of the narrow popup: portrait for phones, about 4:5 to square; a long salawat gets the wider layout so it stays short enough to read in a chat */
const SALAWAT_SHARE_W = 440, SALAWAT_SHARE_W_LONG = 600, SALAWAT_SHARE_MAX_RATIO = 1.35;
export async function shareSalawat(current) {
    const card = document.querySelector('#salawatTab .salawat-card');
    const scroll = document.getElementById('salawatScroll');
    if (!card || !current) return;
    try {
        const html2canvas = (await import('./html2canvas.min.js')).default;   /* loaded on first share only */
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        const render = (W) => html2canvas(card, {
            scale: 2,
            useCORS: true,
            windowWidth: W + 100,
            windowHeight: card.offsetHeight + scroll.scrollHeight + 400,   /* tall enough that nothing is clipped by the popup's own height */
            backgroundColor: light ? '#eef0f2' : '#04180f',
            ignoreElements: (el) => el.classList.contains('salawat-foot') || el.classList.contains('salawat-arrow') || el.id === 'salawatCheckRow',
            onclone: (doc, el) => {
                const style = doc.createElement('style');
                /* html2canvas can't do background-clip:text (it paints the gradient as a box), so the asma get a solid gold fill; the card and its ancestors lose their fixed height so all the text is laid out */
                style.textContent = '#salawatTab::before,#salawatTab::after,.salawat-card::after,.salawat-card>.___html2canvas___pseudoelement_after{display:none!important}#salawatTab,.salawat-wrap,.salawat-card,.salawat-scroll{height:auto!important;max-height:none!important;overflow:visible!important}.salawat-card{flex:none!important}.salawat-scroll{flex:none!important;padding-bottom:16px!important}'
                    + (light ? '' : '.salawat-asma-ar{background:none!important;-webkit-text-fill-color:#e7cf86!important;color:#e7cf86!important}');
                doc.head.appendChild(style);
                /* lift the card out of the popup's fixed-height, overflow:hidden ancestors so its background and frame grow with the text */
                const wrap = doc.createElement('div');
                wrap.id = 'salawatTab';
                wrap.style.cssText = 'display:block;text-align:center;width:' + W + 'px;';
                doc.body.textContent = '';
                doc.body.appendChild(wrap).appendChild(el);
                el.style.margin = '0';
                el.style.minHeight = W + 'px';   /* never shorter than square: a short salawat is centred in the card */
                el.querySelector('.salawat-scroll').style.cssText += ';flex:1 1 auto!important;display:flex;flex-direction:column;justify-content:center';
                /* footer that only exists in the shared image: the salawat's own link (when the server sent a valid https one, same check as the source button), then the credit */
                const line = (text, css) => { const d = doc.createElement('div'); d.textContent = text; d.style.cssText = 'flex:none;text-align:center;font-size:12px;' + css; el.appendChild(d); return d; };
                let linkText = '';
                try { const u = new URL(current.link); if (u.protocol === 'https:') linkText = (u.host + u.pathname + u.search).replace(/^www\./, '').replace(/\/$/, ''); } catch (e) { }
                const linkEl = linkText && line(linkText, 'white-space:nowrap;padding:10px 12px 0;letter-spacing:0.02em;text-transform:uppercase;border-top:1px solid ' + (light ? 'rgba(0,0,0,0.18)' : 'rgba(231,207,134,0.4)') + ';color:' + (light ? '#6c757d' : '#cfc7a6') + ';');
                /* each footer line shrinks to fit on one line (measured here: the clone's own scrollWidth is not reliable) */
                const fit = (d, text, ls, max = 12) => {
                    const ctx = document.createElement('canvas').getContext('2d');
                    ctx.font = '12px ' + getComputedStyle(card).fontFamily;
                    const w = ctx.measureText(text).width + text.length * 12 * ls;
                    d.style.fontSize = Math.min(max,Math.floor(120 * (W - 28) / w) / 10) + 'px';
                };
                if (linkEl) fit(linkEl, linkText.toUpperCase(), 0.02);
                const credit = 'Shared from AdhanClock.com';
                fit(line(credit, 'white-space:nowrap;padding:' + (linkText ? '6px' : '10px') + ' 12px 14px;letter-spacing:0.04em;' + (linkText ? '' : 'border-top:1px solid ' + (light ? 'rgba(0,0,0,0.18)' : 'rgba(231,207,134,0.4)') + ';') + 'color:' + (light ? '#868e96' : 'rgba(231,207,134,0.55)') + ';'), credit, 0.04, 10);   /* the credit stays small: 10px at most */
            }
        });
        let canvas = await render(SALAWAT_SHARE_W);
        if (canvas.height / canvas.width > SALAWAT_SHARE_MAX_RATIO) canvas = await render(SALAWAT_SHARE_W_LONG);
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
        if (!blob) throw new Error('empty image');
        const file = new File([blob], 'salawat-' + (current.id || 'share') + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file] }); return; }
            catch (e) { if (e && e.name === 'AbortError') return; }   /* cancelled: done; any other failure falls through to download */
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    } catch (e) {
        console.error('salawat share failed', e);
    }
}
