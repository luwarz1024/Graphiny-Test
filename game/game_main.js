import { danmakuEngine } from './danmaku.js';
import { Creation } from './Creation.js';
import { systems } from './systems.js';
import { getmoviedata } from './movies.js';

// Mobile Support System
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 768;
}

let virtualKeys = {};



function simulateKeyPress(key, isDown) {
    virtualKeys[key] = isDown;
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
        key: key,
        code: key,
        bubbles: true
    });
    document.dispatchEvent(event);
}

export async function start() {
    window.battleActive = false;

    async function preloadAssets() {
        return;
    }

    await preloadAssets();

    // Mobile Support: Responsive Canvas Scaling
    function setupResponsiveCanvas() {
        const stage = document.getElementById('stage');
        function resizeCanvas() {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const gameWidth = 1200;
            const gameHeight = 700;
            const scale = Math.min(windowWidth / gameWidth, windowHeight / gameHeight, 1);

            stage.style.width = `${gameWidth}px`;
            stage.style.height = `${gameHeight}px`;
            stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeCanvas, 100);
        });
    }
    setupResponsiveCanvas();

    // Mobile Support: Virtual D-Pad
    function createVirtualDPad() {
        if (!isMobile()) return;

        const dpad = document.createElement('div');
        dpad.id = 'virtual-dpad';
        dpad.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 30px;
        width: 180px;
        height: 180px;
        z-index: 10000;
        opacity: 0.6; 
    `;

        const directions = [
            { id: 'up', label: '↑', top: '0', left: '50%', transform: 'translateX(-50%)', key: 'ArrowUp' },
            { id: 'down', label: '↓', bottom: '0', left: '50%', transform: 'translateX(-50%)', key: 'ArrowDown' },
            { id: 'left', label: '←', top: '50%', left: '0', transform: 'translateY(-50%)', key: 'ArrowLeft' },
            { id: 'right', label: '→', top: '50%', right: '0', transform: 'translateY(-50%)', key: 'ArrowRight' }
        ];

        directions.forEach(dir => {
            const btn = document.createElement('div');
            btn.textContent = dir.label;
            btn.style.cssText = `
            position: absolute;
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: rgba(255,255,255,0.5);
            user-select: none;
            touch-action: none;
            ${dir.top ? `top: ${dir.top};` : ''}
            ${dir.bottom ? `bottom: ${dir.bottom};` : ''}
            ${dir.left ? `left: ${dir.left};` : ''}
            ${dir.right ? `right: ${dir.right};` : ''}
            transform: ${dir.transform};
        `;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                simulateKeyPress(dir.key, true);
                btn.style.background = 'rgba(255,255,255,0.2)';
                btn.style.borderColor = 'rgba(255,255,255,0.4)';
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                simulateKeyPress(dir.key, false);
                btn.style.background = 'rgba(255,255,255,0.05)';
                btn.style.borderColor = 'rgba(255,255,255,0.2)';
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                simulateKeyPress(dir.key, false);
                btn.style.background = 'rgba(255,255,255,0.05)';
                btn.style.borderColor = 'rgba(255,255,255,0.2)';
            }, { passive: false });

            dpad.appendChild(btn);
        });

        // Attack Button
        const attackBtn = document.createElement('div');
        attackBtn.textContent = 'A';
        attackBtn.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 40px;
        width: 80px;
        height: 80px;
        background: rgba(255, 50, 50, 0.1);
        border: 2px solid rgba(255, 50, 50, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
        color: rgba(255, 255, 255, 0.6);
        z-index: 10000;
        user-select: none;
        touch-action: none;
    `;

        attackBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            simulateKeyPress(' ', true); // Spacebar
            attackBtn.style.background = 'rgba(255, 50, 50, 0.3)';
            attackBtn.style.borderColor = 'rgba(255, 50, 50, 0.6)';
            attackBtn.style.transform = 'scale(0.95)';
        }, { passive: false });

        attackBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            simulateKeyPress(' ', false);
            attackBtn.style.background = 'rgba(255, 50, 50, 0.1)';
            attackBtn.style.borderColor = 'rgba(255, 50, 50, 0.3)';
            attackBtn.style.transform = 'scale(1)';
        }, { passive: false });

        attackBtn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            simulateKeyPress(' ', false);
            attackBtn.style.background = 'rgba(255, 50, 50, 0.1)';
            attackBtn.style.borderColor = 'rgba(255, 50, 50, 0.3)';
            attackBtn.style.transform = 'scale(1)';
        }, { passive: false });

        document.body.appendChild(attackBtn);

        document.body.appendChild(dpad);
    }
    createVirtualDPad();

    let savedata = {};
    let push = null;
    const playClick = () => {
        if (typeof soundeffect === 'function') {
            soundeffect("./game/music/button.mp3");
        } else {
            console.warn("soundeffect function not found");
        }
    }
    const playHover = () => {
    };

    async function dataload() {
        return {
            start: {
                game: false
            },
        };
    }

    async function datasave() {
        return;
    }


    savedata = await dataload();
    console.log(savedata);
    class SmoothImage extends Creation {
        constructor(name, imageSrc, x = 0, y = 0, width = 100, height = 100) {
            super(name, 'gui', {
                typeValue: imageSrc,
                x: x,
                y: y,
                width: width,
                height: height,
            }, 'image');
            this.targetX = x;
            this.targetY = y;
            this.targetWidth = width;
            this.targetHeight = height;
            this.rotation = 0;
            this.targetRotation = 0;
            this.easing = 0.1;
            this.isAnimating = false;
            this.img = new Image();
            this.img.src = imageSrc;
            this.img.onload = () => {
                this.canvas();
                this.moveTo(this.targetX, this.targetY, this.targetWidth, this.targetHeight, this.targetRotation);
            }
        }

        moveTo(x, y, w, h, r) {
            this.targetX = x;
            this.targetY = y;
            this.targetWidth = w !== undefined ? w : this.gui.width;
            this.targetHeight = h !== undefined ? h : this.gui.height;
            this.targetRotation = r !== undefined ? r : this.rotation;
            if (!this.isAnimating) this.animate();
        }

        rotateTo(degree) {
            this.targetRotation = degree;
            if (!this.isAnimating) this.animate();
        }

        animate() {
            this.isAnimating = true;
            const step = () => {
                const dx = this.targetX - this.gui.x;
                const dy = this.targetY - this.gui.y;
                const dw = this.targetWidth - this.gui.width;
                const dh = this.targetHeight - this.gui.height;
                const dr = this.targetRotation - this.rotation;

                if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(dw) < 0.5 && Math.abs(dh) < 0.5 && Math.abs(dr) < 0.5) {
                    this.gui.x = this.targetX;
                    this.gui.y = this.targetY;
                    this.gui.width = this.targetWidth;
                    this.gui.height = this.targetHeight;
                    this.rotation = this.targetRotation;
                    this.canvas();
                    this.isAnimating = false;
                    return;
                }

                this.gui.x += dx * this.easing;
                this.gui.y += dy * this.easing;
                this.gui.width += dw * this.easing;
                this.gui.height += dh * this.easing;
                this.rotation += dr * this.easing;

                this.canvas();
                requestAnimationFrame(step);
            };

            step();
        }

        removeImage() {
            this.remove();
            this.img = null;
        }
    }
    function colorbackground(color) {
        const background = Creation.create("background", "gui", {
            typeValue: color,
            width: 1200,
            height: 700,
            zIndex: 1,
        }, "colorfill");
        background.canvas();
        return background;
    }

    function imagebackground(image) {
        let background;
        if (image == "kuro") {
            background = Creation.create("background", "gui", {
                typeValue: "#000000",
                width: 1200,
                height: 700,
                zIndex: 1,
            }, "colorfill");
        } else {
            background = Creation.create("background", "gui", {
                typeValue: image,
                width: 1200,
                height: 700,
                zIndex: 1,
            }, "image");


            background.canvas = function () {
                const cre = document.getElementById(this.name);
                if (!cre) return;
                const ctx = cre.getContext('2d');
                ctx.clearRect(0, 0, this.gui.maxWidth, this.gui.maxHeight);

                const cx = this.gui.x;
                const cy = this.gui.y;

                ctx.save();
                ctx.translate(cx, cy);

                if (!this.img) {
                    this.img = new Image();
                    this.img.src = this.gui.typeValue;
                    this.img.onload = () => {
                        this.canvas();
                    };
                }

                if (this.img && this.img.complete && this.img.naturalWidth > 0) {
                    const imgW = this.img.naturalWidth;
                    const imgH = this.img.naturalHeight;
                    const canvasW = this.gui.width;
                    const canvasH = this.gui.height;

                    const scale = Math.max(canvasW / imgW, canvasH / imgH);
                    const x = (canvasW / 2) - (imgW / 2) * scale;
                    const y = (canvasH / 2) - (imgH / 2) * scale;

                    ctx.drawImage(this.img, x, y, imgW * scale, imgH * scale);
                }

                ctx.restore();
            };
        }
        background.canvas();
        return background;
    }

    function addbg(parent) {
        // Create canvas for the background effect
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = `
            position: absolute; inset: 0; z-index: -1; pointer-events: none;
            background: radial-gradient(circle at center, #0a0a20 0%, #000000 100%);
        `;
        // Insert as first child to be behind everything
        if (parent.firstChild) {
            parent.insertBefore(canvas, parent.firstChild);
        } else {
            parent.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        let width, height;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Node Network Logic
        const nodes = [];
        const nodeCount = 60;
        const connectionDistance = 150;

        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 2 + 1
            });
        }

        function animateNodes() {
            if (!parent.isConnected) {
                window.removeEventListener('resize', resize);
                return; // Stop animation if parent is removed
            }

            ctx.clearRect(0, 0, width, height);

            // Update and draw nodes
            ctx.fillStyle = '#00ffff';
            nodes.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                if (node.x < 0 || node.x > width) node.vx *= -1;
                if (node.y < 0 || node.y > height) node.vy *= -1;

                ctx.beginPath();
                ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw connections
            ctx.lineWidth = 0.5;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        const opacity = 1 - (dist / connectionDistance);
                        ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * 0.5})`;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animateNodes);
        }
        animateNodes();

        return canvas;
    }
    function saferemove(id) {
        const el = document.getElementById(id);
        if (el) {
            if (el.creationInstance) {
                el.creationInstance.remove();
            } else {
                el.remove();
            }
        }
    }
    async function bullethells(bhnumber, color) {
        console.log(systems._bulletHells[bhnumber](beam, systems, color), bhnumber)
        return await systems._bulletHells[bhnumber](beam, systems, color);
    }
    function button_create(button_name, buttonX, buttonY) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = "40px 'DotJP'";
        const textWidth = ctx.measureText(button_name).width;

        const padding = 20 * 2;
        const bgWidth = Math.max(120, Math.ceil(textWidth + padding));

        const button_back = Creation.create(
            button_name + "_back", "gui",
            {
                zIndex: 5 + 2,
                typeValue: "#ffffff",
                conditions: [null, null, null, null],
                x: buttonX,
                y: buttonY,
                speed: 0,
                width: bgWidth,
                height: 60,
            },
            "colorfill"
        );

        const button_back_line = Creation.create(
            button_name + "_back_line", "gui",
            {
                zIndex: 5 + 1,
                typeValue: "#000000",
                conditions: [null, null, null, null],
                x: buttonX - 5,
                y: buttonY - 5,
                speed: 0,
                width: bgWidth + 10,
                height: 60 + 10,
            },
            "colorfill"
        );
        button_back.canvas();

        const textX = buttonX + (bgWidth - textWidth) / 2 - 5;
        const textY = buttonY + (70 / 2);
        const button_text = Creation.create(
            button_name, "gui",
            {
                zIndex: 5 + 3,
                typeValue: [40, button_name],
                conditions: [null, null, null, null],
                x: textX,
                y: textY,
                speed: 0,
                width: Math.ceil(textWidth),
                height: 40,
            },
            "text"
        );
        button_text.canvas();
        button_back_line.canvas();
        function clickhandler(event) {
            const stage = document.getElementById('stage');
            const rect = stage.getBoundingClientRect();
            const scaleX = 1200 / rect.width;
            const scaleY = 700 / rect.height;
            const clickX = (event.clientX - rect.left) * scaleX;
            const clickY = (event.clientY - rect.top) * scaleY;
            if (
                clickX >= button_back.gui.x &&
                clickX <= button_back.gui.x + button_back.gui.width &&
                clickY >= button_back.gui.y &&
                clickY <= button_back.gui.y + button_back.gui.height
            ) {
                soundeffect("./game/music/button.mp3");
                push = button_name;
                saferemove(button_name);
                saferemove(button_name + "_back");
                saferemove(button_name + "_back_line");
                document.removeEventListener('click', clickhandler);
                document.removeEventListener('touchstart', touchhandler);
            }
        }
        function touchhandler(event) {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                const stage = document.getElementById('stage');
                const rect = stage.getBoundingClientRect();
                const scaleX = 1200 / rect.width;
                const scaleY = 700 / rect.height;
                const touchX = (touch.clientX - rect.left) * scaleX;
                const touchY = (touch.clientY - rect.top) * scaleY;
                if (
                    touchX >= button_back.gui.x &&
                    touchX <= button_back.gui.x + button_back.gui.width &&
                    touchY >= button_back.gui.y &&
                    touchY <= button_back.gui.y + button_back.gui.height
                ) {
                    event.preventDefault();
                    soundeffect("./game/music/button.mp3");
                    push = button_name;
                    saferemove(button_name);
                    saferemove(button_name + "_back");
                    saferemove(button_name + "_back_line");
                    document.removeEventListener('click', clickhandler);
                    document.removeEventListener('touchstart', touchhandler);
                }
            }
        }
        document.addEventListener('click', clickhandler);
        document.addEventListener('touchstart', touchhandler, { passive: false });
    }

    async function waitforspecifickey(targetKey) {
        return new Promise(resolve => {
            function handler(event) {
                if (event.key == targetKey) {
                    window.removeEventListener("keydown", handler);
                    resolve(event.key);
                }
            }
            window.addEventListener("keydown", handler);
        });
    }

    function waituntildeleted(elementId) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                const elem = document.getElementById(elementId);
                if (!elem) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
    function waituntildeletedAll(...ids) {
        return new Promise(resolve => {
            const observer = new MutationObserver(() => {
                for (const id of ids) {
                    if (!document.getElementById(id)) {
                        observer.disconnect();
                        resolve();
                        return;
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    function getrandomint(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function view_text(textContent, textX, textY) {
        const text = new Creation("texta", "gui", {
            zIndex: 3,
            typeValue: [20, textContent],
            conditions: [null, null, null, null],
            speed: 0,
            x: textX,
            y: textY - 20,
            width: 80,
            height: 80,
        }, "text");
        text.gui.typeValue = [20, textContent];
        text.canvas();
    }
    function textd() {
        saferemove("texta");
    }
    function view_textbox(textContent, textX, textY) {
        const text = new Creation("text", "gui", {
            zIndex: 3,
            typeValue: [20, textContent],
            conditions: [null, null, null, null],
            speed: 0,
            x: textX,
            y: textY + 25,
            width: 80,
            height: 80,
        }, "text");
        const textBox_line = new Creation("textBox_line", "gui", {
            zIndex: 1 + 0,
            typeValue: "#000000",
            conditions: [null, null, null, null],
            speed: 0,
            x: textX - 5,
            y: textY - 5,
            width: 610,
            height: 210,
        }, "colorfill");
        const textBox = new Creation("textBox", "gui", {
            zIndex: 2,
            typeValue: "#ffffff",
            conditions: [null, null, null, null],
            speed: 0,
            x: textX,
            y: textY,
            width: 600,
            height: 200,
        }, "colorfill");
        text.gui.typeValue = [30, textContent];
        textBox_line.canvas();
        text.canvas();
        textBox.canvas();
        return text;
    }
    function textbox_delete() {
        saferemove("text");
        saferemove("textBox");
        saferemove("textBox_line");
    }


    function renderenemytodataurl(enemyIndex, color = "rgba(255,0,0,1)", scale = 10, iskcalb = false) {
        if (!systems || !systems.enemy || !systems.enemy[enemyIndex]) {
            console.warn("Enemy data not found for index:", enemyIndex);
            return null;
        }

        let data = systems.enemy[enemyIndex];
        const height = data.length;
        const width = data[0].length;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = false;


        const drawPixelData = (source, useColor) => {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const val = source[y][x];
                    if (typeof val === "string" && val.startsWith("rgba(")) {
                        if (val !== "rgba(0,0,0,0)") {
                            ctx.fillStyle = val;
                            ctx.fillRect(x * scale, y * scale, scale, scale);
                        }
                    } else if (useColor && val === "1") {
                        ctx.fillStyle = color;
                        ctx.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
            }
        };

        if (iskcalb) {
            drawPixelData(systems.enemy[5], false);
        } else {
            const hasRGBA = data.some(row => row.some(v => typeof v === "string" && v.startsWith("rgba(")));
            drawPixelData(data, !hasRGBA);
        }
        return canvas.toDataURL();
    }

    async function visualnoveldialogue(lines, bgContext = null) {
        let normalizedLines = [];
        const rawList = Array.isArray(lines) ? lines : [lines];

        for (const l of rawList) {
            const item = (typeof l === 'string') ? { text: l, speaker: "right", name: "" } : l;

            if (item.text && item.text.length > 28 * 3) {
                let remaining = item.text;
                let isFirst = true;

                while (remaining.length > 0) {
                    const cutLength = 28 * 3;
                    const chunk = remaining.substring(0, cutLength);
                    const newItem = { ...item, text: chunk };

                    // Only run action on the first chunk so it doesn't repeat
                    if (!isFirst && newItem.action) {
                        delete newItem.action;
                    }

                    normalizedLines.push(newItem);
                    remaining = remaining.substring(cutLength);
                    isFirst = false;
                }
            } else {
                normalizedLines.push(item);
            }
        }
        lines = normalizedLines;

        // --- Cinematic Setup ---
        const dialogueLayer = document.createElement('div');
        dialogueLayer.id = "vn-layer";
        dialogueLayer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2000;
            background: #000; display: flex; align-items: center; justify-content: center;
        `;
        document.body.appendChild(dialogueLayer);

        const cinemaContainer = document.createElement('div');
        cinemaContainer.style.cssText = `
            position: relative; width: 100%; max-width: 177.78vh; height: 56.25vw; max-height: 100%;
            overflow: hidden; background: #000; box-shadow: 0 0 50px rgba(0,0,0,0.8);
        `;
        dialogueLayer.appendChild(cinemaContainer);

        const bgLayer = document.createElement('div');
        bgLayer.style.cssText = `position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 1; transition: opacity 0.5s;`;
        cinemaContainer.appendChild(bgLayer);

        // Cyber Grid Canvas
        const gridCanvas = document.createElement('canvas');
        gridCanvas.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none;";
        cinemaContainer.appendChild(gridCanvas);

        // Char Layer
        const charLayer = document.createElement('div');
        charLayer.style.cssText = "position: absolute; inset: 0; z-index: 5; pointer-events: none;";
        cinemaContainer.appendChild(charLayer);

        const leftChar = document.createElement('img');
        leftChar.className = "vn-char left dim";
        leftChar.src = "./game/player/player.png";
        charLayer.appendChild(leftChar);

        const rightChar = document.createElement('img');
        rightChar.className = "vn-char right dim";
        charLayer.appendChild(rightChar);

        // Post-Process
        const overlayFX = document.createElement('div');
        overlayFX.style.cssText = `
            position: absolute; inset: 0; z-index: 20; pointer-events: none;
            background: 
                linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
            box-shadow: inset 0 0 100px rgba(0,0,0,0.9);
        `;
        cinemaContainer.appendChild(overlayFX);

        // Dialogue Box
        const dlBox = document.createElement('div');
        dlBox.className = "vn-box";
        cinemaContainer.appendChild(dlBox);

        const nameEl = document.createElement('div'); nameEl.className = "vn-name";
        dlBox.appendChild(nameEl);
        const textEl = document.createElement('div'); textEl.className = "vn-text";
        dlBox.appendChild(textEl);
        const nextArrow = document.createElement('div'); nextArrow.className = "vn-next";
        dlBox.appendChild(nextArrow);

        // Style
        const style = document.createElement('style');
        style.textContent = `
            .vn-box {
                position: absolute; bottom: 5%; left: 50%; transform: translateX(-50%);
                width: 90%; height: 25%;
                background: rgba(10, 16, 26, 0.9);
                border: 2px solid #4deeea;
                padding: 20px 40px;
                font-family: 'DotJP', sans-serif;
                color: #e0f7fa;
                z-index: 10;
                display: flex; flex-direction: column;
                box-shadow: 0 0 20px rgba(77, 238, 234, 0.2);
            }
            .vn-name {
                font-size: clamp(14px, 3.5vw, 32px); font-weight: bold; color: #4deeea; margin-bottom: 10px;
                text-shadow: 0 0 10px rgba(77, 238, 234, 0.8);
            }
            .vn-text {
                font-size: clamp(12px, 3vw, 24px); line-height: 1.6; text-shadow: 0 1px 2px #000;
            }
            .vn-next {
                position: absolute; bottom: 15px; right: 20px;
                width: 15px; height: 15px; border-right: 3px solid #4deeea; border-bottom: 3px solid #4deeea;
                transform: rotate(45deg); animation: bounce 1s infinite; display: none;
            }
            @keyframes bounce { 0%, 100% { transform: rotate(45deg) translate(0,0); } 50% { transform: rotate(45deg) translate(-5px,-5px); } }
            
            .vn-char {
                position: absolute; bottom: 0; height: 90%; transition: all 0.3s;
                image-rendering: pixelated; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
            }
            .vn-char.left { left: 10%; transform: translateX(-20%); }
            .vn-char.right { right: 10%; transform: translateX(20%); }
            .vn-char.active { filter: brightness(1.2) drop-shadow(0 0 15px rgba(77,238,234,0.4)); transform: scale(1.05); z-index: 2; }
            .vn-char.dim { filter: brightness(0.5) grayscale(0.5); z-index: 1; }
        `;
        document.head.appendChild(style);

        // --- Grid Animation ---
        const ctx = gridCanvas.getContext('2d');
        let width, height;
        const resize = () => {
            width = gridCanvas.width = cinemaContainer.clientWidth;
            height = gridCanvas.height = cinemaContainer.clientHeight;
        };
        const resizer = new ResizeObserver(resize);
        resizer.observe(cinemaContainer);

        let time = 0;
        let particles = Array.from({ length: 80 }, () => ({
            x: Math.random(), y: Math.random(), z: Math.random() * 2 + 0.1
        }));

        let animationFrame; // Renamed from animId to be clear
        function animate() {
            if (!dialogueLayer.isConnected) return;
            time += 0.01;
            ctx.clearRect(0, 0, width, height);

            // Cyber Grid
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(77, 238, 234, ${0.1 + Math.sin(time) * 0.05})`;
            const horizon = height * 0.6;
            const fov = 300;

            ctx.beginPath();
            for (let x = -width; x < width * 2; x += 40) {
                const x1 = (x - width / 2) * (fov / 100) + width / 2;
                ctx.moveTo(width / 2, horizon);
                ctx.lineTo(x, height);
            }
            for (let z = 0; z < 10; z++) {
                const p = (z + (time * 2) % 1) / 10;
                const y = horizon + (height - horizon) * p;
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();

            // Particles
            ctx.fillStyle = '#4deeea';
            particles.forEach(p => {
                p.y += 0.002 * p.z;
                if (p.y > 1) p.y = 0;
                const sx = p.x * width;
                const sy = p.y * height;
                const size = p.z * 1.5;
                const alpha = Math.sin(p.z + time * 2) * 0.5 + 0.5;
                ctx.globalAlpha = alpha;
                ctx.fillRect(sx, sy, size, size);
            });
            ctx.globalAlpha = 1;
            animationFrame = requestAnimationFrame(animate);
        }
        animate();

        // --- Logic ---
        const playerSprites = {
            "neutral": "./game/player/player.png",
            "smile": "./game/player/player_Smile.png",
            "angry": "./game/player/player_Perplexity.png",
            "sad": "./game/player/player_Meaningless.png",
            "sit": "./game/player/player_sitdown.png",
        };

        let resolveStep = null;
        let isTyping = false;
        let skipTyping = false;

        const clickHandler = () => {
            if (isTyping) skipTyping = true;
            else if (resolveStep) resolveStep();
        };
        const keyHandler = (e) => {
            if (e.key === "Enter" || e.code === "Space") clickHandler();
        };

        const inputOverlay = document.createElement('div');
        inputOverlay.style.cssText = "position:absolute; inset:0; z-index:3000; cursor:pointer;";
        inputOverlay.onclick = clickHandler;
        inputOverlay.addEventListener('touchend', (e) => { e.preventDefault(); clickHandler(); }, { passive: false });
        dialogueLayer.appendChild(inputOverlay);

        window.addEventListener("keydown", keyHandler);

        // Sound Reuse
        const typeSound = new Audio("./game/music/system_view.mp3");
        typeSound.volume = 0.4;

        for (const line of lines) {
            // BG Image
            if (line.img) {
                bgLayer.style.backgroundImage = `url('${line.img}')`;
            }

            // Actions
            if (line.action && typeof line.action === 'function') {
                await line.action();
                if (!line.text) continue;
            }

            // Characters
            if (line.chara === false) {
                leftChar.style.display = 'none';
                rightChar.style.display = 'none';
            } else {
                leftChar.style.display = 'block';
                // Speaker Logic
                if (line.speaker === "left") {
                    leftChar.className = "vn-char left active";
                    rightChar.className = "vn-char right dim";
                    if (line.emotion && playerSprites[line.emotion]) leftChar.src = playerSprites[line.emotion];
                } else if (line.speaker === "right") {
                    rightChar.className = "vn-char right active";
                    leftChar.className = "vn-char left dim";
                    rightChar.style.display = 'block';

                    if (line.rightChar) rightChar.src = line.rightChar;
                    else if (line.image) rightChar.src = line.image;
                    else if (line.name === "神" || line.name === "神…?") rightChar.src = "./game/god.png";
                    else if (line.name === "Error") rightChar.src = "./game/god_error.png";
                    else {
                        // Original Logic Restore
                        if (!rightChar.src || rightChar.src === "" || rightChar.src.endsWith(".html") || rightChar.src.includes("player")) {
                            if (bgContext && typeof bgContext.Stagenumber !== 'undefined') {
                                const num = bgContext.Stagenumber;
                                let enemyIndex = num;
                                let enemyColor = "rgba(255,0,0,1)";
                                if (num === 0) { enemyIndex = 0; enemyColor = "rgba(255,0,0,1)"; }
                                else if (num === 1) { enemyIndex = 1; enemyColor = "rgba(0,255,0,1)"; }
                                else if (num === 2) { enemyIndex = 2; enemyColor = "rgba(0,0,255,1)"; }
                                else if (num === 3) {
                                    enemyIndex = 3; enemyColor = "rgba(50,50,50,1)";
                                    if (bgContext.Stagelevel === 7) enemyIndex = 5;
                                }
                                let enemyDataURL = (enemyIndex !== 5)
                                    ? renderenemytodataurl(enemyIndex, enemyColor, 15)
                                    : renderenemytodataurl(5, enemyColor, 15, true);
                                if (enemyDataURL) rightChar.src = enemyDataURL;
                            }
                        }
                    }
                } else {
                    leftChar.className = "vn-char left dim";
                    rightChar.className = "vn-char right dim";
                }
            }

            nameEl.textContent = line.name || " ";
            textEl.textContent = "";
            nextArrow.style.display = 'none';
            isTyping = true;
            skipTyping = false;

            const txt = line.text;
            for (let i = 0; i < txt.length; i++) {
                if (skipTyping) {
                    textEl.textContent = txt;
                    break;
                }
                textEl.textContent += txt[i];
                if (i % 3 === 0) {
                    typeSound.currentTime = 0;
                    typeSound.play().catch(() => { });
                }
                await new Promise(r => setTimeout(r, 20));
            }
            isTyping = false;
            nextArrow.style.display = 'block';
            await new Promise(r => resolveStep = r);
            resolveStep = null;
        }

        cancelAnimationFrame(animationFrame);
        resizer.disconnect();
        window.removeEventListener("keydown", keyHandler);
        dialogueLayer.remove();
        style.remove();
    }

    async function inputtext(name, i_x, i_y, i_width, i_height, fontSize, maxLength) {
        return new Promise((resolve) => {
            // Create overlay with luxurious visual novel style
            const overlay = document.createElement('div');
            overlay.id = name + '_overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; 
                background: rgba(0, 0, 0, 0.85);
                z-index: 20000;
                display: flex; align-items: center; justify-content: center;
                animation: fadeIn 0.3s ease-out;
            `;

            // Input container with sci-fi style
            const container = document.createElement('div');
            container.style.cssText = `
                position: relative;
                background: linear-gradient(135deg, rgba(10, 16, 26, 0.95), rgba(20, 30, 48, 0.95));
                border: 2px solid #4deeea;
                padding: 40px;
                min-width: 400px;
                max-width: 90%;
                box-shadow: 0 0 30px rgba(77, 238, 234, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.8);
                clip-path: polygon(
                    30px 0, 100% 0,
                    100% calc(100% - 30px), calc(100% - 30px) 100%,
                    0 100%, 0 30px
                );
                animation: slideIn 0.4s ease-out;
            `;

            // Inner border effect with scanning animation
            const innerBorder = document.createElement('div');
            innerBorder.style.cssText = `
                position: absolute;
                top: 8px; left: 8px; right: 8px; bottom: 8px;
                border: 1px solid rgba(77, 238, 234, 0.3);
                clip-path: polygon(
                    25px 0, 100% 0,
                    100% calc(100% - 25px), calc(100% - 25px) 100%,
                    0 100%, 0 25px
                );
                pointer-events: none;
                overflow: hidden;
            `;

            const scanLine = document.createElement('div');
            scanLine.style.cssText = `
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(to bottom, transparent, rgba(77, 238, 234, 0.2), transparent);
                animation: scan 3s linear infinite;
            `;
            innerBorder.appendChild(scanLine);
            container.appendChild(innerBorder);

            // Title
            const title = document.createElement('div');
            title.textContent = 'INPUT';
            title.style.cssText = `
                font-family: 'DotJP', monospace;
                font-size: clamp(20px, 3vw, 28px);
                color: #4deeea;
                text-shadow: 0 0 10px rgba(77, 238, 234, 0.7);
                margin-bottom: 20px;
                border-bottom: 2px solid rgba(77, 238, 234, 0.3);
                padding-bottom: 10px;
            `;
            container.appendChild(title);

            // Input wrapper with glow effect
            const inputWrapper = document.createElement('div');
            inputWrapper.style.cssText = `
                position: relative;
                margin: 20px 0;
            `;

            // Actual input field (visible for mobile keyboard)
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.maxLength = maxLength;
            inputField.style.cssText = `
                width: 100%;
                background: rgba(77, 238, 234, 0.05);
                border: 2px solid rgba(77, 238, 234, 0.4);
                border-radius: 4px;
                padding: 15px 20px;
                font-family: 'DotJP', monospace;
                font-size: clamp(18px, 2.5vw, ${fontSize}px);
                color: #e0f7fa;
                outline: none;
                transition: all 0.3s ease;
                box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
            `;

            // Focus glow effect
            inputField.addEventListener('focus', () => {
                inputField.style.borderColor = '#4deeea';
                inputField.style.boxShadow = 'inset 0 0 20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(77, 238, 234, 0.5)';
            });
            inputField.addEventListener('blur', () => {
                inputField.style.borderColor = 'rgba(77, 238, 234, 0.4)';
                inputField.style.boxShadow = 'inset 0 0 20px rgba(0, 0, 0, 0.5)';
            });

            inputWrapper.appendChild(inputField);
            container.appendChild(inputWrapper);

            // Character counter
            const counter = document.createElement('div');
            counter.style.cssText = `
                font-family: 'DotJP', monospace;
                font-size: clamp(12px, 1.5vw, 14px);
                color: rgba(77, 238, 234, 0.6);
                text-align: right;
                margin-top: 8px;
            `;
            counter.textContent = `${inputField.value.length} / ${maxLength}`;
            container.appendChild(counter);

            // Confirm button
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'CONFIRM';
            confirmBtn.style.cssText = `
                width: 100%;
                margin-top: 20px;
                padding: 15px;
                background: linear-gradient(135deg, rgba(77, 238, 234, 0.2), rgba(77, 238, 234, 0.1));
                border: 2px solid #4deeea;
                color: #4deeea;
                font-family: 'DotJP', monospace;
                font-size: clamp(16px, 2vw, 20px);
                cursor: pointer;
                transition: all 0.3s ease;
                text-shadow: 0 0 10px rgba(77, 238, 234, 0.5);
                clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
            `;

            confirmBtn.addEventListener('mouseenter', () => {
                confirmBtn.style.background = '#4deeea';
                confirmBtn.style.color = '#000';
                confirmBtn.style.transform = 'scale(1.02)';
                confirmBtn.style.boxShadow = '0 0 20px rgba(77, 238, 234, 0.6)';
            });
            confirmBtn.addEventListener('mouseleave', () => {
                confirmBtn.style.background = 'linear-gradient(135deg, rgba(77, 238, 234, 0.2), rgba(77, 238, 234, 0.1));';
                confirmBtn.style.color = '#4deeea';
                confirmBtn.style.transform = 'scale(1)';
                confirmBtn.style.boxShadow = 'none';
            });

            container.appendChild(confirmBtn);
            overlay.appendChild(container);

            // Add animations
            const styleSheet = document.createElement('style');
            styleSheet.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
            `;
            document.head.appendChild(styleSheet);

            // Event handlers
            const updateCounter = () => {
                counter.textContent = `${inputField.value.length} / ${maxLength}`;
            };

            const submit = () => {
                const result = inputField.value;
                soundeffect("./game/music/button.mp3");
                overlay.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    overlay.remove();
                    styleSheet.remove();
                    resolve(result);
                }, 300);
            };

            inputField.addEventListener('input', updateCounter);
            inputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.isComposing) {
                    e.preventDefault();
                    submit();
                }
            });
            confirmBtn.addEventListener('click', submit);

            // Add to DOM and focus
            document.body.appendChild(overlay);

            // Small delay before focusing to ensure mobile keyboard appears
            setTimeout(() => {
                inputField.focus();
            }, 100);

            // Add fade out animation
            styleSheet.textContent += `
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
        });
    }

    async function otext(textContent, viewtime, textX, textY) {
        const text = new Creation("text", "gui", {
            zIndex: 2,
            typeValue: [20, textContent],
            conditions: [null, null, null, null],
            speed: 0,
            x: textX,
            y: textY - 20,
            width: 80,
            height: 80,
        }, "text");
        const textBox_line = new Creation("textBox_line", "gui", {
            zIndex: 0,
            typeValue: "#000000",
            conditions: [null, null, null, null],
            speed: 0,
            x: textX - 5,
            y: textY - 5,
            width: 610,
            height: 210,
        }, "colorfill");
        const textBox = new Creation("textBox", "gui", {
            zIndex: 1,
            typeValue: "#ffffff",
            conditions: [null, null, null, null],
            speed: 0,
            x: textX,
            y: textY,
            width: 600,
            height: 200,
        }, "colorfill");
        text.gui.typeValue = [20, textContent];
        textBox_line.canvas();
        text.canvas();
        textBox.canvas();
        await sleep(viewtime);
        saferemove("text");
        saferemove("textBox");
        saferemove("textBox_line");
    }
    function waituntildeletedAll(...ids) {
        return new Promise(resolve => {
            const observer = new MutationObserver(() => {
                for (const id of ids) {
                    if (!document.getElementById(id)) {
                        observer.disconnect();
                        resolve();
                        return;
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
    function screenshake(amplitude) {
        const stage = document.getElementById("stage");
        stage.animate([
            { translate: "0px 0px" },
            { translate: "-" + amplitude + "px 0px" },
            { translate: "" + amplitude * 2 + "px 0px" },
            { translate: "0px -" + amplitude + "px" },
            { translate: "-" + amplitude + "px 0px" },
            { translate: "0px " + amplitude * 2 + "px" },
            { translate: "0px -" + amplitude + "px" },
            { translate: "0px 0px" }
        ], {
            duration: 500,
            iterations: 1
        });
    }
    async function entertext(content) {
        await visualnoveldialogue([content]);
    }
    const beams = [];
    function beam(x, y, vx, vy, color, tate, boss = false, life = 400, angle = 0, isAngleDirection = false) {
        if (window.battleActive) {
            soundeffect("./game/music/charge.mp3")
            const b = {
                gui: {
                    typeValue: color,
                    zIndex: 2,
                    x: x,
                    y: y,
                    width: 0,
                    height: 0,
                    maxWidth: 1250,
                    maxHeight: 700
                },
                x: x,
                y: y,
                color: color,
                prelife: life,
                life: life / 4,
                vx: 0,
                vy: 0,
                boss: boss,
                angle: angle,
                isAngleDirection: isAngleDirection,
                isPreLine: false,
                lifec: life / 4,
                delete: function () { },
                remove: function () { }
            };

            if (tate) {
                b.gui.width = 2000;
                b.gui.height = 50;
                b.width = 2000;
                b.height = 50;
            } else {
                b.gui.width = 50;
                b.gui.height = 2000;
                b.width = 50;
                b.height = 2000;
            }
            b.x = x;
            b.y = y;
            b.color = color;
            b.prelife = life;
            b.life = life / 4;
            b.gui.x = x;
            b.gui.y = y;
            if (isAngleDirection) {
                const rad = angle * Math.PI / 180;
                const speed = Math.sqrt(vx * vx + vy * vy) || 10;
                b.vx = Math.cos(rad) * speed;
                b.vy = Math.sin(rad) * speed;
                b.gui.x = x - b.gui.width / 2;
                b.gui.y = y - b.gui.height / 2;
                b.gui.x += -100 * b.vx;
                b.gui.y += -100 * b.vy;
                b.x = b.gui.x;
                b.y = b.gui.y;
                b.isPreLine = true;
            } else {
                b.vx = vx;
                b.vy = vy;
                b.isPreLine = true;
            }
            b.boss = boss;
            b.angle = angle;
            b.isAngleDirection = isAngleDirection;
            beams.push(b);
            b.lifec = b.life;
        }
    }
    function soundeffect(path) {
        if (!savedata.config) savedata.config = { bgm: 100, se: 100 };
        try {
            const audio = new Audio(path);
            audio.volume = savedata.config.se / 100;
            audio.play().catch(e => {
                console.warn("Sound play failed:", e);
            });
        } catch (e) {
            console.warn("Audio initialization failed:", e);
        }
    }
    function createFlash(duration = 10, color = "rgba(255, 255, 255, 0.8)") {
        if (window.battleParticles) {
            window.battleParticles.push({
                type: 'flash',
                life: duration,
                maxLife: duration,
                color: color,
                zIndex: 10000
            });
        }
    }
    const battleEvents = {
        "0-1": {
            pre: [{ text: "Red1「誰だ、お前…？ディア―様の命令でクリスタル族以外は通すなって…！」", image: "./game/boss_red.png" }],
            post: [
                "Red1「ぐっ…くそっ…まだ給料日来てないのに…！」",
                { text: "「金か…金のために戦ってるのか？」", emotion: "surprised" },
                "Red1「当たり前だろ！家のローンがあと30年残ってるんだ！\"転生\"したら審査が通らなくなる…！」",
                { text: "「(世知辛い……「宇宙なのにこの世界家とかあるんだ」と思ったが置いておこう)」", emotion: "neutral" }
            ]
        },
        "0-2": {
            pre: ["Red2「お前がRed1を倒したという輩か…だが俺は違うぞ！昨日プロテイン飲んだからな！」"],
            post: [
                "Red2「筋肉が…裏切った…ぁ…」",
                { text: "「なんでそんなに筋肉にこだわってるんだ…？」", emotion: "neutral" },
                "Red2「筋肉は…裏切らないからだ…。だが…データ削除ですべての筋肉（マッスル）がロストする…」",
                "Red2「3年前に彼女に振られた時も、投資で失敗した時も…ダンベルだけは俺の傍にいてくれた…俺のダンベル…」",
                { text: "「(重いな…ダンベルだけに)」", emotion: "neutral" }
            ]
        },
        "0-3": {
            pre: ["Red3「Red3、参上！…って言ってみたかっただけだ！」"],
            post: ["Red3「レッド…戦隊ものへの道は遠い…」", { text: "「一人で戦隊ものは無理と思うけど…」", emotion: "neutral" }, "Red3「うるさい！俺の中には俺5人分の魂が燃えているんだ！」", { text: "「(矛盾…)」", emotion: "surprised" }]
        },
        "0-4": {
            pre: ["Red4「俺の情熱は1000度だ！触ると火傷するぜ！」"],
            post: ["Red4「燃え尽きた…真っ白にな…」", { text: "「体積が1/20になったか…」", emotion: "surprised" }, "Red4「えっホントに?」"]
        },
        "0-5": {
            pre: ["Red5「５番目だからって手抜いてると思うなよ！」"],
            post: ["Red5「やっぱ５番目は影が薄いのか…」", { text: "「誰もそんなこと言ってないと思うけど…」", emotion: "neutral" }, "Red5「いいや！どうせ俺なんて『その他大勢A』なんだ！名前すらないんだ！」", { text: "「その他大勢Bよりはマシじゃないか…(?)」", emotion: "neutral" }]
        },
        "0-6": {
            pre: ["Red6「Red隊2番手の俺に挑むとは…覚悟はできてるか？」"],
            post: [
                "Red6「うっ…覚悟が足りなかったのは…俺の方か…」",
                { text: "「Red隊のNo.2か…」", emotion: "neutral" },
                "Red6「フッ…慰めはよせ。所詮俺はNo.2…永遠の二番手さ。リーダーの座は遠い…」",
                { text: "「(中間管理職の悲哀を感じる…)」", emotion: "sad" }
            ]
        },


    };

    async function processbattleevent(key, type, bgContext = null) {
        if (battleEvents[key] && battleEvents[key][type]) {
            await visualnoveldialogue(battleEvents[key][type], bgContext);
        }
    }

    async function showgameoverscreen(isScriptedGodEvent = false) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 3000;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'DotJP', sans-serif; color: #ff0000;
            `;
            document.body.appendChild(overlay);

            const title = document.createElement('h1');
            title.textContent = "GAME OVER";
            title.style.cssText = 'font-size: 100px; text-shadow: 5px 5px #000; opacity: 0; transition: opacity 2s;';
            overlay.appendChild(title);
            requestAnimationFrame(() => title.style.opacity = 1);

            const optionsContainer = document.createElement('div');
            optionsContainer.style.cssText = 'display: flex; gap: 30px; margin-top: 50px; opacity: 0; transition: opacity 2s 1s;';
            overlay.appendChild(optionsContainer);
            requestAnimationFrame(() => optionsContainer.style.opacity = 1);

            let continueBtn;

            function createOption(text, value, id) {
                const btn = document.createElement('div');
                btn.textContent = text;
                if (id) btn.id = id;
                btn.style.cssText = `
                    font-size: 32px; color: #fff; border: 3px solid #fff; padding: 15px 30px;
                    cursor: pointer; transition: all 0.2s; position: relative;
                `;
                btn.onmouseenter = () => {
                    btn.style.background = '#fff';
                    btn.style.color = '#000';
                };
                btn.onmouseleave = () => {
                    btn.style.background = 'transparent';
                    btn.style.color = '#fff';
                };
                btn.onclick = async (e) => {
                    overlay.remove();
                    resolve(value);
                };
                optionsContainer.appendChild(btn);
                return btn;
            }

            continueBtn = createOption("Continue", "continue", "btn_continue");
            createOption("Back to Map", "backstageselect");
            createOption("Back to Mode Select", "backtitle");
        });
    }

    async function battle(bullet_hell, Stagenumber, StageLevel = 1, lastboss = false, scriptedLoss = false, preMovie = null, postMovie = null) {
        const isBoss = (StageLevel == 7) || lastboss;
        const bgContext = { isBoss, lastboss, Stagenumber, Stagelevel: StageLevel };
        danmakuEngine.init();

        if (preMovie) {
            const lines = getmoviedata(preMovie, savedata.name);
            if (lines && lines.length > 0) await visualnoveldialogue(lines, bgContext);
        }
        console.log("bullet_hell:", bullet_hell, "Stagenumber:", Stagenumber, "StageLevel:", StageLevel, "lastboss:", lastboss, "scriptedLoss:", scriptedLoss, "preMovie:", preMovie, "postMovie:", postMovie)

        return await new Promise(async (resolve) => {
            window.battleActive = true;
            window.windForce = 0;
            let musicPath = isBoss ? './game/music/BossBattle.wav' : './game/music/EnemyBattle.mp3';
            const battleAudio = new Audio(musicPath);
            if (!savedata.config) savedata.config = { bgm: 100, se: 100 };
            battleAudio.volume = savedata.config.bgm / 100;
            battleAudio.loop = true;
            battleAudio.play().catch(e => console.warn("BGM Play failed:", e));

            function stopBattleMusic() {
                battleAudio.pause();
                battleAudio.currentTime = 0;
            }

            if (isBoss && !lastboss) {
                colorbackground(Stagenumber == 3 ? "#ffffff" : "#000000");
                systems.stars(Stagenumber == 3 ? "0,0,0" : "255,255,255");
                systems.drawCrescent(Stagenumber == 0 ? 255 : 0, Stagenumber == 1 ? 255 : 0, Stagenumber == 2 ? 255 : 0);
            } else if (lastboss) {
                colorbackground("#000000");
                systems.stars("255,255,255");
                systems.drawCrescent(255, 255, 255);
            } else {
                colorbackground(Stagenumber == 3 ? "#ffffff" : "#000000");
                systems.stars(Stagenumber == 3 ? "0,0,0" : "255,255,255");
                systems.drawCrescent(Stagenumber == 0 ? 255 : 0, Stagenumber == 1 ? 255 : 0, Stagenumber == 2 ? 255 : 0);
            }

            let finish = false;
            let PlayerHP = 3;
            let BossHP = (StageLevel == 7) ? 3 : 1;
            let BossPhase = 1;
            let time = 1500;
            let isshoot = false;
            let ishit = [false, 0];
            let Player_ishit = [false, 0];
            let finishcharge = 0;

            const challenge = window.challengeFlags || {};
            if (challenge.owata) {
                PlayerHP = 1;
            }
            if (challenge.enemy_boost) {
            }
            const radi = Creation.create("radi", "gui", { typeValue: { dot: "10px", data: [], zIndex: 2, } }, "newcreate");
            const arrow = Creation.create("arrow", "gui", {
                width: 32 * 5, height: 32 * 5,
                typeValue: {
                    dot: "10px",
                },
            }, "newcreate");
            const PlayerHPBer = Creation.create("PlayerHPBer", "gui", {
                x: 900, y: 500,
                typeValue: "#00ff00",
                height: 45,
                zIndex: 2,
            }, "colorfill");
            const PlayerHPBerBack = Creation.create("PlayerHPBerBack", "gui", {
                x: 900, y: 500,
                typeValue: "#ff0000",
                height: 45,
                zIndex: 1,
            }, "colorfill");

            const player = Creation.create("player", "gui", {
                typeValue: { dot: "2.5px", data: systems.you(true) },
                zIndex: 2,
            }, "newcreate");
            player.gui.x = 550;
            player.gui.y = 250;
            const GraphinyGauge = Creation.create("GraphinyGauge", "gui", {
                x: 0, y: 500,
                typeValue: "#00ffff",
                height: 45,
                zIndex: 2,
            }, "colorfill");
            const GraphinyGaugeBack = Creation.create("GraphinyGaugeBack", "gui", {
                x: 0, y: 500,
                typeValue: "#00ffaf",
                height: 45,
                zIndex: 1,
            }, "colorfill");
            const effect = Creation.create("Effect2", "gui", {
                typeValue: {
                    dot: "40px",
                    data: systems.arrow.finish.map(r => r.map(c => c === "1" ? savedata.maincolor : "rgba(0,0,0,0)")),
                },
                width: 640,
                height: 640,
                x: 600 - 320,
                y: 700 - 320,
            }, "newcreate");

            console.log(bullet_hell)
            let enemy;
            if (lastboss) {
            } else if (isBoss && Stagenumber == 3) {
                enemy = Creation.create("enemy", "gui", {
                    typeValue: { dot: "5px", data: systems.enemy[5] },
                    zIndex: 2,
                }, "newcreate");
                enemy.gui.width = 50;
                enemy.gui.height = 50;
                enemy.gui.x = 600 - 40;
                enemy.gui.y = 100;
            } else if (isBoss) {

                if (Stagenumber === 3) {
                    enemy = Creation.create("enemy", "gui", {
                        typeValue: {
                            dot: "5px",
                            data: systems.enemy[5]
                        },
                        zIndex: 2,
                    }, "newcreate");
                } else {
                    const bossColors = [
                        "rgba(255, 0, 0, 1)",
                        "rgba(0, 255, 0, 1)",
                        "rgba(0, 0, 255, 1)",
                    ];
                    const myColor = bossColors[Stagenumber];

                    enemy = Creation.create("enemy", "gui", {
                        typeValue: {
                            dot: "5px",
                            data: systems.enemy[Stagenumber].map(r => r.map(c => c === "1" ? myColor : "rgba(0,0,0,0)"))
                        },
                        zIndex: 2,
                    }, "newcreate");
                }
                enemy.gui.width = 50;
                enemy.gui.height = 50;
                enemy.gui.x = 600 - 40;
                enemy.gui.y = 100;
            } else {
                enemy = Creation.create("enemy", "gui", {
                    typeValue: { dot: "5px", data: systems.enemy[Stagenumber].map(r => r.map(c => c === "1" ? `rgba(${Stagenumber == 0 ? 255 : 0}, ${Stagenumber == 1 ? 255 : 0}, ${Stagenumber == 2 ? 255 : 0}, 1)` : "rgba(0,0,0,0)")), dot: "5px" },
                    zIndex: 2,
                }, "newcreate");
                enemy.gui.width = 50;
                enemy.gui.height = 50;
                enemy.gui.x = 600 - 40;
                enemy.gui.y = 100;
            }


            const particles = [];
            window.battleParticles = particles;

            const particleLayer = Creation.create("particleLayer", "gui", {
                typeValue: "rgba(0,0,0,0)",
                width: 1200,
                height: 700,
                zIndex: 10,
                x: 0,
                y: 0,
            }, "colorfill");


            particleLayer.canvas = function () {
                const cre = document.getElementById(this.name);
                if (!cre) return;
                const ctx = cre.getContext('2d');
                ctx.clearRect(0, 0, this.gui.maxWidth, this.gui.maxHeight);




                for (const p of particles) {
                    if (p.type === 'flash') {
                        ctx.save();
                        ctx.globalCompositeOperation = 'lighter';
                        const alpha = Math.pow(p.life / p.maxLife, 2);
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = p.color;
                        ctx.fillRect(0, 0, 1200, 700);
                        ctx.restore();
                        continue;
                    }

                    ctx.fillStyle = p.color;
                    if (p.type === 'ring') {

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        if (p.expand) {
                            p.size += 2;
                            ctx.globalAlpha = Math.max(0, p.life / 20);
                            ctx.stroke();
                            ctx.globalAlpha = 1.0;
                        }
                    } else if (p.type === 'diamond') {
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(45 * Math.PI / 180);
                        ctx.globalAlpha = Math.min(1, p.life / 20);
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                        ctx.restore();
                    } else if (p.type === 'expanding_diamond') {
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.rotation * Math.PI / 180);


                        ctx.shadowBlur = 30;
                        ctx.shadowColor = p.color;
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 20;
                        ctx.globalCompositeOperation = 'lighter';

                        ctx.globalAlpha = Math.min(1, p.life / 20);

                        const w = p.size * 0.6;
                        const h = p.size;
                        ctx.beginPath();
                        ctx.moveTo(0, -h / 2);
                        ctx.lineTo(w / 2, 0);
                        ctx.lineTo(0, h / 2);
                        ctx.lineTo(-w / 2, 0);
                        ctx.closePath();
                        ctx.stroke();

                        ctx.restore();
                    } else {
                        ctx.globalAlpha = Math.min(1, p.life / 20);
                        ctx.fillRect(p.x, p.y, p.size, p.size);
                        ctx.globalAlpha = 1.0;
                    }
                }


                beams.forEach(b => {
                    const cx = b.gui.x + b.gui.width / 2;
                    const cy = b.gui.y + b.gui.height / 2;

                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(b.angle * Math.PI / 180);


                    ctx.shadowBlur = 20;
                    ctx.shadowColor = b.gui.typeValue;

                    ctx.fillStyle = b.gui.typeValue;
                    ctx.fillRect(-b.gui.width / 2, -b.gui.height / 2, b.gui.width, b.gui.height);


                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                    if (b.gui.width > 10 && b.gui.height > 10) {
                        ctx.fillRect(-b.gui.width / 2 + 5, -b.gui.height / 2 + 5, b.gui.width - 10, b.gui.height - 10);
                    }

                    ctx.restore();
                });

            };
            function createexplosion(x, y, count = 30) {
                for (let i = 0; i < count; i++) {
                    if (particles.length > 1000) break;
                    const hue = Math.random() * 360;
                    const color = `hsl(${hue}, 100%, 70%)`;

                    const size = getrandomint(5, 25);
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 30 + 10;

                    particles.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: getrandomint(30, 80),
                        color: color,
                        size: size,
                        type: 'square'
                    });
                }
            }

            function createShockwave(x, y, color = "#ffffff", ringCount = 1) {
                for (let r = 0; r < ringCount; r++) {
                    const hue = Math.random() * 360;
                    color = `hsl(${hue}, 100%, 70%)`;
                    const particleCount = 36;
                    const speedOffset = r * 5;
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (i * (360 / particleCount)) * Math.PI / 180;
                        const speed = 20 + speedOffset;

                        particles.push({
                            x: x,
                            y: y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 40 + r * 10,
                            color: color,
                            size: 15 + r * 5,
                            type: 'square'
                        });
                    }
                }
            }

            function createWarningHitEffect(x, y, color) {

                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 10 + 5;
                    particles.push({
                        x: x + 16,
                        y: y + 16,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 20,
                        color: color,
                        size: Math.random() * 10 + 5,
                        type: 'square'
                    });
                }

                particles.push({
                    x: x + 16,
                    y: y + 16,
                    vx: 0,
                    vy: 0,
                    life: 10,
                    color: color,
                    size: 10,
                    type: 'ring',
                    expand: true
                });
            }
            document.addEventListener("keyup", e => {
                if (e.key === " " && isshoot) {
                    isshoot = false;
                };
            });
            function getCorners(obj) {
                const angle = (obj.angle || 0) * Math.PI / 180;
                const cx = obj.gui.x + obj.gui.width / 2;
                const cy = obj.gui.y + obj.gui.height / 2;
                const w = obj.gui.width / 2;
                const h = obj.gui.height / 2;

                const corners = [
                    { x: -w, y: -h },
                    { x: w, y: -h },
                    { x: w, y: h },
                    { x: -w, y: h }
                ];

                return corners.map(p => {
                    return {
                        x: cx + (p.x * Math.cos(angle) - p.y * Math.sin(angle)),
                        y: cy + (p.x * Math.sin(angle) + p.y * Math.cos(angle))
                    };
                });
            }

            function getAxes(corners) {
                const axes = [];
                for (let i = 0; i < corners.length; i++) {
                    const p1 = corners[i];
                    const p2 = corners[(i + 1) % corners.length];
                    const edge = { x: p1.x - p2.x, y: p1.y - p2.y };
                    const normal = { x: -edge.y, y: edge.x };

                    const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
                    axes.push({ x: normal.x / len, y: normal.y / len });
                }
                return axes;
            }

            function project(corners, axis) {
                let min = Infinity;
                let max = -Infinity;
                for (const p of corners) {
                    const dot = p.x * axis.x + p.y * axis.y;
                    if (dot < min) min = dot;
                    if (dot > max) max = dot;
                }
                return { min, max };
            }

            function overlap(p1, p2) {
                return !(p1.max < p2.min || p2.max < p1.min);
            }

            function checkcollision(a, b) {
                const c1 = getCorners(a);
                const c2 = getCorners(b);
                const axes = [...getAxes(c1), ...getAxes(c2)];

                for (const axis of axes) {
                    const p1 = project(c1, axis);
                    const p2 = project(c2, axis);
                    if (!overlap(p1, p2)) return false;
                }
                return true;
            }

            if (checkcollision(player, enemy)) {
                screenshake(100);
                createexplosion(player.gui.x + player.gui.width / 2, player.gui.y + player.gui.height / 2);
                player.gui.x = 100;
                player.gui.y = 500;
            }
            PlayerHPBer.canvas();
            PlayerHPBerBack.canvas();
            player.vx = 0;
            player.vy = 0;
            const gravity = 1.135;
            let count = 0;
            const playerSpeed = 2.5;
            function moveWithGravity(obj) {
                if (obj.keydata['ArrowLeft'] && count != 1) {
                    obj.vx = -1 * playerSpeed
                    obj.vy = 0;
                };
                if (obj.keydata['ArrowRight'] && count != 2) {
                    obj.vx = playerSpeed
                    obj.vy = 0;
                };
                if (obj.keydata['ArrowUp'] && count != 3) {
                    obj.vy = -1 * playerSpeed
                    obj.vx = 0;
                };
                if (obj.keydata['ArrowDown'] && count != 4) {
                    obj.vy = playerSpeed
                    obj.vx = 0;
                };
                if (obj.vy == 0 && obj.vx == 0) count = 0;
                if (obj.keydata['ArrowLeft']) count = 1;
                if (obj.keydata['ArrowRight']) count = 2;
                if (obj.keydata['ArrowUp']) count = 3;
                if (obj.keydata['ArrowDown']) count = 4;
                obj.vx *= gravity;
                obj.vy *= gravity;
                obj.gui.x += obj.vx;
                if (window.windForce) obj.gui.x += window.windForce;
                obj.gui.y += obj.vy;


                if (Math.abs(obj.vx) > 0.5 || Math.abs(obj.vy) > 0.5) {
                    if (Math.random() > 0.5) {
                        particles.push({
                            x: obj.gui.x + obj.gui.width / 2 + (Math.random() - 0.5) * 10,
                            y: obj.gui.y + obj.gui.height / 2 + (Math.random() - 0.5) * 10,
                            vx: -obj.vx * 0.5,
                            vy: -obj.vy * 0.5,
                            life: 15,
                            color: "rgba(100, 200, 255, 0.5)",
                            size: 5,
                            type: 'square'
                        });
                    }
                }

                if (obj.gui.y + obj.gui.height > obj.gui.maxHeight) {
                    obj.gui.y = obj.gui.maxHeight - obj.gui.height;
                    obj.vy = 0;
                }
                if (obj.gui.y < 0) {
                    obj.gui.y = 0;
                    obj.vy = 0;
                }
                if (obj.gui.x + obj.gui.width > obj.gui.maxWidth) {
                    obj.gui.x = obj.gui.maxWidth - obj.gui.width;
                    obj.vx = 0;
                }
                if (obj.gui.x < 0) {
                    obj.gui.x = 0;
                    obj.vx = 0;
                }
            }

            function updateScreenAura() {


                if (Math.random() > 0.7) return;

                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 2;

                particles.push({
                    x: 600,
                    y: 350,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 10,
                    color: savedata.maincolor || "#00ffff",
                    size: 1800,
                    expansionSpeed: 60,
                    rotation: 90,
                    rotSpeed: (Math.random() - 0.5) * 5,
                    type: 'expanding_diamond'
                });
            }

            function showArrow(direction = "up") {
                arrow.gui.typeValue.data = systems.arrow[direction].map(r => r.map(c => c === "1" ? savedata.maincolor : "rgba(0,0,0,0)"));
                arrow.canvas();
                return arrow;
            }
            window.playerX = player.gui.x;
            window.playerY = player.gui.y;

            function onPlayerHit() {
                if (!Player_ishit[0]) {
                    screenshake(50);
                    createexplosion(player.gui.x, player.gui.y);
                    player.gui.x = 100;
                    player.gui.y = 500;
                    PlayerHP--;
                    Player_ishit[0] = true;
                    Player_ishit[1] = 0;
                }
            }

            async function update() {
                window.playerX = player.gui.x;
                window.playerY = player.gui.y;
                danmakuEngine.update(player, onPlayerHit);
                if (time > 0) {
                    time--;
                } else {
                    if (radi.keydata[" "] && !(finishcharge >= 120)) {
                        const canvas = radi.html;
                        const ctx = canvas.getContext('2d');
                        const radius = finishcharge;
                        const x = 1200 / 2;
                        const y = 700 / 4;
                        ctx.clearRect(0, 0, 1200, 700);


                        const pulseOffset = Math.sin(finishcharge / 10) * 10;
                        ctx.strokeStyle = savedata.maincolor;
                        ctx.lineWidth = 5;
                        ctx.globalAlpha = 0.5;
                        ctx.beginPath();
                        ctx.arc(x, y, radius + pulseOffset, 0, Math.PI * 2);
                        ctx.stroke();


                        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        gradient.addColorStop(0, savedata.maincolor);
                        gradient.addColorStop(0.7, savedata.maincolor);
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        ctx.globalAlpha = 0.6 + Math.sin(finishcharge / 5) * 0.2;
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1.0;


                        if (finishcharge % 3 === 0) {
                            for (let i = 0; i < 3; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const distance = 100 + Math.random() * 50;
                                particles.push({
                                    x: player.gui.x + player.gui.width / 2 + Math.cos(angle) * distance,
                                    y: player.gui.y + player.gui.height / 2 + Math.sin(angle) * distance,
                                    vx: -Math.cos(angle) * 3,
                                    vy: -Math.sin(angle) * 3,
                                    life: 30,
                                    color: savedata.maincolor
                                });
                            }
                        }


                        if (finishcharge % 10 === 0 && finishcharge > 30) {
                            screenshake(Math.floor(finishcharge / 6));
                        }


                        if (finishcharge % 20 === 0) {
                            systems.wind(120 - finishcharge);
                        }

                        if (!challenge.no_gauge) {
                            finishcharge++;
                        }
                        if (finishcharge >= 120) {
                            if (StageLevel == 7) {

                                if (BossPhase <= 3) {
                                    if (BossPhase != 3) time = 1500;
                                    BossHP--;
                                    finishcharge = 0;
                                    screenshake(150);
                                    createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, 100);
                                    createFlash(15, "rgba(255, 50, 50, 0.5)");
                                    createShockwave(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, savedata.maincolor, 3);

                                    if (BossHP > 0) {

                                        createShockwave(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, "#ffffff", 5);
                                        createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, 200);
                                        beams.forEach(b => {
                                            b.delete();
                                        });
                                        beams.length = 0;
                                        window.battleActive = false;
                                        await systems.sleep(100);
                                        window.battleActive = true;

                                        BossPhase++;
                                        let BasePatternIndex = [31, 34, 37, 40][Stagenumber];
                                        let colorString = `rgba(${Stagenumber == 0 ? 255 : 0}, ${Stagenumber == 1 ? 255 : 0}, ${Stagenumber == 2 ? 255 : 0})`;
                                        if (lastboss) {
                                            BasePatternIndex = 43;
                                            colorString = "rgba(255, 255, 255, 1)";
                                        }
                                        bullethells(BasePatternIndex + BossPhase - 1, colorString);
                                    } else {

                                        if (BossPhase < 3) {
                                            createShockwave(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, "#ffffff", 5);
                                            createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, 200);
                                            beams.forEach(b => {
                                                b.delete();
                                            });
                                            beams.length = 0;
                                            window.battleActive = false;
                                            await systems.sleep(100);
                                            window.battleActive = true;

                                            BossPhase++;
                                            let BasePatternIndex = [29, 32, 35, 38][Stagenumber];
                                            let colorString = `rgba(${Stagenumber == 0 ? 255 : 0}, ${Stagenumber == 1 ? 255 : 0}, ${Stagenumber == 2 ? 255 : 0})`;
                                            bullethells(BasePatternIndex + BossPhase - 1, colorString);
                                        } else {

                                            if (Stagenumber == 3) {
                                                if (!lastboss && !scriptedLoss) {
                                                    beams.forEach(b => {
                                                        b.delete();
                                                    });
                                                    beams.length = 0;
                                                    window.battleActive = false;
                                                    stopBattleMusic();
                                                    let effectFinish = true;
                                                    let speed = 0;
                                                    const neweffect = Creation.create("Effect", "gui", {
                                                        typeValue: {
                                                            dot: "40px",
                                                            data: systems.arrow.finish.map(r => r.map(c => c === "1" ? savedata.maincolor : "rgba(0,0,0,0)")),
                                                        },
                                                        zIndex: 10,
                                                        width: 640,
                                                        height: 640,
                                                        x: 600 - 320,
                                                        y: 700 - 320,
                                                    }, "newcreate");
                                                    Object.assign(effect, neweffect);
                                                    async function FE() {
                                                        return new Promise(async (resolve) => {
                                                            while (effectFinish) {
                                                                effect.gui.y -= speed;
                                                                effect.canvas();
                                                                speed++;
                                                                if (enemy.gui.y < 0) enemy.gui.y -= speed / 4;
                                                                enemy.canvas();
                                                                if (effect.gui.y < -320) {
                                                                    effectFinish = false;
                                                                    effect.remove();
                                                                }
                                                                await systems.sleep(1);
                                                            }
                                                            finish = true;
                                                            resolve();
                                                        })
                                                    }
                                                    createShockwave(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, "#ffffff", 5);
                                                    createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, 200);
                                                    systems.wind(1000);
                                                    systems.wind2(1000);
                                                    systems.wind3(1000);
                                                    systems.wind4(1000);
                                                    await FE();
                                                    soundeffect("./game/music/hit.mp3");
                                                    await entertext("クカルヴ「クソ…俺らは…ただ平和に暮らしていただけなのに…！」");
                                                    await entertext({ text: "「被害者ぶるなよ。サン族に戦争を仕掛けたのはそっちだろ。」", emotion: "angry" });
                                                    await entertext("クカルヴ「…?なんだ、サン族って…聞いたこともないぞ…」");
                                                    await entertext({ text: "「は…?神様がそう言ってたぞ…？」", emotion: "surprised" });
                                                    createFlash(30, "#ff0000");
                                                    screenshake(300);
                                                    enemy.delete();
                                                    ishit[0] = true;
                                                    ishit[1] = 0;
                                                    window.battleActive = false;
                                                    await systems.sleep(1000);
                                                    beams.length = 0;
                                                    enemy.remove();
                                                    PlayerHPBer.remove();
                                                    PlayerHPBerBack.remove();
                                                    GraphinyGauge.remove();
                                                    GraphinyGaugeBack.remove();
                                                    await systems.sleep(1500);
                                                    player.remove();
                                                    particleLayer.delete();
                                                    particleLayer.remove();
                                                    arrow.remove();
                                                    beams.length = 0;
                                                    window.battleActive = false;
                                                    stopBattleMusic();
                                                    await systems.sleep(1000);
                                                    resolve("GOD_EVENT");
                                                    finish = true;
                                                    return;
                                                } else {
                                                    let effectFinish = true;
                                                    let speed = 0;
                                                    const neweffect = Creation.create("Effect", "gui", {
                                                        typeValue: {
                                                            dot: "40px",
                                                            data: systems.arrow.finish.map(r => r.map(c => c === "1" ? savedata.maincolor : "rgba(0,0,0,0)")),
                                                        },
                                                        zIndex: 10,
                                                        width: 640,
                                                        height: 640,
                                                        x: 600 - 320,
                                                        y: 700 - 320,
                                                    }, "newcreate");
                                                    Object.assign(effect, neweffect);
                                                    async function FE() {
                                                        return new Promise(async (resolve) => {
                                                            while (effectFinish) {
                                                                effect.gui.y -= speed;
                                                                effect.canvas();
                                                                speed++;
                                                                if (enemy.gui.y < 0) enemy.gui.y -= speed / 4;
                                                                enemy.canvas();
                                                                if (effect.gui.y < -320) {
                                                                    effectFinish = false;
                                                                }
                                                                await systems.sleep(1);
                                                            }
                                                            finish = true;
                                                            resolve();
                                                        })
                                                    }
                                                    createShockwave(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, "#ffffff", 5);
                                                    createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, 200);
                                                    systems.wind(1000);
                                                    systems.wind2(1000);
                                                    systems.wind3(1000);
                                                    systems.wind4(1000);
                                                    await FE();
                                                    soundeffect("./game/music/hit.mp3");
                                                }
                                            } else {

                                                let effectFinish = true;
                                                let speed = 0;
                                                const neweffect = Creation.create("Effect", "gui", {
                                                    typeValue: {
                                                        dot: "40px",
                                                        data: systems.arrow.finish.map(r => r.map(c => c === "1" ? savedata.maincolor : "rgba(0,0,0,0)")),
                                                    },
                                                    zIndex: 10,
                                                    width: 640,
                                                    height: 640,
                                                    x: 600 - 320,
                                                    y: 700 - 320,
                                                }, "newcreate");
                                                Object.assign(effect, neweffect);
                                                async function FE() {
                                                    return new Promise(async (resolve) => {
                                                        while (effectFinish) {
                                                            effect.gui.y -= speed;
                                                            effect.canvas();
                                                            speed++;
                                                            if (enemy.gui.y < 0) enemy.gui.y -= speed / 4;
                                                            enemy.canvas();
                                                            if (effect.gui.y < -320) {
                                                                effectFinish = false;
                                                                effect.remove();
                                                            }
                                                            await systems.sleep(1);
                                                        }
                                                        finish = true;
                                                        soundeffect("./game/music/hit.mp3");
                                                        resolve();
                                                    })
                                                }
                                                createShockwave(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, "#ffffff", 5);
                                                createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, 200);
                                                systems.wind(1000);
                                                systems.wind2(1000);
                                                systems.wind3(1000);
                                                systems.wind4(1000);
                                                await FE();
                                            }
                                        }
                                    }
                                }
                            } else {

                                let effectFinish = true;
                                let speed = 0;
                                async function FE() {
                                    return new Promise(async (resolve) => {
                                        while (effectFinish) {
                                            effect.gui.y -= speed;
                                            effect.canvas();
                                            speed++;
                                            if (enemy.gui.y < 0) enemy.gui.y -= speed / 4;
                                            enemy.canvas();
                                            if (effect.gui.y < -320) {
                                                effectFinish = false;
                                                effect.remove();
                                            }
                                            await systems.sleep(1);
                                        }
                                        finish = true;
                                        resolve();
                                    })
                                }
                                createShockwave(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, "#ffffff", 5);
                                createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2, 200);
                                systems.wind(1000);
                                systems.wind2(1000);
                                systems.wind3(1000);
                                systems.wind4(1000);
                                await FE();
                            }
                        }
                    } else {
                        // Clear the radi canvas when space is not pressed
                        const canvas = radi.html;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, 1200, 700);
                        // Reset finishcharge when space is released
                        if (finishcharge < 120) {
                            finishcharge = 0;
                        }
                    }
                }
                PlayerHPBer.delete();
                PlayerHPBerBack.delete();
                PlayerHPBer.gui.width = PlayerHP * 100;
                PlayerHPBerBack.gui.width = 300;
                GraphinyGauge.delete();
                GraphinyGaugeBack.delete();
                GraphinyGauge.gui.width = 300 - time / 5;
                GraphinyGaugeBack.gui.width = 300;
                arrow.gui.x = player.gui.x - arrow.gui.width / 2 + player.gui.width / 2;
                arrow.gui.y = player.gui.y - arrow.gui.height / 2 + player.gui.height / 2;
                if (count == 0) {
                    arrow.delete();
                }
                if (count == 1) {
                    showArrow("right");
                }
                if (count == 2) {
                    showArrow("left");
                }
                if (count == 3) {
                    showArrow("up");
                }
                if (count == 4) {
                    showArrow("down");
                }
                for (let i = beams.length - 1; i >= 0; i--) {
                    const b = beams[i];
                    if (b.isPreLine) {
                        b.gui.typeValue = "#d0d000";
                        if (b.gui.height > b.gui.width) {
                            b.gui.height = b.height * 2;
                            b.gui.width = b.width * 0.5;
                        } else {
                            b.gui.width = b.width * 2;
                            b.gui.height = b.height * 0.5;
                        }

                        const mult = 11;
                        b.gui.x += b.vx * mult;
                        b.gui.y += b.vy * mult;

                        b.prelife -= 5;
                        if (b.prelife < 0) {
                            b.gui.x = b.x;
                            b.gui.y = b.y;
                            b.isPreLine = false;
                            soundeffect("./game/music/fire.wav");
                        }

                    } else {
                        let w, h;
                        if (b.gui.height > b.gui.width) {
                            h = b.height;
                            w = b.boss ? b.width : b.width * 2.5;
                        } else {
                            w = b.width;
                            h = b.boss ? b.height : b.height * 2.5;
                        }
                        b.gui.width = w;
                        b.gui.height = h;
                        b.gui.typeValue = b.color;
                        b.gui.x += b.vx * 9;
                        b.gui.y += b.vy * 9;
                        b.life -= 2.5;
                        if (b.life <= 0) {
                            b.delete();
                            beams.splice(i, 1);
                        }
                    }
                }

                if (ishit[1] == 120) {
                    const enemyData = systems.enemy[Stagenumber] || systems.enemy[0];
                    enemy.gui.typeValue.data = enemyData.map(r => r.map(c => c === "1" ? `rgba(${Stagenumber == 0 ? 255 : 0}, ${Stagenumber == 1 ? 255 : 0}, ${Stagenumber == 2 ? 255 : 0}, 1)` : "rgba(0,0,0,0)"));
                    ishit[0] = false;
                } else if (ishit[0]) {
                    const enemyData = systems.enemy[Stagenumber] || systems.enemy[0];
                    enemy.gui.typeValue.data = enemyData.map(r => r.map(c => c === "1" ? `rgba(${Stagenumber == 0 ? 255 : 0}, ${Stagenumber == 1 ? 255 : 0}, ${Stagenumber == 2 ? 255 : 0}, 1)` : "rgba(0,0,0,0)"));
                    ishit[1]++;
                }
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;

                    if (p.type === 'expanding_diamond') {
                        p.size += p.expansionSpeed;
                        p.expansionSpeed *= 0.9;
                        p.rotation += p.rotSpeed;
                        p.rotSpeed *= 0.95;
                    } else {
                        p.vx *= 0.9;
                        p.vy *= 0.9;
                    }

                    p.life--;
                    if (p.life <= 0) {
                        particles.splice(i, 1);
                    }
                }
                for (let i = beams.length - 1; i >= 0; i--) {
                    const beamObj = beams[i];
                    if (checkcollision(player, beamObj)) {
                        if (!beamObj.isPreLine && !Player_ishit[0]) {
                            screenshake(50);
                            createexplosion(player.gui.x, player.gui.y);
                            player.gui.x = 100;
                            player.gui.y = 500;
                            PlayerHP--;
                            Player_ishit[0] = true;
                            Player_ishit[1] = 0;
                            soundeffect("./game/music/glass.mp3");
                            break;
                        } else {
                            time -= 4;
                            if (!(StageLevel == 7)) {
                                time -= 4;
                            }
                            createWarningHitEffect(player.gui.x, player.gui.y, savedata.maincolor);
                        }
                    }
                }
                if (Player_ishit[1] >= 120) {
                    PlayerHPBer.gui.typeValue = "#00ff00";
                    Player_ishit[0] = false;

                } else if (Player_ishit[0]) {
                    PlayerHPBer.gui.typeValue = "#ff11ff";
                    Player_ishit[1]++;
                    if (scriptedLoss) Player_ishit[1] += 10;
                }
                GraphinyGauge.canvas();
                GraphinyGaugeBack.canvas();
                PlayerHPBer.canvas();
                PlayerHPBerBack.canvas();
                player.canvas();
                player.canvas();
                updateScreenAura();
                moveWithGravity(player);
                enemy.canvas();

                particleLayer.canvas();
                if (PlayerHP == 0) {
                    if (scriptedLoss) {
                        beams.forEach(b => {
                            b.delete();
                        });
                        ishit[0] = true;
                        ishit[1] = 0;
                        window.battleActive = false;
                        await systems.sleep(1000);
                        beams.length = 0;
                        enemy.remove();
                        PlayerHPBer.remove();
                        PlayerHPBerBack.remove();
                        GraphinyGauge.remove();
                        GraphinyGaugeBack.remove();
                        await systems.sleep(1500);
                        player.remove();
                        particleLayer.delete();
                        particleLayer.remove();
                        arrow.remove();
                        beams.length = 0;
                        window.battleActive = false;
                        arrow.remove();
                        beams.length = 0;
                        window.battleActive = false;
                        stopBattleMusic();
                        danmakuEngine.init();
                        const choice = await showgameoverscreen(true);
                        resolve(choice);
                        return;
                    } else {
                        finish = true;
                    }
                }
                if (!finish) {
                    requestAnimationFrame(update);
                } else {
                    enemy.delete();
                    if (PlayerHP == 0) {
                        ishit[0] = true;
                        ishit[1] = 0;
                        window.battleActive = false;
                        await systems.sleep(1000);
                        beams.length = 0;
                        enemy.remove();
                        PlayerHPBer.remove();
                        PlayerHPBerBack.remove();
                        GraphinyGauge.remove();
                        GraphinyGaugeBack.remove();
                        await systems.sleep(1500);
                        player.remove();
                        particleLayer.delete();
                        particleLayer.remove();
                        arrow.remove();
                        arrow.remove();
                        stopBattleMusic();
                        danmakuEngine.init();
                        const choice = await showgameoverscreen(false);
                        resolve(choice);
                    } else {
                        createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2);
                        createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2);
                        createexplosion(enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2);
                        function lastp() {
                            return new Promise(resolve => {
                                function loop() {
                                    for (let i = particles.length - 1; i >= 0; i--) {
                                        const p = particles[i];
                                        p.x += p.vx;
                                        p.y += p.vy;
                                        p.vx--;
                                        p.vy--;
                                        p.life--;
                                        if (p.life <= 0) {
                                            particles.splice(i, 1);
                                        }
                                    }
                                    particleLayer.canvas();
                                    if (particles.length !== 0) {
                                        requestAnimationFrame(loop);
                                    } else {
                                        resolve();
                                    }
                                }
                                loop();
                            });
                        }
                        await lastp();
                        radi.remove();
                        window.battleActive = false;
                        stopBattleMusic();
                        danmakuEngine.init();
                        await systems.sleep(1000);
                        screenshake(200);
                        await systems.sleep(500);
                        screenshake(300);
                        await systems.sleep(1000);
                        systems.starpoint(Number(parseInt((savedata.maincolor.charAt(1) + savedata.maincolor.charAt(2)), 16)), Number(parseInt(savedata.maincolor.charAt(3) + savedata.maincolor.charAt(4), 16)), Number(parseInt(savedata.maincolor.charAt(5) + savedata.maincolor.charAt(6), 16)), savedata.number, enemy.gui.x + enemy.gui.width / 2, enemy.gui.y + enemy.gui.height / 2);
                        screenshake(100);
                        systems.wind(1500);
                        systems.wind2(1500);
                        systems.wind3(1500);
                        systems.wind4(1500);
                        await systems.sleep(1500);
                        ishit[0] = true;
                        ishit[1] = 0;
                        window.battleActive = false;
                        await systems.sleep(1000);
                        beams.length = 0;
                        await lastp();
                        enemy.remove();
                        PlayerHPBer.remove();
                        PlayerHPBerBack.remove();
                        GraphinyGauge.remove();
                        GraphinyGaugeBack.remove();
                        await systems.sleep(1000);
                        player.remove();
                        particleLayer.delete();
                        particleLayer.remove();
                        arrow.remove();

                        if (postMovie) {
                            const lines = getmoviedata(postMovie, savedata.name);
                            if (lines && lines.length > 0) await visualnoveldialogue(lines, bgContext);
                        }

                        await processbattleevent(`${Stagenumber}-${StageLevel}`, "post", { isBoss, lastboss, Stagenumber });
                        await entertext("Stage Clear!");
                        resolve(true);
                    }
                }
            }
            if (!lastboss) await processbattleevent(`${Stagenumber}-${StageLevel}`, "pre", { isBoss, lastboss, Stagenumber });

            bullet_hell();

            if (systems._specialAttacks) {
                const specialAttackIndex = Stagenumber * 7 + (StageLevel - 1);
                if (systems._specialAttacks[specialAttackIndex]) {
                    systems._specialAttacks[specialAttackIndex](danmakuEngine, systems, 'rgba(255,255,255,1)');
                }
            }

            update();
        }
        );
    }
    async function gameStart() {
        if (!savedata.config) savedata.config = { bgm: 100, se: 100 };
        const audio = new Audio('./game/music/menu.mp3');
        audio.volume = savedata.config.bgm / 100;
        audio.loop = true;
        audio.play();
        const back = imagebackground("./game/home.png");

        const logo = new SmoothImage("logo", "./game/Graphiny_logo.png", 600, 350, 0, 0);
        logo.rotation = 720;
        logo.canvas();


        await systems.sleep(500);
        logo.moveTo(600 - 342, 600 - 86, 684, 172, 0);

        await systems.sleep(2000);


        logo.moveTo(600 - 342, 50, 684, 172, 0);
        await systems.sleep(1000);

        button_create("Start Game", 500, 300);
        await waituntildeletedAll("Start Game", "Start Game_back", "Start Game_back_line");
        logo.remove();
        back.remove();
        saferemove("Start Game");
        saferemove("Start Game" + "_back");
        saferemove("Start Game" + "_back_line");
        audio.pause();
        audio.currentTime = 0;
        init();
    }

    async function storymovie() {
        const scenes = [
            { img: "./game/movie/prologuemovie-1.png", chara: false, text: "西暦40xx年、地球は途轍もなく発達した。" },
            { img: "./game/movie/prologuemovie-1.png", chara: false, text: "戦争は終結し、人類は平和を築いていた。誰もが幸せな、理想郷だった。" },
            { img: "./game/movie/prologuemovie-9.png", chara: false, text: "だが…平和ボケしていたのか、政府は生命維持システムへのアクセスを緩めた。その結果、企業などはそのシステムにCMなどを組み込み、商業はより盛んになった。" },
            { img: "./game/movie/prologuemovie-9.png", chara: false, text: "規制緩和は大正解の…筈だった。" },
            { img: "./game/movie/prologuemovie-2.png", chara: false, text: "とある若者が事故で大罪を起こす。" },
            { img: "./game/movie/prologuemovie-2.png", chara: false, text: "南半球の生命維持システムが壊滅し、赤道直下の国なども人が住める状況等では無くなった。" },
            { img: "./game/movie/prologuemovie-3.png", chara: false, text: "その若者には、司法機関から\"死ぬまで孤独に宇宙を彷徨う\"という、前代未聞の罰が与えられた。" },
            { img: "./game/movie/prologuemovie-4.png", chara: false, text: "一人で宇宙を彷徨っていたその若者は、ある日不思議な光を見つける。" },
            { img: "./game/movie/prologuemovie-5.png", chara: false, text: "そして、その若者は光に吸い込まれた。" },
            { img: "./game/movie/prologuemovie-6.png", chara: false, text: "光の中で意識が遠のく中、その光だけが鮮明に焼き付いた。" },
            { img: "./game/movie/prologuemovie-7.png", text: "目を開けるとそこには、見知らぬ異世界があった。" },
            { img: "./game/movie/prologuemovie-7.png", text: "「ようやく来たか。" + savedata.name + "。」", name: "???", speaker: "right" },
            { img: "./game/movie/prologuemovie-7.png", text: "「ここどこだ…?」", name: savedata.name, speaker: "left" },
            { img: "./game/movie/prologuemovie-7.png", text: "「私は神だ。ここはお前の住んでいた世界とは違う…\"異世界\"だ。」", name: "神", speaker: "right" },
            { img: "./game/movie/prologuemovie-7.png", text: "「もう何年経ったかも忘れた…あの時から…陸に…辿り着けた…!」", name: savedata.name, speaker: "left" },
            { img: "./game/movie/prologuemovie-7.png", text: "「そうだな…それは置いておいて…お前には、とある\"戦争\"を止めてほしい。」", name: "神", speaker: "right" },
            { img: "./game/movie/prologuemovie-7.png", text: "「それは…\"クリスタル族\"と\"サン族\"の戦争だ。」", name: "神", speaker: "right" },
            { img: "./game/movie/prologuemovie-7.png", text: "「この世界はお前が元居た世界と違い、宇宙でも生物が生息できる。それ故、クリスタル族とサン族という生物が覇権を握った。」", name: "神", speaker: "right" },
            { img: "./game/movie/prologuemovie-8.png", text: "「だが、クリスタル族は、完全にクリスタル族が支配する世界にするために、サン族に対して戦争を仕掛けたのだ…」", name: "神", speaker: "right" },
            { img: "./game/movie/prologuemovie-8.png", text: "「お前には、クリスタル族の王にしてこの戦争の根源、「クカルヴ」を倒してほしい。」", name: "神", speaker: "right" },
            { img: "./game/movie/prologuemovie-9.png", text: "「そうすれば…この世界の戦争が終結し、平和が戻る。」", name: "神", speaker: "right" },
            { img: "./game/movie/prologuemovie-7.png", text: "「俺に…利益はあるのか…?」", name: savedata.name, speaker: "left" },
            { img: "./game/movie/prologuemovie-7.png", text: "「そうだな…お前が大罪を犯す前の時間に戻し、お前が元居た世界に帰してやる。」", name: "神", speaker: "right" },
            { img: "./game/movie/prologuemovie-7.png", text: "「分かった。引き受けよう。」", name: savedata.name, speaker: "left" },
            { img: "./game/movie/movie-12.png", text: "「あ…?」", name: savedata.name, speaker: "left" },
            { img: "./game/movie/movie-12.png", text: "「…お前は無重力空間にずっと居た所為で動けなくなったんだな。それなら俺はお前に一つ力を授けてやろう。」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-12.png", text: "「クリスタル族と戦う以上、相手の攻撃を避ける必要がある。そのためには移動しなければならない。移動できる能力を授けてやろう。」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-12.png", text: "「…その能力は…「Graphiny」。重力を操作できる。」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-12.png", text: "能力「Graphiny」を授かった。" },
            { img: "./game/movie/movie-12.png", text: "「さぁ…行け。」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-12.png", text: savedata.name + "は、自分のためと、戦争を終結させるため、戦うことを決意した。" }
        ];

        await visualnoveldialogue(scenes);
    }

    async function tutorial() {
        const isMobileMode = isMobile();
        const controlsMessage = isMobileMode
            ? "基本的な操作方法は画面上の矢印ボタンです。"
            : "基本的な操作方法は矢印キーで移動、スペースキーで攻撃です。";
        const attackMessage = isMobileMode
            ? "グラビティバーは時間とともに溜まり、溜まってから\n画面上のAボタンを長押しすると\n攻撃が出来ます。"
            : "グラビティバーは時間とともに溜まり、溜まってから\nスペースキーを長押しすると\n攻撃が出来ます。";

        // Intro
        const introScenes = [
            { img: "./game/movie/tutorial_movie-1.png", chara: false, text: "チュートリアルです！\nまずは基本操作について説明します。" },
            { img: "./game/movie/tutorial_movie-1.png", chara: false, text: controlsMessage },
            { img: "./game/movie/tutorial_movie-2.png", chara: false, text: "左にある水色のバーは、グラビティバーと言います。" },
            { img: "./game/movie/tutorial_movie-2.png", chara: false, text: attackMessage },
            { img: "./game/movie/tutorial_movie-2.png", chara: false, text: "それでは、実際に動いて攻撃してみましょう。\n敵の弾を避けながら攻撃してください！" },
        ];
        await visualnoveldialogue(introScenes);

        // Practice Battle
        await battle(async () => {
            await visualnoveldialogue([{ text: "実践開始！(相手を倒せ!)", name: "System" }]);
            // Simple pattern for practice
            await bullethells(0, "rgba(0,255,0,1)");
        }, 0, 8, false, false, null, null);

        // Post-Battle
        const scenes = [
            { img: "./game/movie/tutorial_movie-2.png", chara: false, text: "ナイスファイトです！\nちなみに、敵が打ってくるビームの黄色い予告線に触れると、グラビティゲージが大量に上がります" },
            { img: "./game/movie/tutorial_movie-3.png", chara: false, text: "右にある緑色のバーは、HPバーです。\nこれが0になるとゲームオーバーとなります。" },
            { img: "./game/movie/movie-9.png", text: "「クリスタル族幹部は、Red隊、Blue隊、Green隊、Black隊に分かれている。」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-9.png", text: "「それぞれ7人ごとの小さな部隊だが…強力だ。」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-9.png", text: "「リーダーはそれぞれ、ディア―、エウルブ、ネアー、クカルヴだ…」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-9.png", text: "「クカルヴ…」", name: savedata.name, speaker: "left" },
            { img: "./game/movie/movie-9.png", text: "「そうだ。お前にはクカルヴを倒すという任務を課しているが…クカルヴを倒すには幹部を全員倒さなければならない。つまり…すべてで28人倒す必要がある。頼んだぞ。」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-9.png", text: "「急げよ。" + savedata.name + "。\nこの世界の…いや、俺の『メモリ』が食いつぶされる前に頼むぞ。」", name: "神", speaker: "right" },
            { img: "./game/movie/movie-9.png", text: "「メモリ…？」", name: savedata.name, speaker: "left" },
            { img: "./game/movie/movie-9.png", text: "「あー…いや、こっちの話だ。気にするな。\nまぁ…クリスタル族は倒されても1か月ほど経てば「転生」するんだ…だが、記憶も筋肉も全てロストだ。だが安心しろ、『才能』だけは残る。クリスタル族にとって、積み上げたものが消えるのはとてつもなく重い罰だ。」", name: "神", speaker: "right" },
            { img: "./game/movie/tutorial_movie-1.png", chara: false, text: "チュートリアルは以上です。\nそれでは、本編をお楽しみください。" },
        ];

        await visualnoveldialogue(scenes);
    }
    async function init() {
        if (!savedata.start.game) {
            async function createColorPickerDOM(parentElement, x, y) {
                return new Promise(resolve => {

                    const overlay = document.createElement('div');
                    overlay.style.cssText = `
position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8);
z-index: 1000; display: flex; align-items: center; justify-content: center;
image-rendering: pixelated; font-family: 'DotJP', sans-serif;
`;
                    parentElement.appendChild(overlay);

                    const container = document.createElement('div');
                    // Added z-index: 10 and position: relative to ensure it's above the background
                    container.style.cssText = `
width: 800px; height: 500px; position: relative; z-index: 10;
background: #000; border: 4px solid #fff;
box-shadow: 0 0 0 8px #000, 0 0 40px rgba(0, 0, 0, 0.8);
display: flex; flex-direction: column; padding: 4px;
`;
                    overlay.appendChild(container);

                    // Add Amazing Background
                    addbg(overlay);

                    const header = document.createElement('div');
                    header.style.cssText = `
background: #fff; color: #000; padding: 8px 16px;
font-weight: bold; font-size: 24px; text-transform: uppercase;
margin-bottom: 20px; display: flex; justify-content: space-between;
`;
                    header.innerHTML = '<span>SYSTEM_COLOR_CONFIG.EXE</span><span>[X]</span>';
                    container.appendChild(header);

                    const content = document.createElement('div');
                    content.style.cssText = 'display: flex; flex: 1; gap: 20px; padding: 0 20px 20px 20px;';
                    container.appendChild(content);
                    const leftPanel = document.createElement('div');
                    leftPanel.style.cssText = 'flex: 1; display: flex; align-items: center; justify-content: center; border: 2px dashed #444; background: #111;';
                    content.appendChild(leftPanel);

                    const svCanvas = document.createElement('canvas');
                    svCanvas.width = 350; svCanvas.height = 350;
                    svCanvas.style.cssText = 'border: 4px solid #fff; cursor: crosshair; image-rendering: pixelated; touch-action: none;';
                    leftPanel.appendChild(svCanvas);

                    const rightPanel = document.createElement('div');
                    rightPanel.style.cssText = 'width: 300px; display: flex; flex-direction: column; gap: 20px;';
                    content.appendChild(rightPanel);

                    const previewGroup = document.createElement('div');
                    previewGroup.innerHTML = '<div style="color:#fff; margin-bottom:4px;">> PREVIEW</div>';
                    const previewBox = document.createElement('div');
                    previewBox.style.cssText = 'width: 100%; height: 60px; border: 4px solid #fff; background: #fff;';
                    previewGroup.appendChild(previewBox);
                    rightPanel.appendChild(previewGroup);

                    const hueGroup = document.createElement('div');
                    hueGroup.innerHTML = '<div style="color:#fff; margin-bottom:4px;">> HUE</div>';
                    const hueCanvas = document.createElement('canvas');
                    hueCanvas.width = 290; hueCanvas.height = 40;
                    hueCanvas.style.cssText = 'border: 4px solid #fff; cursor: pointer; image-rendering: pixelated; touch-action: none;';
                    hueGroup.appendChild(hueCanvas);
                    rightPanel.appendChild(hueGroup);

                    const hexGroup = document.createElement('div');
                    hexGroup.innerHTML = '<div style="color:#fff; margin-bottom:4px;">> HEX_CODE</div>';
                    const hexInput = document.createElement('input');
                    hexInput.type = 'text'; hexInput.value = '#FFFFFF';
                    hexInput.style.cssText = `
width: 100%; background: #000; border: 2px solid #fff; color: #fff;
padding: 10px; font-family: 'DotJP', sans-serif; font-size: 20px; text-align: center; outline: none;
`;
                    hexInput.onfocus = () => hexInput.style.background = '#222';
                    hexInput.onblur = () => hexInput.style.background = '#000';
                    hexGroup.appendChild(hexInput);
                    rightPanel.appendChild(hexGroup);

                    const confirmBtn = document.createElement('button');
                    confirmBtn.textContent = 'INITIALIZE';
                    confirmBtn.style.cssText = `
margin-top: auto; padding: 15px; background: #000;
color: #fff; border: 4px solid #fff; font-family: 'DotJP', sans-serif; font-size: 20px;
font-weight: bold; cursor: pointer; text-transform: uppercase;
`;
                    confirmBtn.onmouseover = () => { confirmBtn.style.background = '#fff'; confirmBtn.style.color = '#000'; };
                    confirmBtn.onmouseout = () => { confirmBtn.style.background = '#000'; confirmBtn.style.color = '#fff'; };
                    rightPanel.appendChild(confirmBtn);

                    let hue = 0, sat = 0, val = 1;
                    const ctxSV = svCanvas.getContext('2d', { alpha: false });
                    const ctxHue = hueCanvas.getContext('2d', { alpha: false });
                    ctxSV.imageSmoothingEnabled = false;
                    ctxHue.imageSmoothingEnabled = false;

                    const hueGrad = ctxHue.createLinearGradient(0, 0, hueCanvas.width, 0);
                    for (let i = 0; i <= 360; i += 60) hueGrad.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);

                    const svBgCanvas = document.createElement('canvas');
                    svBgCanvas.width = svCanvas.width; svBgCanvas.height = svCanvas.height;
                    const ctxSvBg = svBgCanvas.getContext('2d', { alpha: false });

                    function updateSvBackground() {
                        ctxSvBg.fillStyle = `hsl(${hue}, 100%, 50%)`;
                        ctxSvBg.fillRect(0, 0, svBgCanvas.width, svBgCanvas.height);

                        const gradWhite = ctxSvBg.createLinearGradient(0, 0, svBgCanvas.width, 0);
                        gradWhite.addColorStop(0, 'rgba(255,255,255,1)');
                        gradWhite.addColorStop(1, 'rgba(255,255,255,0)');
                        ctxSvBg.fillStyle = gradWhite;
                        ctxSvBg.fillRect(0, 0, svBgCanvas.width, svBgCanvas.height);

                        const gradBlack = ctxSvBg.createLinearGradient(0, 0, 0, svBgCanvas.height);
                        gradBlack.addColorStop(0, 'rgba(0,0,0,0)');
                        gradBlack.addColorStop(1, 'rgba(0,0,0,1)');
                        ctxSvBg.fillStyle = gradBlack;
                        ctxSvBg.fillRect(0, 0, svBgCanvas.width, svBgCanvas.height);
                    }

                    function drawHue() {
                        ctxHue.fillStyle = hueGrad;
                        ctxHue.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
                        const x = (hue / 360) * hueCanvas.width;
                        ctxHue.fillStyle = 'black'; ctxHue.fillRect(x - 4, 0, 8, hueCanvas.height);
                        ctxHue.fillStyle = 'white'; ctxHue.fillRect(x - 2, 2, 4, hueCanvas.height - 4);
                    }

                    function drawSV() {
                        ctxSV.drawImage(svBgCanvas, 0, 0);
                        const x = Math.floor(sat * svCanvas.width);
                        const y = Math.floor((1 - val) * svCanvas.height);
                        ctxSV.fillStyle = 'black';
                        ctxSV.fillRect(x - 6, y - 2, 12, 4); ctxSV.fillRect(x - 2, y - 6, 4, 12);
                        ctxSV.fillStyle = 'white';
                        ctxSV.fillRect(x - 4, y - 1, 8, 2); ctxSV.fillRect(x - 1, y - 4, 2, 8);
                    }

                    function hsvToHex(h, s, v) {
                        let r, g, b, i, f, p, q, t;
                        i = Math.floor(h * 6); f = h * 6 - i; p = v * (1 - s); q = v * (1 - f * s); t = v * (1 - (1 - f) * s);
                        switch (i % 6) {
                            case 0: r = v, g = t, b = p; break; case 1: r = q, g = v, b = p; break;
                            case 2: r = p, g = v, b = t; break; case 3: r = p, g = q, b = v; break;
                            case 4: r = t, g = p, b = v; break; case 5: r = v, g = p, b = q; break;
                        }
                        const toHex = x => { const hex = Math.round(x * 255).toString(16); return hex.length === 1 ? '0' + hex : hex; };
                        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                    }

                    function hexToHsv(hex) {
                        let r = 0, g = 0, b = 0;
                        if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
                        else if (hex.length === 7) { r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16); }
                        r /= 255; g /= 255; b /= 255;
                        let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
                        let h = 0, s = 0, v = 0;
                        if (delta == 0) h = 0;
                        else if (cmax == r) h = ((g - b) / delta) % 6;
                        else if (cmax == g) h = (b - r) / delta + 2;
                        else h = (r - g) / delta + 4;
                        h = Math.round(h * 60); if (h < 0) h += 360;
                        v = cmax; s = cmax == 0 ? 0 : delta / cmax;
                        return [h, s, v];
                    }

                    function updateUI(updateBg = false) {
                        if (updateBg) updateSvBackground();
                        drawHue();
                        drawSV();
                        const hex = hsvToHex(hue / 360, sat, val);
                        previewBox.style.background = hex;
                        hexInput.value = hex;
                    }

                    let draggingSV = false, draggingHue = false;

                    const updateSV = (e) => {
                        const rect = svCanvas.getBoundingClientRect();
                        // Support touch
                        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

                        let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                        let y = Math.max(0, Math.min(clientY - rect.top, rect.height));
                        sat = x / rect.width; val = 1 - (y / rect.height);
                        updateUI(false);
                    };

                    const updateHue = (e) => {
                        const rect = hueCanvas.getBoundingClientRect();
                        const clientX = e.touches ? e.touches[0].clientX : e.clientX;

                        let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                        hue = (x / rect.width) * 360;
                        updateUI(true);
                    };

                    // Event Handlers
                    const onDownSV = e => { if (e.cancelable) e.preventDefault(); draggingSV = true; updateSV(e); };
                    const onDownHue = e => { if (e.cancelable) e.preventDefault(); draggingHue = true; updateHue(e); };

                    svCanvas.addEventListener('mousedown', onDownSV);
                    svCanvas.addEventListener('touchstart', onDownSV, { passive: false });

                    hueCanvas.addEventListener('mousedown', onDownHue);
                    hueCanvas.addEventListener('touchstart', onDownHue, { passive: false });

                    const onUp = () => { draggingSV = false; draggingHue = false; };
                    const onMove = e => {
                        if (draggingSV) { if (e.cancelable) e.preventDefault(); updateSV(e); }
                        if (draggingHue) { if (e.cancelable) e.preventDefault(); updateHue(e); }
                    };

                    window.addEventListener('mouseup', onUp);
                    window.addEventListener('touchend', onUp);
                    window.addEventListener('mousemove', onMove, { passive: false });
                    window.addEventListener('touchmove', onMove, { passive: false });

                    hexInput.onchange = () => {
                        const hex = hexInput.value;
                        if (/^#[0-9A-F]{6}$/i.test(hex)) {
                            const [h, s, v] = hexToHsv(hex);
                            hue = h; sat = s; val = v;
                            updateUI(true);
                        }
                    };

                    const cleanUp = () => {
                        window.removeEventListener('mouseup', onUp);
                        window.removeEventListener('touchend', onUp);
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('touchmove', onMove);
                    };

                    confirmBtn.onclick = () => {
                        playClick();
                        const selected = hsvToHex(hue / 360, sat, val);
                        cleanUp();
                        overlay.remove();
                        resolve(selected);
                    };

                    updateUI(true);
                });
            }
            await entertext("最初から、始めましょう。");
            const PlayerName = await inputtext("start", 610, 475, 100, 100, 30, 10);
            await systems.sleep(100);
            await entertext(PlayerName + "。いい名前ですね。");
            await entertext("では次に、メインカラーを指定しましょう。");
            const PlayerColor = await createColorPickerDOM(document.getElementById("stage"), 610, 475);
            await entertext("メインカラーは" + PlayerColor + "ですね。");
            savedata = {
                Progress: [
                    0,
                    0,
                    0,
                    0
                ],
                maincolor: PlayerColor,
                number: 5,
                name: PlayerName,
                start: {
                    game: true,
                    Story: false
                }
            }
            await entertext("ゲームを開始します。グットラック。");
        }
        const audio = new Audio('./game/music/menu.mp3');
        if (!savedata.config) savedata.config = { bgm: 100, se: 100 };
        audio.volume = savedata.config.bgm / 100;
        audio.loop = true;
        audio.play();
        const back2 = colorbackground("#404040");
        let booltime = false;
        const wind = Creation.create("wind" + Date.now(), "gui", { typeValue: { dot: "10px", data: [] } }, "newcreate");
        const particles = Array.from({ length: 200 }, () => ({
            x: Math.random() * wind.gui.maxWidth,
            y: Math.random() * wind.gui.maxHeight,
            vx: 1 + Math.random() * 3,
            vy: -1 + Math.random() * 2,
            color: `rgba(${Math.random() * 255 | 0}, ${Math.random() * 200 | 0}, 255, 1)`,
            size: 5 + Math.random() * 5
        }));

        function animateWind() {
            if (!booltime) {
                const canvas = wind.html;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, wind.gui.maxWidth, wind.gui.maxHeight);

                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;

                    if (p.x > wind.gui.maxWidth) p.x = 0;
                    if (p.x < 0) p.x = wind.gui.maxWidth;
                    if (p.y > wind.gui.maxHeight) p.y = 0;
                    if (p.y < 0) p.y = wind.gui.maxHeight;

                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                });

                if (!booltime) requestAnimationFrame(animateWind);
            }
        }
        animateWind();
        const wind2 = Creation.create("wind2" + Date.now(), "gui", { typeValue: { dot: "10px", data: [] } }, "newcreate");

        const dotSize = 10;
        const ROWS = Math.floor(wind2.gui.maxHeight / dotSize);
        const COLS = Math.floor(wind2.gui.maxWidth / dotSize);

        wind2.gui.typeValue.data = Array.from({ length: ROWS }, () => Array(COLS).fill('rgba(0,0,0,0)'));

        const bands = [];
        for (let i = 0; i < 5; i++) {
            bands.push({
                x: Math.random() * COLS,
                y: Math.random() * (ROWS - 20),
                speed: 5 + Math.random() * 5,
                thickness: 8 + Math.random() * 8,
                length: 150 + Math.random() * 50,
                color: [0, 200, 255]
            });
        }

        function animateWind2() {
            if (!booltime) {
                const data = Array.from({ length: ROWS }, () => Array(COLS).fill('rgba(0,0,0,0)'));
                bands.forEach(band => {
                    const startX = Math.floor(band.x);

                    for (let i = 0; i < band.length; i++) {
                        const drawX = (startX + i) % COLS;

                        const alpha = 1 - i / band.length;
                        const taper = Math.floor(band.thickness * Math.sin((Math.PI * (band.length - i)) / (2 * band.length)));

                        for (let dy = 0; dy < taper; dy++) {
                            const drawY = Math.floor(band.y + dy);
                            if (drawY >= 0 && drawY < ROWS) {
                                data[drawY][drawX] = `rgba(${band.color[0]}, ${band.color[1]}, ${band.color[2]}, ${alpha})`;
                            }
                        }
                    }

                    band.x += band.speed;
                    if (band.x > COLS) band.x = -band.length;
                });

                wind2.gui.typeValue.data = data;
                wind2.canvas();
                requestAnimationFrame(animateWind2);
            }
        }
        animateWind2();

        const push = await createMainMenuDOM();



        booltime = true;
        wind.remove();
        wind2.remove();
        audio.pause();
        audio.currentTime = 0;
        switch (push) {
            case "Story Mode":
                back2.delete();
                storymode();
                break;
            case "Setting":
                back2.delete();
                Setting();
                break;
        }
    }

    async function createMainMenuDOM() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; inset: 0; background: #000; z-index: 1000;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'DotJP', sans-serif; opacity: 0; transition: opacity 0.5s;
                overflow: hidden;
            `;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.style.opacity = '1');

            const bg = document.createElement('div');
            bg.style.cssText = `
                position: absolute; inset: -50%; width: 200%; height: 200%;
                background-image: 
                    radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0));
                background-size: 200px 200px;
                animation: rotateBg 60s linear infinite;
                opacity: 0.5;
            `;
            const style = document.createElement('style');
            style.innerHTML = `@keyframes rotateBg { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
            overlay.appendChild(bg);

            const title = document.createElement('h1');
            title.textContent = "GRAPHINY";
            title.style.cssText = `
                font-size: 120px; color: #fff; margin-bottom: 60px; z-index: 1;
                text-shadow: 0 0 20px #fff, 4px 4px 0 #000; letter-spacing: 10px;
            `;
            overlay.appendChild(title);

            const options = [
                { label: "STORY MODE", value: "Story Mode" },
                { label: "SETTINGS", value: "Setting" }
            ];

            const menuContainer = document.createElement('div');
            menuContainer.style.cssText = "display: flex; flex-direction: column; gap: 20px; z-index: 1; min-width: 400px;";
            overlay.appendChild(menuContainer);

            options.forEach(opt => {
                const btn = document.createElement('div');
                btn.textContent = opt.label;
                btn.style.cssText = `
                    padding: 15px 30px; border: 2px solid #666; background: rgba(0,0,0,0.8);
                    color: #aaa; text-align: center; font-size: 24px; cursor: pointer;
                    transition: all 0.2s; position: relative; overflow: hidden;
                `;

                btn.onmouseenter = () => {
                    btn.style.borderColor = "#fff";
                    btn.style.color = "#fff";
                    btn.style.background = "rgba(255,255,255,0.1)";
                    btn.style.boxShadow = "0 0 15px rgba(255,255,255,0.5)";
                    btn.style.transform = "scale(1.05)";
                };
                btn.onmouseleave = () => {
                    btn.style.borderColor = "#666";
                    btn.style.color = "#aaa";
                    btn.style.background = "rgba(0,0,0,0.8)";
                    btn.style.boxShadow = "none";
                    btn.style.transform = "scale(1.0)";
                };
                btn.onclick = () => {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        style.remove();
                        resolve(opt.value);
                    }, 500);
                };

                menuContainer.appendChild(btn);
            });

            const grid = document.createElement('div');
            grid.style.cssText = `
                position: absolute; bottom: 0; left: 0; width: 100%; height: 300px;
                background: linear-gradient(to top, rgba(0,100,255,0.2) 1px, transparent 1px);
                background-size: 100% 40px;
                transform: perspective(500px) rotateX(60deg);
                transform-origin: bottom;
                pointer-events: none;
            `;
            overlay.appendChild(grid);
        });
    }

    async function createStageSelectDOM(parentElement, progress) {
        return new Promise(resolve => {
            const pixelFont = 'DotJP';

            const overlay = document.createElement('div');
            overlay.style.cssText = `
position: fixed; inset: 0; background: #000;
z-index: 2000; display: flex; flex-direction: column;
font-family: ${pixelFont}; color: #fff;
image-rendering: pixelated;
opacity: 0; transition: opacity 0.3s;
`;
            parentElement.appendChild(overlay);
            requestAnimationFrame(() => overlay.style.opacity = '1');

            // Add Amazing Background
            addbg(overlay);

            const header = document.createElement('div');
            header.style.cssText = `
height: 80px; background: #000;
border-bottom: 4px solid #fff;
display: flex; align-items: center; justify-content: center;
gap: 20px; z-index: 10;
`;
            overlay.appendChild(header);

            const worlds = [
                { id: 0, name: "RED", color: "#ff2222", bg: "#400" },
            ];

            let activeWorld = 0;
            let currentScroll = 0;

            const contentArea = document.createElement('div');
            contentArea.style.cssText = `
flex: 1; position: relative; overflow: hidden; background: #111;
cursor: grab;
`;
            overlay.appendChild(contentArea);

            let isDown = false;
            let startX, scrollLeft;
            contentArea.addEventListener('mousedown', (e) => {
                isDown = true;
                contentArea.style.cursor = 'grabbing';
                startX = e.pageX - contentArea.offsetLeft;
                scrollLeft = contentArea.scrollLeft;
            });
            contentArea.addEventListener('mouseleave', () => { isDown = false; contentArea.style.cursor = 'grab'; });
            contentArea.addEventListener('mouseup', () => { isDown = false; contentArea.style.cursor = 'grab'; });
            contentArea.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - contentArea.offsetLeft;
                const walk = (x - startX) * 2;
                contentArea.scrollLeft = scrollLeft - walk;
            });

            const mapContainer = document.createElement('div');
            mapContainer.style.cssText = `
height: 100%; display: flex; align-items: center;
padding: 0 100px;
position: relative;
min-width: 100%;
transition: transform 0.5s cubic-bezier(0.1, 0.7, 1.0, 0.1);
`;
            mapContainer.innerHTML = `
    <div style="
position: absolute; inset: 0; pointer-events: none;
background-image:
linear-gradient(#222 4px, transparent 4px),
    linear-gradient(90deg, #222 4px, transparent 4px);
background-size: 80px 80px; opacity: 0.5;
"></div>
    `;
            contentArea.appendChild(mapContainer);

            function renderMap(worldId) {
                while (mapContainer.children.length > 1) {
                    mapContainer.removeChild(mapContainer.lastChild);
                }

                const worldInfo = worlds[worldId];
                const count = progress[worldId] || 0;

                const stageList = WORLD_CONFIG[worldId] || [];

                mapContainer.style.backgroundColor = worldInfo.bg;

                if (stageList.length === 0) {
                    const lockMsg = document.createElement('div');
                    lockMsg.textContent = "LOCKED AREA";
                    lockMsg.style.cssText = `
                        position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                        font-size: 40px; color: #888; text-shadow: 4px 4px #000;
                    `;
                    mapContainer.appendChild(lockMsg);
                    return;
                }

                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; `;

                const spacingX = 350;
                const amplitudeY = 250;
                const mapHeight = 500;

                const totalWidth = 400 + (stageList.length * spacingX);
                mapContainer.style.width = `${totalWidth}px`;
                svg.setAttribute("width", totalWidth);

                let prevX = -1, prevY = -1;

                stageList.forEach((stage, i) => {
                    const x = 200 + i * spacingX;
                    const yOffset = Math.sin(i * 1.5) * amplitudeY;
                    const y = (mapHeight / 2) + yOffset;

                    const isCleared = i < count;
                    const isCurrent = i === count;
                    const isLocked = i > count;
                    const isAccessible = !isLocked;

                    if (prevX !== -1) {
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute("x1", prevX);
                        line.setAttribute("y1", prevY);
                        line.setAttribute("x2", x);
                        line.setAttribute("y2", y);
                        const lineColor = isAccessible ? worldInfo.color : "#444";
                        line.setAttribute("stroke", lineColor);
                        line.setAttribute("stroke-width", "8");
                        line.setAttribute("stroke-dasharray", isAccessible ? "none" : "20,10");
                        svg.appendChild(line);
                    }
                    prevX = x; prevY = y;

                    const node = document.createElement('div');

                    let shapeCSS = "";
                    let innerHTML = "";

                    if (stage.type === 'battle' || stage.type.startsWith('mov_pre')) {
                        shapeCSS = `
                            width: 120px; height: 120px;
                            transform: rotate(45deg);
                            background: ${isLocked ? '#222' : worldInfo.color};
                            border: 6px solid ${isCurrent ? '#fff' : '#444'};
                            box-shadow: ${isCurrent ? '0 0 25px #fff' : '8px 8px 0px #000'};
                        `;
                        const labelText = stage.type === 'battle' ? stage.level : "BOSS";
                        innerHTML = `<div style="transform: rotate(-45deg);">${labelText}</div>`;
                    } else {
                        shapeCSS = `
                            width: 100px; height: 100px;
                            border-radius: 50%;
                            background: ${isLocked ? '#222' : '#ffff00'};
                            color: ${isLocked ? '#fff' : '#000'};
                            border: 6px solid ${isCurrent ? '#fff' : '#444'};
                            box-shadow: ${isCurrent ? '0 0 25px #fff' : 'none'};
                        `;
                        innerHTML = `<div>!</div>`;
                    }

                    node.style.cssText = `
                        position: absolute; left: ${x}px; top: ${y}px;
                        transform-origin: center;
                        
                        margin-left: -50px; margin-top: -50px; 
                        display: flex; align-items: center; justify-content: center;
                        font-size: 32px; font-weight: bold;
                        cursor: ${isAccessible ? 'pointer' : 'not-allowed'};
                        opacity: ${isLocked ? 0.5 : 1};
                        z-index: 2;
                        transition: transform 0.2s;
                        ${shapeCSS}
                    `;
                    node.innerHTML = innerHTML;

                    if (isAccessible) {
                        node.onmouseenter = () => {
                            node.style.transform = (stage.type === 'battle' || stage.type.startsWith('mov'))
                                ? "rotate(45deg) scale(1.1)"
                                : "scale(1.1)";
                            playHover();
                        };
                        node.onmouseleave = () => {
                            node.style.transform = (stage.type === 'battle' || stage.type.startsWith('mov'))
                                ? "rotate(45deg) scale(1.0)"
                                : "scale(1.0)";
                        };
                        node.onclick = () => {
                            playClick();
                            closeUI({ ...stage, tabId: worldId });
                        };
                    }
                    mapContainer.appendChild(node);

                    if (stage.label) {
                        const labelNode = document.createElement('div');
                        labelNode.textContent = stage.label;
                        labelNode.style.cssText = `
                            position: absolute; left: ${x}px; top: ${y + 80}px;
                            transform: translateX(-50%);
                            background: #000; border: 2px solid #fff;
                            padding: 4px 8px; font-size: 16px;
                            opacity: ${isLocked ? 0.5 : 1};
                        `;
                        mapContainer.appendChild(labelNode);
                    }
                });

                mapContainer.appendChild(svg);

                const targetX = 200 + count * spacingX;
                setTimeout(() => {
                    contentArea.scrollLeft = targetX - contentArea.offsetWidth / 2;
                }, 10);
            }

            worlds.forEach((w, idx) => {
                let isUnlocked = true;
                if (idx > 0) {
                    const prevProgress = progress[idx - 1] || 0;
                    if (prevProgress < 11) isUnlocked = false;
                }

                const tab = document.createElement('div');
                tab.textContent = isUnlocked ? w.name : "LOCKED";

                const isActive = (idx === activeWorld);

                tab.style.cssText = `
padding: 10px 20px; cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
background: ${w.color}; border: 4px solid #fff;
box-shadow: inset -4px -4px 0 rgba(0, 0, 0, 0.5);
font-weight: bold; font-size: 20px;
text-shadow: 2px 2px #000;
opacity: ${isActive ? 1 : (isUnlocked ? 0.5 : 0.2)};
transform: ${isActive ? "translateY(4px)" : "none"};
filter: ${isUnlocked ? 'none' : 'grayscale(100%)'};
transition: transform 0.2s, opacity 0.2s;
`;

                if (isUnlocked) {
                    tab.onclick = () => {
                        activeWorld = idx;
                        Array.from(header.children).forEach((child, i) => {
                            let childUnlocked = true;
                            if (i > 0) {
                                const p = progress[i - 1] || 0;
                                if (p < 11) childUnlocked = false;
                            }

                            child.style.opacity = (i === idx) ? 1 : (childUnlocked ? 0.5 : 0.2);
                            child.style.transform = (i === idx) ? "translateY(4px)" : "none";
                        });
                        renderMap(idx);
                        playClick();
                    };
                    tab.onmouseenter = () => playHover();
                }
                header.appendChild(tab);
            });

            renderMap(0);

            const footer = document.createElement('div');
            footer.style.cssText = `
height: 60px; background: #000;
border-top: 4px solid #fff;
display: flex; align-items: center; padding: 0 20px; justify-content: space-between;
z-index: 10;
`;
            overlay.appendChild(footer);

            function createBtn(text, action) {
                const btn = document.createElement('button');
                btn.textContent = text;
                btn.style.cssText = `
background: #222; color: #fff; border: 4px solid #fff;
padding: 8px 16px; font-family: 'DotJP', sans-serif; font-size: 16px;
cursor: pointer; box-shadow: 4px 4px 0 #000;
`;
                btn.onactive = () => btn.style.transform = "translate(2px, 2px)";
                btn.onclick = () => {
                    if (action === "back") closeUI({ type: "quit" });
                    if (action === "story") closeUI({ type: "story" });
                    if (action === "tutorial") closeUI({ type: "tutorial" });
                };
                return btn;
            }

            footer.appendChild(createBtn("<< BACK", "back"));
            const rightGroup = document.createElement('div');
            rightGroup.style.gap = "10px"; rightGroup.style.display = "flex";
            rightGroup.appendChild(createBtn("MOVIE", "story"));
            rightGroup.appendChild(createBtn("TUTORIAL", "tutorial"));
            footer.appendChild(rightGroup);

            function closeUI(result) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 10);
            }
        });
    }

    const WORLD_CONFIG = [
        [
            { type: "battle", level: 1 },
            { type: "battle", level: 2 },
            { type: "event", id: "ev_god_save", label: "Warning" },
            { type: "battle", level: 3 },
            { type: "event", id: "ev_trial_limit", label: "Trial" },
            { type: "battle", level: 4 },
            { type: "event", id: "ev_sign_red", label: "Sign" },
            { type: "battle", level: 5 },
            { type: "battle", level: 6 },
            { type: "event", id: "ev_red_1", label: "Glitch" },
            { type: "battle", level: 7, pre: "pre_red", post: "post_red" },
            { type: "event", id: "ev_red_2", label: "Log" }
        ],
    ];



    async function moviegallery() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000;
                display: flex; flex-direction: column; align-items: center; padding: 50px; overflow-y: auto;
                font-family: 'DotJP', sans-serif; color: white;
            `;
            document.body.appendChild(overlay);

            const title = document.createElement('h1');
            title.textContent = "MOVIE GALLERY";
            overlay.appendChild(title);

            const grid = document.createElement('div');
            grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; width: 100%; max-width: 1000px; margin-top: 30px;';
            overlay.appendChild(grid);

            function createMovieBtn(label, action) {
                const btn = document.createElement('div');
                btn.textContent = label;
                btn.style.cssText = `
                    background: #333; padding: 20px; text-align: center; cursor: pointer;
                    border: 1px solid #555; transition: all 0.2s;
                `;
                btn.onmouseenter = () => btn.style.background = '#555';
                btn.onmouseleave = () => btn.style.background = '#333';
                btn.onclick = async () => {
                    await action();
                };
                return btn;
            }


            grid.appendChild(createMovieBtn("Opening", async () => { await storymovie(); }));
            grid.appendChild(createMovieBtn("Tutorial", async () => { await tutorial(); }));


            grid.appendChild(createMovieBtn("God Intro", async () => { await godintromovie(); }));
            grid.appendChild(createMovieBtn("God Mid", async () => { await godmidmovie(); }));
            grid.appendChild(createMovieBtn("Ending", async () => { await endingmovie(); }));

            const closeBtn = document.createElement('div');
            closeBtn.textContent = "CLOSE";
            closeBtn.style.cssText = 'margin-top: 30px; padding: 10px 40px; border: 2px solid white; cursor: pointer;';
            closeBtn.onclick = () => {
                overlay.remove();
                resolve();
            };
            overlay.appendChild(closeBtn);
        });
    }

    async function Setting() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.9);
                z-index: 20000; display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'DotJP', sans-serif; color: white; opacity: 0; transition: opacity 0.3s;
            `;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.style.opacity = '1');

            const container = document.createElement('div');
            container.style.cssText = `
                width: 500px; padding: 40px; border: 4px solid #fff;
                background: #000; display: flex; flex-direction: column; gap: 30px;
                box-shadow: 0 0 50px rgba(0,0,0,0.5);
            `;
            overlay.appendChild(container);

            const title = document.createElement('h2');
            title.textContent = "SETTINGS";
            title.style.cssText = "font-size: 32px; text-align: center; margin-bottom: 20px; text-shadow: 2px 2px #444;";
            container.appendChild(title);

            const createSlider = (label, key) => {
                const group = document.createElement('div');
                group.style.display = 'flex'; group.style.flexDirection = 'column'; group.style.gap = '10px';

                const labelDiv = document.createElement('div');
                labelDiv.style.display = 'flex'; labelDiv.style.justifyContent = 'space-between';
                labelDiv.innerHTML = `<span>${label}</span><span id="val-${key}">${savedata.config[key]}%</span>`;
                group.appendChild(labelDiv);

                const slider = document.createElement('input');
                slider.type = 'range'; slider.min = 0; slider.max = 100; slider.value = savedata.config[key];
                slider.style.cssText = `
                    width: 100%; cursor: pointer; height: 10px; background: #333;
                    appearance: none; outline: none; border: 1px solid #666;
                `;
                slider.oninput = (e) => {
                    const v = e.target.value;
                    savedata.config[key] = parseInt(v);
                    document.getElementById(`val-${key}`).textContent = `${v}%`;
                };
                group.appendChild(slider);
                container.appendChild(group);
            };

            createSlider("BGM VOLUME", "bgm");
            createSlider("SE VOLUME", "se");

            const btnGroup = document.createElement('div');
            btnGroup.style.cssText = "display: flex; gap: 20px; margin-top: 20px;";
            container.appendChild(btnGroup);

            const backBtn = document.createElement('button');
            backBtn.textContent = "BACK";
            backBtn.style.cssText = `
                flex: 1; padding: 15px; background: #333; color: white; border: 2px solid white;
                font-family: inherit; font-size: 18px; cursor: pointer; transition: all 0.2s;
            `;
            backBtn.onmouseover = () => { backBtn.style.background = '#fff'; backBtn.style.color = '#000'; };
            backBtn.onmouseout = () => { backBtn.style.background = '#333'; backBtn.style.color = '#fff'; };
            backBtn.onclick = () => {
                soundeffect("./game/music/button.mp3");
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 300);
            };
            btnGroup.appendChild(backBtn);
        });
    }

    async function storymode() {
        let loop = true;
        if (!savedata.start.Story) {
            await storymovie();
            await tutorial();
            savedata.start.Story = true;
        }
        while (loop) {
            try {
                const result = await createStageSelectDOM(document.getElementById("stage") || document.body, savedata.Progress);
                const bgContext = { Stagenumber: result.tabId !== undefined ? result.tabId : 0, isBoss: false, lastboss: false };

                if (result.type === "quit") {
                    datasave();
                    init();
                    loop = false;
                } else if (result.type === "story") {
                    await moviegallery();
                } else if (result.type === "tutorial") {
                    await tutorial();
                } else if (result.type.startsWith("mov_")) {
                    const movieId = result.type.replace("mov_", "");
                    const movieLines = getmoviedata(movieId, savedata.name);

                    if (movieLines && movieLines.length > 0) {
                        await visualnoveldialogue(movieLines, bgContext);
                    } else {
                        await visualnoveldialogue([
                            { text: `[Movie: ${movieId} placeholder]`, speaker: "none" }
                        ]);
                    }

                    const config = WORLD_CONFIG[result.tabId];
                    const index = config.findIndex(s => s.type === result.type);
                    if (index !== -1 && savedata.Progress[result.tabId] === index) {
                        savedata.Progress[result.tabId]++;
                        datasave();
                    }

                    if (result.type === "mov_post_black") {
                        await godintromovie();
                        const phase1Result = await battle(async () => {
                            await bullethells(46, "rgba(255,0,0,1)");
                        }, 3, 7, true, true);

                        if (phase1Result === "SCRIPTED_LOSS" || phase1Result === "GOD_EVENT") {
                            await godmidmovie();
                            const win = await battle(async () => {
                                await bullethells(43, "rgba(255,255,255,1)");
                            }, 3, 7, true, false);

                            if (win) {
                                await endingmovie();
                                init();
                                loop = false;
                            }
                        }
                    }

                } else if (result.type === "event") {
                    const eventId = result.id;
                    if (eventId === "ev_mem_bastard") {
                        await visualnoveldialogue([
                            { text: "...", speaker: "left", emotion: "neutral", name: savedata.name },
                            { text: "ここは…懐かしいな。", speaker: "left", emotion: "sad" },
                            { text: "覚えているか？ここで過ごした日々を…", speaker: "right", name: "???" },
                            { text: "誰だ！？", speaker: "left", emotion: "angry" },
                            { text: "数年前…俺は…事故で大罪を犯した。システムのエラーが原因だった。", speaker: "right", name: "記憶" },
                            { text: "世間からは…「この1000年間の間現れたことのない極悪人」と罵られた。", speaker: "right", name: "記憶" },
                            { text: "他人が作ったシステムを移植する作業だった。移植したとたん、生命維持システムが壊れた。", speaker: "right", name: "記憶" },
                            { text: "南半球は人が増え続け、酸素すら足りない状況になっていた。だから、生命維持システムを政府は導入した。", speaker: "right", name: "記憶" },
                            { text: "その生命維持システムが壊れたんだ。", speaker: "right", name: "記憶" },
                            { text: "...", speaker: "left", emotion: "sad" }

                        ], bgContext);
                    } else if (eventId === "ev_black_2") {

                    } else if (eventId === "ev_red_1") {
                        await visualnoveldialogue([
                            { text: "レッド「書類仕事めんどくせー…上司に怒られる…」", speaker: "right", name: "Red" },
                            { text: "「心の声漏れてるぞ…というか、神、こいつらとは戦わなくていいのか…?」", speaker: "left", name: savedata.name },
                            { text: "「あー…うん。まぁ…いんじゃね?」", speaker: "left", name: "神" },
                            { text: "レッド「暇だなー…あっやべ昼休憩終わってる!」", speaker: "right", name: "Red" },
                            { text: "「進むか…」", speaker: "left", emotion: "smile" }
                        ], bgContext);
                    } else if (eventId === "ev_red_2") {
                        await visualnoveldialogue([
                            { text: "レッド1「あれ、なんだっけ。あの…その…それ。(?)」", speaker: "right", name: "Red Security" },
                            { text: "「どれだ…(???)」", speaker: "left", emotion: "sad" },
                            { text: "レッド2「それだよそれ…あの…それ。(?????)」", speaker: "right", name: "Red Security" },
                            { text: "「(？の数が2n-1…)」", speaker: "left", emotion: "sad" }
                        ], bgContext);
                    } else if (eventId.startsWith("ev_sign")) {
                        let text = "古びた看板がある。誰かの落書きが残っている…";
                        let sub = "『ここに落書きを書いたやつは処刑』";
                        if (eventId.includes("red")) {
                            text = "看板：【灼熱地帯】";
                            sub = "落書き：『サウナ故障中。代わりにここで整え』…命が整って消えちまうよ。";
                        }
                        if (eventId.includes("green")) {
                            text = "看板：【忘却の森】";
                            sub = "落書き：『木の葉を隠すなら森の中、へそくり隠すならタンスの中』…なるほど。";
                        }
                        if (eventId.includes("blue")) {
                            text = "看板：【深海エリア】";
                            sub = "落書き：『電脳の海で溺れても、誰も助けてくれない。いいね！ボタンだけが遺影になる』…皮肉が効いているな。";
                        }
                        if (eventId.includes("black")) {
                            text = "看板：【ＥＲＲＯＲ】";
                            sub = "落書き：なし。…いや、文字が恐怖で逃げ出したみたいに空白だ。";
                        }

                        await visualnoveldialogue([
                            { text: text, speaker: "none" },
                            { text: sub, speaker: "left", emotion: "neutral", name: savedata.name }
                        ], bgContext);
                    } else if (eventId === "ev_god_save") {
                        await visualnoveldialogue([
                            { text: "神: 『やあ、調子はどうかな？』", speaker: "none" },
                            { text: "「神か？また説教か？」", speaker: "left", emotion: "neutral" },
                            { text: "神: 『いや、体験版はあと1ステージしかないよってことを伝えに来ただけさ。』", speaker: "none" }

                        ], bgContext);
                    } else if (eventId === "ev_god_blue") {
                        await visualnoveldialogue([
                            { text: "神: 『ここ暗いねー。足元見えてる？』", speaker: "none" },
                            { text: "「お陰様で真っ暗だ。明かりくらいないのか。」", speaker: "left", emotion: "angry" },
                            { text: "神: 『心の目で見るんだ。…まあ、単に背景素材の設定ミスかもしれないけどな！ガハハ！』", speaker: "none" },
                            { text: "「(殴りたい…この神…)」", speaker: "left", emotion: "angry" }
                        ], bgContext);
                    } else if (eventId === "ev_trial_limit") {
                        await visualnoveldialogue([
                            { text: "神: 『と、いう訳で体験版はここまでだ。』", speaker: "none" }
                        ], bgContext);

                        const password = await new Promise(resolve => {
                            const overlay = document.createElement('div');
                            overlay.style.cssText = `
                                position: absolute; 
                                inset: 0; 
                                background: radial-gradient(circle at 50% 50%, rgba(0,0,50,0.95), rgba(0,0,0,0.98));
                                z-index: 5000; 
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                justify-content: center;
                                font-family: 'DotJP', sans-serif; 
                                opacity: 0; 
                                transition: opacity 0.5s;
                                width: 1200px;
                                height: 700px;
                            `;
                            document.getElementById('stage').appendChild(overlay);
                            requestAnimationFrame(() => overlay.style.opacity = '1');

                            const starfield = document.createElement('div');
                            starfield.style.cssText = `
                                position: absolute; inset: 0; overflow: hidden; opacity: 0.3;
                            `;
                            for (let i = 0; i < 100; i++) {
                                const star = document.createElement('div');
                                star.style.cssText = `
                                    position: absolute;
                                    width: ${Math.random() * 3}px;
                                    height: ${Math.random() * 3}px;
                                    background: white;
                                    border-radius: 50%;
                                    left: ${Math.random() * 100}%;
                                    top: ${Math.random() * 100}%;
                                    animation: twinkle ${2 + Math.random() * 3}s infinite;
                                `;
                                starfield.appendChild(star);
                            }
                            overlay.appendChild(starfield);

                            const style = document.createElement('style');
                            style.innerHTML = `
                                @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
                                @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(0,255,255,0.5); } 50% { box-shadow: 0 0 40px rgba(0,255,255,0.8); } }
                                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
                            `;
                            document.head.appendChild(style);

                            const container = document.createElement('div');
                            container.style.cssText = `
                                background: linear-gradient(135deg, rgba(20,20,60,0.9), rgba(10,10,30,0.9));
                                border: 3px solid rgba(0,255,255,0.6);
                                border-radius: 20px;
                                padding: 40px;
                                width: 800px;
                                box-shadow: 0 0 50px rgba(0,255,255,0.3), inset 0 0 30px rgba(0,100,200,0.2);
                                animation: float 3s ease-in-out infinite;
                                position: relative;
                            `;
                            overlay.appendChild(container);

                            const title = document.createElement('h1');
                            title.textContent = '体験版終了';
                            title.style.cssText = `
                                color: #0ff; font-size: 42px; margin-bottom: 25px; text-align: center;
                                text-shadow: 0 0 20px rgba(0,255,255,0.8), 0 0 40px rgba(0,255,255,0.5);
                                letter-spacing: 5px;
                            `;
                            container.appendChild(title);

                            const message = document.createElement('div');
                            message.textContent = '続きを遊びたかったら、Discordサーバーに入ってみてください!';
                            message.style.cssText = `
                                color: #fff; font-size: 22px; margin-bottom: 25px; text-align: center;
                                text-shadow: 0 2px 10px rgba(0,0,0,0.8); line-height: 1.6;
                            `;
                            container.appendChild(message);

                            const discordLink = document.createElement('a');
                            discordLink.textContent = 'https://discord.gg/b7CBEu9k';
                            discordLink.href = 'https://discord.gg/b7CBEu9k';
                            discordLink.target = '_blank';
                            discordLink.style.cssText = `
                                display: block; color: #5865F2; font-size: 26px; margin-bottom: 35px;
                                text-align: center; text-decoration: none; padding: 16px;
                                background: rgba(88,101,242,0.1); border-radius: 10px;
                                border: 2px solid #5865F2; transition: all 0.3s;
                                text-shadow: 0 0 10px rgba(88,101,242,0.5);
                            `;
                            discordLink.onmouseenter = () => {
                                discordLink.style.background = 'rgba(88,101,242,0.3)';
                                discordLink.style.boxShadow = '0 0 20px rgba(88,101,242,0.8)';
                                discordLink.style.transform = 'scale(1.05)';
                            };
                            discordLink.onmouseleave = () => {
                                discordLink.style.background = 'rgba(88,101,242,0.1)';
                                discordLink.style.boxShadow = 'none';
                                discordLink.style.transform = 'scale(1.0)';
                            };
                            container.appendChild(discordLink);

                            const hint = document.createElement('div');
                            hint.textContent = '(入ったらもっと遊べるかも…?)';
                            hint.style.cssText = `
                                color: #aaa; font-size: 18px; margin-bottom: 30px; text-align: center;
                                font-style: italic;
                            `;
                            container.appendChild(hint);

                            const passwordLabel = document.createElement('div');
                            passwordLabel.textContent = 'パスワードを入力してください';
                            passwordLabel.style.cssText = `
                                color: #ffff00; font-size: 24px; margin-bottom: 18px; text-align: center;
                                text-shadow: 0 0 15px rgba(255,255,0,0.6);
                            `;
                            container.appendChild(passwordLabel);

                            const inputBox = document.createElement('input');
                            inputBox.type = 'text';
                            inputBox.placeholder = 'パスワード入力...';
                            inputBox.style.cssText = `
                                width: 100%; font-size: 22px; padding: 14px; margin-bottom: 25px;
                                background: rgba(0,0,0,0.5); border: 2px solid #0ff;
                                border-radius: 10px; color: #0ff; text-align: center;
                                font-family: 'DotJP', monospace; outline: none;
                                animation: glow 2s infinite;
                                box-shadow: inset 0 0 10px rgba(0,255,255,0.2);
                            `;
                            inputBox.addEventListener('focus', () => {
                                inputBox.style.borderColor = '#ffff00';
                                inputBox.style.boxShadow = '0 0 25px rgba(255,255,0,0.5), inset 0 0 10px rgba(255,255,0,0.2)';
                            });
                            inputBox.addEventListener('blur', () => {
                                inputBox.style.borderColor = '#0ff';
                                inputBox.style.boxShadow = 'inset 0 0 10px rgba(0,255,255,0.2)';
                            });
                            container.appendChild(inputBox);

                            const buttonContainer = document.createElement('div');
                            buttonContainer.style.cssText = 'display: flex; gap: 20px; justify-content: center;';
                            container.appendChild(buttonContainer);

                            function createButton(text, isPrimary) {
                                const btn = document.createElement('button');
                                btn.textContent = text;
                                btn.style.cssText = `
                                    padding: 15px 40px; font-size: 20px; font-family: 'DotJP', sans-serif;
                                    background: ${isPrimary ? 'linear-gradient(135deg, #00ffff, #0088ff)' : 'rgba(100,100,100,0.5)'};
                                    color: ${isPrimary ? '#000' : '#fff'}; border: 3px solid ${isPrimary ? '#0ff' : '#666'};
                                    border-radius: 10px; cursor: pointer; transition: all 0.3s;
                                    font-weight: bold; text-shadow: ${isPrimary ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'};
                                    box-shadow: ${isPrimary ? '0 0 20px rgba(0,255,255,0.5)' : 'none'};
                                `;
                                btn.onmouseenter = () => {
                                    btn.style.transform = 'scale(1.1)';
                                    btn.style.boxShadow = `0 0 30px ${isPrimary ? 'rgba(0,255,255,0.8)' : 'rgba(255,255,255,0.5)'}`;
                                };
                                btn.onmouseleave = () => {
                                    btn.style.transform = 'scale(1.0)';
                                    btn.style.boxShadow = isPrimary ? '0 0 20px rgba(0,255,255,0.5)' : 'none';
                                };
                                return btn;
                            }

                            const submitBtn = createButton('確認', true);
                            const skipBtn = createButton('スキップ', false);

                            function cleanup(result) {
                                overlay.style.opacity = '0';
                                setTimeout(() => {
                                    overlay.remove();
                                    style.remove();
                                    resolve(result);
                                }, 500);
                            }

                            submitBtn.onclick = () => cleanup(inputBox.value);
                            skipBtn.onclick = () => cleanup('');
                            inputBox.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter') cleanup(inputBox.value);
                            });

                            buttonContainer.appendChild(submitBtn);
                            buttonContainer.appendChild(skipBtn);

                            setTimeout(() => inputBox.focus(), 600);
                        });

                        if (password === "onikutabetai") {
                            //いやーんなんで見てるのよ
                            savedata.trialUnlocked = true;
                            await visualnoveldialogue([
                                { text: "神: 『正解だ！では、先に進もう。』", speaker: "none" }
                            ], bgContext);
                        } else {
                            await visualnoveldialogue([
                                { text: "神: 『残念。体験版はここまでだ。またのお越しを！』", speaker: "none" }
                            ], bgContext);
                            datasave();
                            init();
                            return;
                        }
                    } else {
                        await visualnoveldialogue([
                            { text: "謎の声: 『…』", speaker: "none" }
                        ], bgContext);
                    }

                    if (eventId !== "ev_trial_limit") {
                        const config = WORLD_CONFIG[result.tabId];
                        const index = config.findIndex(s => s.type === result.type && s.id === result.id);
                        if (index !== -1 && savedata.Progress[result.tabId] === index) {
                            savedata.Progress[result.tabId]++;
                            datasave();
                        }
                    }

                } else if (result.type === "battle") {
                    const StageNum = result.tabId;
                    const StageLevel = result.level;
                    console.log(result)

                    const config = WORLD_CONFIG[StageNum];
                    const node = config.find(s => s.type === "battle" && s.level === StageLevel);
                    const preMovie = node ? node.pre : null;
                    const postMovie = node ? node.post : null;

                    let iswin;
                    do {
                        window.battleActive = true;
                        iswin = await battle(async () => {
                            if (StageLevel === 7) {
                                const BasePatternIndex = [31, 34, 37, 40][StageNum];
                                await bullethells(BasePatternIndex, `rgba(${StageNum == 0 ? 255 : 0}, ${StageNum == 1 ? 255 : 0}, ${StageNum == 2 ? 255 : 0})`);
                            } else {
                                const patternId = (StageNum * 10) + (StageLevel - 1);
                                await bullethells(patternId % 68, `rgba(${StageNum == 0 ? 255 : 0}, ${StageNum == 1 ? 255 : 0}, ${StageNum == 2 ? 255 : 0})`);
                            }
                        }, StageNum, StageLevel, false, false, preMovie, postMovie);
                        window.battleActive = false;

                        if (iswin === 'backtitle') {
                            init();
                            loop = false;
                            return;
                        }
                    } while (iswin === 'continue');
                    if (iswin === true) {
                        const config = WORLD_CONFIG[StageNum];
                        const index = config.findIndex(s => s.type === "battle" && s.level === StageLevel);
                        if (index !== -1 && savedata.Progress[StageNum] === index) {
                            savedata.Progress[StageNum]++;
                        }


                    }
                }

            } catch (e) {
                console.error("storymode Error:", e);
                await visualnoveldialogue([{ text: "エラーが発生しました。タイトルに戻ります。", speaker: "system" }]);
                loop = false;
                init();
            }
        }
    }
    gameStart();
}