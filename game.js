const menu = document.getElementById('main-menu');
const playBtn = document.getElementById('play-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Images
const birdImg = new Image();
birdImg.src = 'Png/controller flight.png';
const pipeImg = new Image();
pipeImg.src = 'Png/Wand.png';

// Game variables
let bird, pipes, gravity, velocity, score, gameOver, started;

// Globale mapScale-Berechnung
let globalMapScale = 1;

function getMapScale() {
    const isMobile = window.innerWidth < 600 || window.innerHeight < 600;
    return isMobile ? 1.2 : 1.3;
}

function resetGame() {
    globalMapScale = getMapScale();
    const mapScale = globalMapScale;
    const isMobile = window.innerWidth < 600 || window.innerHeight < 600;
    const minW = isMobile ? 120 : Math.max(180, Math.min(canvas.width, canvas.height, window.innerWidth, window.innerHeight));
    const minH = isMobile ? 180 : Math.max(260, Math.min(canvas.height, window.innerHeight));
    const grassHeight = Math.max(12, Math.round(canvas.height * 0.07 * mapScale));
    // Bird-Size: noch kleiner (0.032 der Canvas-Höhe)
    const birdSize = Math.max(10, Math.round(canvas.height * 0.032 * mapScale));
    bird = {
        x: Math.max(8, Math.round(canvas.width * 0.10 * mapScale)), // zurück zu 10% der Canvas-Breite
        y: (canvas.height - grassHeight) / 2 - birdSize / 2,
        w: birdSize,
        h: birdSize
    };
    pipes = [];
    // Gravity für frame-unabhängig kleiner machen
    gravity = Math.max(0.13, canvas.height * 0.00028 * mapScale); // langsameres Fallen
    velocity = 0;
    score = 0;
    gameOver = false;
    started = false;
}

function drawBackground() {
    // Himmel mit Farbverlauf
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#6ec6ff'); // hellblau oben
    grad.addColorStop(1, '#b3e5fc'); // fast weiß unten
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBird() {
    // Schatten entfernt
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(birdImg, bird.x, bird.y, bird.w, bird.h);
    ctx.restore();
}

function drawPipes() {
    const mapScale = globalMapScale;
    pipes.forEach(pipe => {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#000';
        ctx.fillRect(pipe.x + 6 * mapScale, 6 * mapScale, pipe.w * mapScale, pipe.top * mapScale);
        ctx.fillRect(pipe.x + 6 * mapScale, pipe.bottomY * mapScale + 6 * mapScale, pipe.w * mapScale, pipe.bottom * mapScale);
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pipeImg, pipe.x, 0, pipe.w * mapScale, pipe.top * mapScale);
        ctx.translate(pipe.x + pipe.w * mapScale, pipe.bottomY * mapScale);
        ctx.scale(-1, 1);
        ctx.drawImage(pipeImg, 0, 0, pipe.w * mapScale, pipe.bottom * mapScale);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#1a4d1a';
        ctx.lineWidth = Math.max(2, pipe.w * 0.06 * mapScale);
        ctx.strokeRect(pipe.x, 0, pipe.w * mapScale, pipe.top * mapScale);
        ctx.strokeRect(pipe.x, pipe.bottomY * mapScale, pipe.w * mapScale, pipe.bottom * mapScale);
        ctx.restore();
    });
}

function draw() {
    // Kamera folgt dem Vogel vertikal und horizontal (Vogel bleibt immer mittig, außer am Rand)
    let camY = 0;
    let camX = 0;
    if (bird) {
        const isMobile = window.innerWidth < 600 || window.innerHeight < 600;
        const grassHeight = isMobile ? Math.max(12, Math.round(canvas.height * 0.07)) : Math.max(24, Math.round(canvas.height * 0.14));
        const centerY = canvas.height / 2;
        const centerX = canvas.width / 2;
        camY = bird.y + bird.h / 2 - centerY;
        camX = bird.x + bird.w / 2 - centerX;
        // Clamp: Kamera darf nicht über den oberen Rand oder unter das Gras scrollen
        camY = Math.max(0, Math.min(camY, (canvas.height - grassHeight) - canvas.height));
        // Clamp: Kamera darf nicht über den linken Rand (0) hinaus
        camX = Math.max(0, camX); // Optional: nach rechts nicht clampen, da endlos
    }
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Canvas immer leeren
    ctx.translate(-camX, -camY);
    drawBackground();
    drawClouds();
    drawPipes();
    drawTopCloudBar();
    drawBird();
    drawGrass();
    ctx.restore();
    // Score und Game Over Overlay immer HUD-zentriert (nicht mit Kamera verschieben)
    drawScore();
    if (gameOver) {
        ctx.save();
        ctx.textAlign = 'center';
        const isMobile = window.innerWidth < 600 || window.innerHeight < 600;
        const goFont = isMobile ? Math.max(16, Math.round(canvas.height * 0.045)) : Math.max(32, Math.round(canvas.height * 0.08));
        ctx.font = 'bold ' + goFont + 'px monospace';
        ctx.fillStyle = '#ff0';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - goFont * 0.7);
        ctx.shadowBlur = 0;
        ctx.font = 'bold ' + (isMobile ? Math.max(10, Math.round(canvas.height * 0.03)) : Math.max(18, Math.round(canvas.height * 0.045))) + 'px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2);
        ctx.restore();
        showRetryButton();
    } else {
        hideRetryButton();
    }
    ctx.textAlign = 'left'; // Reset
}

