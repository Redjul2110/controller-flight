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

function resetGame() {
    const minSide = Math.min(canvas.width, canvas.height);
    const grassHeight = Math.max(24, canvas.height * 0.08);
    // Bird-Size: orientiert sich nur an der Höhe, damit das Seitenverhältnis des Bildes erhalten bleibt
    const birdSize = Math.max(32, canvas.height * 0.07);
    bird = {
        x: Math.max(40, canvas.width * 0.15),
        y: (canvas.height - grassHeight) / 2 - birdSize / 2,
        w: birdSize,
        h: birdSize
    };
    pipes = [];
    gravity = Math.max(0.5, canvas.height * 0.001);
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
    pipes.forEach(pipe => {
        // Pipe-Schatten
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#000';
        ctx.fillRect(pipe.x + 6, 6, pipe.w, pipe.top);
        ctx.fillRect(pipe.x + 6, pipe.bottomY + 6, pipe.w, pipe.bottom);
        ctx.globalAlpha = 1;
        ctx.restore();
        // Pipe
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pipeImg, pipe.x, 0, pipe.w, pipe.top);
        ctx.translate(pipe.x + pipe.w, pipe.bottomY);
        ctx.scale(-1, 1);
        ctx.drawImage(pipeImg, 0, 0, pipe.w, pipe.bottom);
        ctx.restore();
        // Pipe-Umrandung
        ctx.save();
        ctx.strokeStyle = '#1a4d1a';
        ctx.lineWidth = Math.max(3, pipe.w * 0.08);
        ctx.strokeRect(pipe.x, 0, pipe.w, pipe.top);
        ctx.strokeRect(pipe.x, pipe.bottomY, pipe.w, pipe.bottom);
        ctx.restore();
    });
}

function draw() {
    drawBackground();
    drawClouds();
    drawPipes();
    drawTopCloudBar(); // Wolkenleiste ganz oben ÜBER den Pipes
    drawScore(); // Score jetzt direkt nach der Wolkenleiste, also UNTER Bird und Pipes
    drawBird();
    drawGrass();
    if (gameOver) {
        // Game Over Schrift mittig und größer
        ctx.font = 'bold ' + Math.max(56, canvas.height * 0.08) + 'px monospace';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
        ctx.font = 'bold ' + Math.max(32, canvas.height * 0.045) + 'px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 - 18);
        ctx.fillText('Drücke Leertaste', canvas.width / 2, canvas.height / 2 + 28);
        // Retry Button anzeigen
        showRetryButton();
    } else {
        hideRetryButton();
    }
    ctx.textAlign = 'left'; // Reset
}

function drawScore() {
    ctx.font = 'bold ' + Math.max(32, canvas.height * 0.045) + 'px monospace';
    ctx.fillStyle = '#ff0'; // Gelb
    ctx.textAlign = 'right';
    // Score weiter unten anzeigen (z.B. 12% der Canvas-Höhe)
    ctx.fillText('Score: ' + score, canvas.width - 40, Math.max(60, canvas.height * 0.12));
    ctx.textAlign = 'left';
}

function drawGrass() {
    // Pixeliges Gras mit dunklerer Umrandung
    // Gras deutlich höher: 18% der Canvas-Höhe, mindestens 48px
    const grassHeight = Math.max(48, canvas.height * 0.18);
    const bladeWidth = Math.max(4, Math.floor(canvas.width / 100));
    for (let x = 0; x < canvas.width; x += bladeWidth) {
        let bladeH = grassHeight + Math.floor(Math.sin(x * 0.15) * 6) + Math.floor(Math.random() * 6);
        ctx.fillStyle = (x / bladeWidth) % 2 === 0 ? '#3cbb2b' : '#2e8b1a';
        // Gras direkt am unteren Rand zeichnen
        ctx.fillRect(x, canvas.height - bladeH, bladeWidth, bladeH);
        ctx.save();
        ctx.strokeStyle = '#145a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, canvas.height - bladeH, bladeWidth, bladeH);
        ctx.restore();
    }
}

