import React, { useContext, useEffect, useRef } from 'react'
import { AppContext } from '../AppContext';
import { format12 } from '../scripts/SmartAzanClock'
import SimpleClock from './SimpleClock'

export default function Clock() {

    const { showMenu, setShowMenu, nextText, todaysDate, hijriDate, locationSettings,
        calculationSettings, deviceSettings, hourAngle, vakits, arcVakits, displayTime, currentVakit, nextVakit, currentArcVakit,
        elapsed, background, dim, clockOpacity, midnightAngle, oneThirdAngle, twoThirdAngle, alarmSettings, naflAlarmSettings, isWeekDay } = useContext(AppContext)
    const canvasRef = useRef(null)
    const driftRef = useRef(null)
    const faceRef = useRef(null)

    const simplified = deviceSettings.clockFace === 'S';
    const size = 1000; /* size = width = height */
    const black = '#0D0E0F';
    const gray = '#4B4E54';
    /* dim mode uses dark red: gentlest on night vision and sleep */
    const nightRed = '#CC3322';
    const nightRedDark = '#5A1510';
    const white = dim === 1 ? nightRed : '#D4D4D4';
    const silver = nightRed;

    useEffect(() => {
        const el = driftRef.current
        if (!el) return
        if (deviceSettings.screenSaver !== 'Y') {
            el.style.transform = 'translate(0px, 0px)'
            document.body.style.backgroundPosition = '50% 50%'
            return
        }
        const speed = 0.3 // pixels per frame
        let x = 0, y = 0, dx = speed, dy = speed * 0.7
        const interval = setInterval(() => {
            const face = faceRef.current
            if (!face) return
            const rect = face.getBoundingClientRect()
            const diffX = Math.abs(window.innerWidth - rect.width) / 2
            const diffY = Math.abs(window.innerHeight - rect.height) / 2
            const maxX = Math.max(diffX, 30)
            const maxY = Math.max(diffY, 30)
            x += dx
            y += dy
            if (x >= maxX || x <= -maxX) dx = -dx
            if (y >= maxY || y <= -maxY) dy = -dy
            x = Math.max(-maxX, Math.min(maxX, x))
            y = Math.max(-maxY, Math.min(maxY, y))
            el.style.transform = `translate(${x}px, ${y}px)`
            if (background.length > 0)
                document.body.style.backgroundPosition = `${50 + x * 0.15}% ${50 + y * 0.15}%`
        }, 50)
        return () => clearInterval(interval)
    }, [deviceSettings.screenSaver])

    useEffect(() => {

        updateBackground(background);
        document.title = 'AdhanClock • ' + currentVakit.name + ' • Next: ' + nextVakit.name + ' @ ' + nextVakit.time + ' in ' + nextText + ' • ' + locationSettings.address;

        if (simplified)
            return;

        const ctx = (canvasRef.current).getContext("2d")

        sac.clearCanvas(ctx)
            .fillCircle(ctx, 490, 0, 0, white, 0.33)
            .fillCircle(ctx, 488, 0, 0, black)
            .drawNumbers24(ctx, 455, 13, white)
            .drawArcs(ctx, 421, 41)
            .drawHand(ctx, midnightAngle, 413, 443, 3.5, black)
            .printAt(ctx, '1/2', 14, white, 403, midnightAngle)
            .drawHand(ctx, oneThirdAngle, 413, 443, 3.5, black)
            .printAt(ctx, '1/3', 14, white, 403, oneThirdAngle)
            .drawHand(ctx, twoThirdAngle, 413, 443, 3.5, black)
            .printAt(ctx, '2/3', 14, white, 403, twoThirdAngle)
            .markAlarms(ctx, 391)
            .drawArrow(ctx, hourAngle, 479, 41, 59, black)
            .drawArrow(ctx, hourAngle, 479, 41, 56, white)
            .drawCircle(ctx, 482, black, 9)
            .print(ctx, displayTime, 250, white, -27)
            .print(ctx, 'Elapsed ' + elapsed + ' · ' + nextVakit.name + ' in', 31, white, 109)
            .print(ctx, nextText, 156, white, 223)
            .arcText(ctx, 'top', todaysDate, 45, 337, white)
            .arcText(ctx, 'top', hijriDate, 39, 265, white)
            .arcText(ctx, 'bottom', '#vakits#', 31, 377, white)

        if (currentArcVakit.name != 'Duhaend')
            sac.print(ctx, currentArcVakit.name, 37, white, -191);

    })

    const sac = {
        clearCanvas: (ctx) => {
            ctx.save();
            ctx.translate(0, 0);
            ctx.clearRect(0, 0, size, size);
            ctx.restore();
            return sac;
        },
        drawHand: (ctx, angle, from, to, lineWidth, color) => {
            ctx.save();
            ctx.translate(size / 2, size / 2);
            ctx.beginPath();
            ctx.rotate(angle);
            ctx.moveTo(from, 0);
            ctx.lineTo(to, 0);
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.lineCap = "round";
            ctx.stroke();
            ctx.restore();
            return sac;
        },
        fillCircle: (ctx, r, x, y, color, opacity) => {
            if (dim === 1)
                return sac;
            ctx.save();
            ctx.translate(size / 2, size / 2);
            if (opacity)
                ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
            return sac;
        },
        print: (ctx, text, textSize, color, y) => {
            ctx.save();
            ctx.translate(size / 2, size / 2);
            ctx.font = 'bold ' + Math.floor(textSize) + 'px Arial';
            ctx.fillStyle = color;
            ctx.textBaseline = "middle";
            ctx.textAlign = 'center';
            ctx.fillText(text, 0, y);
            ctx.restore();
            return sac;
        },
        printAt(ctx, text, textSize, color, r, angle) {
            if (dim === 1)
                return sac;

            ctx.save();
            ctx.translate(size / 2, size / 2);
            ctx.textBaseline = "middle";
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.font = textSize + "px Arial";
            let ang = angle - Math.PI / 2;
            ctx.rotate(ang);
            ctx.translate(0, r);
            ctx.rotate(-ang);
            ctx.fillText(text, 0, 0);
            ctx.restore();
            return sac;
        },
        drawArrow: (ctx, angle, x, width, height, color) => {
            ctx.save();
            ctx.translate(size / 2, size / 2);

            if (dim === 1) {
                width = width / 2.5;
                height = height / 2.5;
                x = x / 1.065;
            }

            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(x, -width);
            ctx.lineTo(x, width);
            ctx.lineTo(x - height, 0);
            ctx.fillStyle = (dim === 1 ? silver : color);
            ctx.fill();
            ctx.restore();
            return sac;
        },
        drawIndicator: (ctx, r, angle, color) => {
            ctx.save();
            ctx.translate(size / 2, size / 2);
            ctx.rotate(angle);
            ctx.lineWidth = 2;
            ctx.strokeStyle = black;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.arc(r * 1.076, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();
            ctx.restore();

        },
        markAlarms: (ctx, r) => {
            alarmSettings.map((a) => {
                if ((a.frequency === 'E') || (a.frequency === 'W' && isWeekDay))
                    sac.drawIndicator(ctx, r, a.angle, 'red')
            });
            naflAlarmSettings.map((a) => {
                sac.drawIndicator(ctx, r, a.angle, 'yellowgreen')
            });
            return sac;
        },
        drawNumbers24: (ctx, r, fontSize, color) => {
            if (dim === 1)
                return sac;

            let p;
            for (let n = 0; n < 24; n++) {
                ctx.save();
                ctx.translate(size / 2, size / 2);
                ctx.textBaseline = "middle";
                ctx.fillStyle = color;
                ctx.textAlign = "center";
                ctx.font = 'bold ' + fontSize + "px Arial";
                let ang = n * Math.PI / 12;
                ctx.rotate(ang);
                ctx.translate(0, r); /* move the cursor */
                ctx.rotate(-ang);
                if (n === 0)
                    p = 12 + 'A';
                else if (n === 12)
                    p = 12 + 'P';
                else if (n < 13)
                    p = n + 'A';
                else
                    p = (n - 12) + 'P';
                ctx.fillText(p, 0, 0);
                ctx.restore();
            }
            for (let m = 0; m < 144; m++) {
                ctx.save();
                ctx.translate(size / 2, size / 2);
                ctx.textBaseline = "middle";
                ctx.fillStyle = color;
                ctx.textAlign = "center";
                let ang = m * Math.PI / 72;
                ctx.rotate(ang);
                ctx.translate(0, r * 0.985);
                if (m % 6 === 0) {
                    /*
                    ctx.font = r * 0.051 + "px Arial";
                    ctx.fillText("|", 0, 0);
                    */
                }
                else {
                    ctx.font = r * 0.05 + "px Arial";
                    ctx.fillText(".", 0, 0);
                }
                ctx.restore();
            }

            return sac;

        },
        drawArcs: (ctx, r, arcWidth) => {

            let borderPadding = Math.PI / 450;
            for (let i = 0; i < arcVakits.length; i++) {
                ctx.save();
                ctx.translate(size / 2, size / 2);
                ctx.beginPath();

                if (currentArcVakit.index === i) {
                    ctx.strokeStyle = (dim === 1 ? nightRedDark : arcVakits[i].color);
                    ctx.lineWidth = arcWidth * 0.41;
                    ctx.globalAlpha = 1;
                }
                else {
                    ctx.strokeStyle = (dim === 1 ? nightRedDark : arcVakits[i].color);
                    ctx.lineWidth = arcWidth * 0.21;
                    ctx.globalAlpha = 0.67;
                }
                ctx.arc(0, 0, r, arcVakits[i].startAngle24(), arcVakits[i].endAngle24() - borderPadding, false);
                ctx.stroke();
                ctx.restore();
            }
            return sac;
        },
        drawCircle: (ctx, r, color, lineWidth, opacity) => {
            ctx.save();
            ctx.translate(size / 2, size / 2);
            if (opacity)
                ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            ctx.restore();
            return sac;
        },
        arcText: (ctx, mode, text, fontSize, distanceFromCenter, color) => {

            if (text === '#vakits#') {
                text = '';
                for (let v in vakits) {
                    text += vakits[v].name + ' ' + format12(vakits[v].time);
                    if (v * 1 !== (vakits.length - 1) * 1)
                        text += ' · ';
                }
            }

            text = text.replace(/,/g, '')

            let startAngle = 0;
            ctx.font = 'bold ' + fontSize + 'px Arial';

            ctx.fillStyle = color;
            if (mode === 'top') {
                startAngle = -ctx.measureText(text).width / (2 * distanceFromCenter);
            }
            else {
                startAngle = ctx.measureText(text).width / (2 * distanceFromCenter);
            }

            let charWidth = {}
            for (var j = 0; j < text.length; j++) {
                charWidth[text[j]] = ctx.measureText(text[j]).width;
            }

            var thisSpace = 0;
            for (var i = 0; i < text.length; i++) {
                thisSpace += charWidth[text[i]] / distanceFromCenter;
                ctx.save();

                if (text[i] === '·')
                    ctx.fillStyle = 'yellow';

                ctx.translate(size / 2, size / 2);
                ctx.textAlign = "right";
                if (mode === 'top') {
                    ctx.rotate(startAngle + thisSpace);
                    ctx.fillText(text[i], 0, -distanceFromCenter);
                }
                else {
                    ctx.rotate(startAngle - thisSpace);
                    ctx.fillText(text[i], 0, distanceFromCenter);
                }

                ctx.restore();
            }
            return sac;
        }
    }

    const updateBackground = (bg) => {
        if (bg.length > 0) {
            document.body.style.backgroundImage = 'url(' + bg + ')';
            document.body.style.backgroundSize = '110% 110%';
            document.body.style.backgroundRepeat = 'no-repeat';
        }
        else {
            document.body.style.backgroundImage = null;
            document.body.style.backgroundSize = null;
            document.body.style.backgroundRepeat = null;
            document.body.style.backgroundPosition = null;
        }
    }

    return (
        <div className='d-flex flex-row h-100 align-items-center justify-content-center'
            style={{ overflow: 'hidden' }}>
            <div ref={driftRef}>
                <div ref={faceRef} onClick={() => setShowMenu(!showMenu)}>
                    {simplified
                        ? <SimpleClock />
                        : <canvas id="clockCanvas" className="img-fluid"
                            style={{ opacity: clockOpacity }}
                            width={size} height={size} ref={canvasRef} ></canvas>}
                </div>
            </div>
        </div >
    );
}