function drawScore() {
    // Score noch kleiner auf Handy
    const isMobile = window.innerWidth < 600 || window.innerHeight < 600;
    const fontSize = isMobile ? Math.max(10, Math.round(canvas.height * 0.03)) : Math.max(18, Math.round(canvas.height * 0.045));
    ctx.font = 'bold ' + fontSize + 'px monospace';
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'right';
    ctx.fillText('Score: ' + score, canvas.width - 8, isMobile ? Math.max(16, canvas.height * 0.06) : Math.max(32, canvas.height * 0.10));
    ctx.textAlign = 'left';
}

function drawGrass() {
    // Gras immer am unteren Rand, unabhängig von mapScale
    const isMobile = window.innerWidth < 600 || window.innerHeight < 600;
    const grassHeight = isMobile ? Math.max(12, Math.round(canvas.height * 0.07)) : Math.max(24, Math.round(canvas.height * 0.14));
    const bladeWidth = isMobile ? Math.max(1, Math.floor(canvas.width / 60)) : Math.max(2, Math.floor(canvas.width / 80));
    for (let x = 0; x < canvas.width; x += bladeWidth) {
        let bladeH = grassHeight + Math.floor(Math.sin(x * 0.15) * (isMobile ? 2 : 4)) + Math.floor(Math.random() * (isMobile ? 2 : 4));
        ctx.fillStyle = (x / bladeWidth) % 2 === 0 ? '#3cbb2b' : '#2e8b1a';
        ctx.fillRect(x, canvas.height - bladeH, bladeWidth, bladeH);
        ctx.save();
        ctx.strokeStyle = '#145a1a';
        ctx.lineWidth = isMobile ? 0.5 : 1;
        ctx.strokeRect(x, canvas.height - bladeH, bladeWidth, bladeH);
        ctx.restore();
    }
}

// Noch mehr Wolken (44 statt 24)
const clouds = Array.from({length: 44}, (_, i) => ({
    x: Math.random() * window.innerWidth, // wieder normale Breite
    y: Math.random() * (window.innerHeight * 0.35) + 30,
    w: Math.random() * 120 + 120,
    h: Math.random() * 60 + 60,
    speed: 0.15 + Math.random() * 0.25
}));
function drawClouds() {
    clouds.forEach(cloud => {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#fff';
        // Pixelige Wolken: feste Rechtecke, nicht random pro Frame
        if (!cloud.pattern) {
            cloud.pattern = [];
            for (let i = 0; i < 5; i++) {
                let px = Math.round((Math.random() - 0.5) * cloud.w * 0.5);
                let py = Math.round((Math.random() - 0.5) * cloud.h * 0.5);
                let pw = Math.round(cloud.w * (0.18 + Math.random() * 0.18));
                let ph = Math.round(cloud.h * (0.18 + Math.random() * 0.18));
                cloud.pattern.push({px, py, pw, ph});
            }
        }
        cloud.pattern.forEach(rect => {
            ctx.fillRect(Math.round(cloud.x + rect.px), Math.round(cloud.y + rect.py), rect.pw, rect.ph);
        });
        ctx.globalAlpha = 1;
        ctx.restore();
        // Bewegung
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.w < 0) {
            cloud.x = canvas.width + cloud.w;
            cloud.y = Math.random() * (canvas.height * 0.35) + 30;
            cloud.pattern = undefined; // neues Muster beim Reset
        }
    });
}