// Noch mehr Wolken (44 statt 24)
const clouds = Array.from({length: 44}, (_, i) => ({
    x: Math.random() * window.innerWidth,
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
        // Erzeuge pro Wolke ein festes Muster
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

// Wolkenleiste ganz oben am Bildschirm
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

function update() {
    if (!started) return;
    velocity += gravity;
    bird.y += velocity;
    const grassHeight = Math.max(24, canvas.height * 0.08);
    if (bird.y + bird.h > canvas.height - grassHeight) {
        gameOver = true;
    }
    // Pipes
    pipes.forEach(pipe => {
        pipe.x -= Math.max(2, canvas.width * 0.005);
        // Collision
        if (
            bird.x < pipe.x + pipe.w &&
            bird.x + bird.w > pipe.x &&
            (bird.y < pipe.top || bird.y + bird.h > pipe.bottomY)
        ) {
            gameOver = true;
        }
        // Score
        if (!pipe.passed && pipe.x + pipe.w < bird.x) {
            score++;
            pipe.passed = true;
        }
    });
    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipe.w > 0);
    // Add new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width * 0.5) {
        const grassHeight = Math.max(24, canvas.height * 0.08);
        const gap = Math.max(180, canvas.height * 0.35);
        const top = Math.random() * (canvas.height - grassHeight - gap - 40) + 40;
        const bottomY = top + gap;
        pipes.push({
            x: canvas.width,
            w: Math.max(60, canvas.width * 0.12),
            top: top,
            bottom: canvas.height - grassHeight - bottomY,
            bottomY: bottomY,
            passed: false
        });
    }
}

function draw() {
    drawBackground();
    drawClouds();
    drawPipes();
    drawTopCloudBar(); // Wolkenleiste ganz oben ÜBER den Pipes
    drawScore(); // Score jetzt direkt nach der Wolkenleiste, also UNTER Bird und Pipes
    drawBird();
    drawGrass();
    if (gameOver) {
        // Game Over Schrift mittig und größer
        ctx.font = 'bold ' + Math.max(56, canvas.height * 0.08) + 'px monospace';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
        ctx.font = 'bold ' + Math.max(32, canvas.height * 0.045) + 'px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 - 18);
        ctx.fillText('Drücke Leertaste', canvas.width / 2, canvas.height / 2 + 28);
        // Retry Button anzeigen
        showRetryButton();
    } else {
        hideRetryButton();
    }
    ctx.textAlign = 'left'; // Reset
}

// Retry Button erstellen
let retryBtn = null;
function showRetryButton() {
    if (!retryBtn) {
        retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry';
        retryBtn.style.position = 'fixed';
        retryBtn.style.left = '50%';
        retryBtn.style.top = 'calc(50% + 120px)'; // weiter unten
        retryBtn.style.transform = 'translate(-50%, 0)';
        retryBtn.style.fontSize = Math.max(32, window.innerHeight * 0.045) + 'px';
        retryBtn.style.padding = '18px 48px';
        retryBtn.style.background = '#222';
        retryBtn.style.color = '#ff0';
        retryBtn.style.border = '2px solid #ff0';
        retryBtn.style.borderRadius = '12px';
        retryBtn.style.cursor = 'pointer';
        retryBtn.style.zIndex = 1000;
        retryBtn.style.fontFamily = 'monospace';
        retryBtn.onclick = () => {
            startGame();
        };
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
    gameLoop();
}

playBtn.onclick = startGame;

document.addEventListener('keydown', function(e) {
    if (canvas.style.display === 'block') {
        if (e.code === 'Space') {
            if (!started) {
                started = true;
                gameLoop();
            } else if (!gameOver) {
                velocity = -Math.max(8, canvas.height * 0.018);
            } else {
                startGame();
            }
        }
    }
});

// Touch/Click Steuerung
canvas.addEventListener('pointerdown', function() {
    if (!started) {
        started = true;
        gameLoop();
    } else if (!gameOver) {
        velocity = -Math.max(8, canvas.height * 0.018);
    } else {
        startGame();
    }
});

// Bildschirmgröße anpassen
function resizeCanvas() {
    // Für Mobilgeräte: devicePixelRatio berücksichtigen
    const dpr = window.devicePixelRatio || 1;
    // Versuche, die tatsächliche Viewport-Größe zu bekommen (auch für iOS Safari, Android Chrome, etc.)
    let width = window.innerWidth;
    let height = window.innerHeight;
    // Nutze window.visualViewport, aber nur wenn sinnvoll (nicht bei Desktop mit mehreren Bildschirmen)
    if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
        width = window.visualViewport.width;
        height = window.visualViewport.height;
    }
    // iOS Safari: Zusätzlicher Fix für Adressleisten-Problem
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        if (document.documentElement.clientHeight > 0 && document.documentElement.clientHeight < height) {
            height = document.documentElement.clientHeight;
        }
    }
    // Fallback für Standalone/PWA: nutze screen.height, falls kleiner
    if (window.matchMedia('(display-mode: standalone)').matches) {
        width = Math.min(width, screen.width);
        height = Math.min(height, screen.height);
    }
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(dpr, dpr);
    // Passe Menü und Play-Button direkt an neue Größe an
    centerMenu();
}
window.addEventListener('resize', resizeCanvas, {passive: false});
window.addEventListener('orientationchange', resizeCanvas, {passive: false});
// iOS: Bei Fokusverlust/Scroll/Touch nochmal anpassen
window.addEventListener('focus', resizeCanvas);
window.addEventListener('touchend', resizeCanvas);
resizeCanvas();

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
        // Auf Touch-Geräten noch größer
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const size = isTouch
            ? Math.max(220, Math.min(window.innerWidth, window.innerHeight) * 0.45)
            : Math.max(180, Math.min(window.innerWidth, window.innerHeight) * 0.32);
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
