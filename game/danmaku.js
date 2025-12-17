
import { danmaku_assets } from './danmaku_assets.js';

let bullets = [];
let nextBulletId = 0;

// Single canvas for all danmaku
let canvas = null;
let ctx = null;

// Pre-rendered assets
const assetCache = {};
function preRenderAssets() {
    for (const [key, pixelData] of Object.entries(danmaku_assets)) {
        if (assetCache[key]) continue;

        const height = pixelData.length;
        const width = pixelData[0].length;

        const offscreen = document.createElement('canvas');
        offscreen.width = width * 5; // Scale x2 as per original logic
        offscreen.height = height * 5;
        const oCtx = offscreen.getContext('2d');

        // Draw pixels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = pixelData[y][x];
                if (color !== "rgba(0,0,0,0)") {
                    oCtx.fillStyle = color;
                    oCtx.fillRect(x * 5, y * 5, 5, 5);
                }
            }
        }
        assetCache[key] = offscreen;
    }
}

function initCanvas() {
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'danmaku_layer';
        canvas.width = 1200; // Game width
        canvas.height = 700; // Game height
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '3'; // Above normal elements
        canvas.style.pointerEvents = 'none'; // Click-through
        document.body.appendChild(canvas); // Append to body or game container
        ctx = canvas.getContext('2d');
    }
    // Clear canvas on init
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function generate(bulletType, x, y, speed, angle, pattern = 'straight', options = {}) {
    if (bullets.length > 2000) { // Increased limit due to better performance
        return;
    }

    if (!assetCache[bulletType]) {
        console.error(`Danmaku asset not found or not pre-rendered: ${bulletType}`);
        return;
    }

    const asset = assetCache[bulletType];
    const bulletId = `bullet_${nextBulletId++}`;

    const rad = angle * Math.PI / 180;

    const bullet = {
        id: bulletId,
        type: bulletType,
        x: x,
        y: y,
        vx: Math.cos(rad) * speed * 4,
        vy: Math.sin(rad) * speed * 4,
        life: 2000,
        pattern: pattern,
        patternState: {},
        options: options,
        width: asset.width,
        height: asset.height,
        halfWidth: asset.width / 2,
        halfHeight: asset.height / 2,
        size: Math.max(asset.width, asset.height) / 2, // Approximate radius for collision
    };

    bullets.push(bullet);
}

function update(player, onPlayerHit) {
    if (!player || !ctx) return;

    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.life--;

        // --- Pattern Logic ---
        switch (bullet.pattern) {
            case 'homing':
                if (bullet.life > 1900) {
                    bullet.x += bullet.vx;
                    bullet.y += bullet.vy;
                } else {
                    const angleToPlayer = Math.atan2(player.gui.y - bullet.y, player.gui.x - bullet.x);
                    const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                    bullet.vx = Math.cos(angleToPlayer) * speed;
                    bullet.vy = Math.sin(angleToPlayer) * speed;
                    bullet.x += bullet.vx;
                    bullet.y += bullet.vy;
                }
                break;
            case 'wavy':
                if (!bullet.patternState.initialAngle) {
                    bullet.patternState.initialAngle = Math.atan2(bullet.vy, bullet.vx);
                    bullet.patternState.tick = 0;
                }
                bullet.patternState.tick++;
                const baseAngle = bullet.patternState.initialAngle;
                const waveAngle = baseAngle + Math.sin(bullet.patternState.tick / 20) * (bullet.options.waveAmp || 0.5);
                const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                const speedX = Math.cos(baseAngle) * speed;
                const speedY = Math.sin(waveAngle) * speed * 2;

                // We need to actually move based on the composite vector, 
                // but for simple wavy implementation relative to direction:
                // Let's keep it simple: project 'forward' and add 'sideways' oscillation?
                // The current implementation was:
                // x += cos(base) * speed
                // y += sin(wave) * speed
                // This assumes base is roughly horizontal/diagonal?
                // Let's stick to the previous logic which seemed verified:
                bullet.x += Math.cos(baseAngle) * speed;
                bullet.y += Math.sin(waveAngle) * speed * 2;
                break;
            default: // 'straight'
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                break;
        }

        // --- Draw ---
        const asset = assetCache[bullet.type];
        if (asset) {
            // Draw centered
            ctx.drawImage(asset, bullet.x - bullet.halfWidth, bullet.y - bullet.halfHeight);
        }

        // --- Collision Check ---
        // Simple circle collision
        const dx = player.gui.x - bullet.x;
        const dy = player.gui.y - bullet.y;
        // Collision distance: player radius (~5px visually but let's say 10) + bullet radius
        // Player width in game_main is usually small dots, let's assume 10px radius for safety
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < (10 + bullet.size / 2)) {
            if (onPlayerHit) {
                onPlayerHit();
            }
            bullets.splice(i, 1);
            continue;
        }


        // --- Cleanup ---
        if (bullet.life <= 0 || bullet.x < -100 || bullet.x > 1300 || bullet.y < -100 || bullet.y > 800) {
            bullets.splice(i, 1);
        }
    }
}

function init() {
    bullets = [];
    nextBulletId = 0;
    preRenderAssets();
    initCanvas();
}


export const danmakuEngine = {
    init,
    generate,
    update
};