function drawTopCloudBar() {
    // Feste "Wolkenleiste" am oberen Rand, pixelig
    const barHeight = Math.max(32, canvas.height * 0.08);
    const cloudCount = Math.ceil(canvas.width / 64);
    for (let i = 0; i < cloudCount; i++) {
        const x = i * 64 + Math.random() * 8;
        const y = Math.random() * 8;
        const w = 56 + Math.random() * 16;
        const h = barHeight * (0.7 + Math.random() * 0.5);
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#fff';
        // Pixelige "Wolke" aus 2-3 Rechtecken
        for (let j = 0; j < 2 + Math.floor(Math.random() * 2); j++) {
            const px = x + Math.random() * 18 - 9;
            const py = y + Math.random() * (barHeight * 0.3);
            const pw = w * (0.5 + Math.random() * 0.5);
            const ph = h * (0.5 + Math.random() * 0.5);
            ctx.fillRect(Math.round(px), Math.round(py), Math.round(pw), Math.round(ph));
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

let lastFrameTime = null;

function gameLoop(now) {
    if (!lastFrameTime) lastFrameTime = now;
    const delta = Math.min((now - lastFrameTime) / 16.666, 2); // 1 = 60fps, capped bei 2 (30fps)
    lastFrameTime = now;
    update(delta);
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    } else {
        lastFrameTime = null;
    }
}

// update bekommt jetzt delta als Parameter
function update(delta = 1) {
    if (!started) return;
    const mapScale = globalMapScale;
    // Fallgeschwindigkeit frame-unabhängig, aber sanfter
    velocity += gravity * delta;
    bird.y += velocity * delta;
    const grassHeight = Math.max(12, Math.round(canvas.height * 0.07 * mapScale));
    if (bird.y + bird.h > canvas.height - grassHeight) {
        gameOver = true;
    }
    const hitbox = {
        x: bird.x,
        y: bird.y,
        w: bird.w,
        h: bird.h
    };
    pipes.forEach(pipe => {
        pipe.x -= Math.max(2, canvas.width * 0.005 * mapScale) * delta;
        if (
            hitbox.x < pipe.x + pipe.w * mapScale &&
            hitbox.x + hitbox.w > pipe.x &&
            (hitbox.y < pipe.top * mapScale || hitbox.y + hitbox.h > pipe.bottomY * mapScale)
        ) {
            gameOver = true;
        }
        if (!pipe.passed && pipe.x + pipe.w * mapScale < bird.x) {
            score++;
            pipe.passed = true;
        }
    });
    pipes = pipes.filter(pipe => pipe.x + pipe.w * mapScale > 0);
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width * 0.5) { // wieder Standard
        // Dynamische Gap: Start groß, wird mit Score kleiner, aber nie zu klein
        const startGap = 0.26;
        const minGap = 0.13;
        const shrinkPerPoint = 0.008;
        let gapFactor = startGap - score * shrinkPerPoint;
        if (gapFactor < minGap) gapFactor = minGap;
        const gap = Math.max(80, canvas.height * gapFactor * mapScale);
        const grassHeight = Math.max(12, Math.round(canvas.height * 0.07 * mapScale));
        // Mindestabstand der Lücke zu oben/unten erhöhen (z.B. 48px)
        const minTop = 48;
        const maxTop = Math.max(minTop, canvas.height - grassHeight - gap - 48);
        const top = Math.random() * (maxTop - minTop) + minTop;
        const bottomY = top + gap;
        pipes.push({
            x: canvas.width, // wieder Standard
            w: Math.max(20, canvas.width * 0.07 * mapScale),
            top: top,
            bottom: (canvas.height - grassHeight) - bottomY,
            bottomY: bottomY,
            passed: false
        });
    }
}

// Retry Button erstellen
let retryBtn = null;
function showRetryButton() {
    if (!retryBtn) {
        retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry';
        retryBtn.style.position = 'fixed';
        retryBtn.style.left = '50%';
        retryBtn.style.top = 'calc(50% + 120px)';
        retryBtn.style.transform = 'translate(-50%, 0)';
        retryBtn.style.fontSize = Math.max(32, window.innerHeight * 0.045) + 'px';
        retryBtn.style.padding = '18px 48px';
        retryBtn.style.zIndex = 2000;
        retryBtn.style.background = '#fff';
        retryBtn.style.color = '#222';
        retryBtn.style.border = 'none';
        retryBtn.style.borderRadius = '16px';
        retryBtn.style.boxShadow = '0 4px 24px #0008';
        retryBtn.style.fontFamily = 'inherit';
        retryBtn.style.fontWeight = 'bold';
        retryBtn.style.cursor = 'pointer';
        retryBtn.style.display = 'none';
        retryBtn.style.outline = 'none';
        retryBtn.style.touchAction = 'manipulation';
        retryBtn.addEventListener('click', function() {
            resetGame();
            started = true;
            hideRetryButton();
            gameLoop();
        });
        document.body.appendChild(retryBtn);
    }
    retryBtn.style.display = 'block';
    retryBtn.style.top = 'calc(50% + 120px)';
    retryBtn.style.fontSize = Math.max(32, window.innerHeight * 0.045) + 'px';
}
function hideRetryButton() {
    if (retryBtn) retryBtn.style.display = 'none';
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    menu.style.display = 'none';
    canvas.style.display = 'block';
    resetGame();
    started = true;
    hideRetryButton();
    lastFrameTime = null;
    requestAnimationFrame(gameLoop);
}

playBtn.onclick = startGame;

document.addEventListener('keydown', function(e) {
    if (canvas.style.display === 'block') {
        if ((e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') && !gameOver) {
            velocity = -Math.max(2.7, canvas.height * 0.0105 * 0.7); // Sprunghöhe reduziert
            started = true;
        } else if (gameOver && (e.code === 'Space' || e.key === ' ' || e.key === 'Enter')) {
            resetGame();
            started = true;
            hideRetryButton();
            gameLoop();
        }
    }
});

canvas.addEventListener('pointerdown', function() {
    if (!started && !gameOver) {
        started = true;
        velocity = -Math.max(2.7, canvas.height * 0.0105 * 0.7); // Sprunghöhe reduziert
    } else if (!gameOver) {
        velocity = -Math.max(2.7, canvas.height * 0.0105 * 0.7); // Sprunghöhe reduziert
    } else if (gameOver) {
        resetGame();
        started = true;
        hideRetryButton();
        gameLoop();
    }
});

// canvas/context-Fehler nach Resizing verhindern
function resizeCanvas() {
    // Canvas immer auf volle Fenstergröße (ohne Seitenverhältnis-Zwang)
    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;
    // Mindestgrößen für große Bildschirme
    w = Math.max(320, w);
    h = Math.max(480, h);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.transform = 'none';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    centerMenu();
}

// Touch-Optimierung: kein Scrollen, kein Doppeltippen-Zoom
window.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
document.body.style.overscrollBehavior = 'none';
document.body.style.touchAction = 'manipulation';

// Play-Button und Menü mittig und größer
function centerMenu() {
    if (menu) {
        menu.style.position = 'fixed';
        menu.style.left = '50%';
        menu.style.top = '50%';
        menu.style.transform = 'translate(-50%, -50%)';
        menu.style.width = '100vw';
        menu.style.textAlign = 'center';
        menu.style.zIndex = 1000;
        menu.style.userSelect = 'none';
        menu.style.touchAction = 'manipulation';
    }
    resizePlayBtn();
}
centerMenu();
window.addEventListener('resize', centerMenu);

function resizePlayBtn() {
    if (playBtn) {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        // Noch größere Buttons auf Mini-Displays
        const minBtn = Math.max(80, Math.min(window.innerWidth, window.innerHeight) * 0.45);
        const size = isTouch
            ? Math.max(minBtn, Math.min(window.innerWidth, window.innerHeight) * 0.55)
            : Math.max(60, Math.min(window.innerWidth, window.innerHeight) * 0.32);
        playBtn.style.width = size + 'px';
        playBtn.style.height = size + 'px';
        playBtn.querySelector('img').style.width = '100%';
        playBtn.querySelector('img').style.height = '100%';
        playBtn.querySelector('img').style.objectFit = 'contain';
    }
}

// Pixel-Rendering für Bilder
birdImg.onload = () => { birdImg.style = 'image-rendering: pixelated'; };
pipeImg.onload = () => { pipeImg.style = 'image-rendering: pixelated'; };