export class Creation {
    static pool = [];

    static addToPool(canvas) {
        if (Creation.pool.length < 100) {
            canvas.style.display = 'none';
            Creation.pool.push(canvas);
        } else {
            canvas.html = null;
            canvas.remove();
        }
    }

    constructor(name, type, element, template) {
        this.rotation = 0;
        this.html = null;
        if (!template) {
            this.name = name;
            this.element = element;
            this.type = type;
            this.gui = element;
        } else {
            if (template == 'newcreate') {
                this.element2 = element;
                this.name = name;
                this.element = {}
                this.gui = {
                    type: 'newcreate',
                    typeValue: {
                        dot: "5px", data: [
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],
                            ["rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)", "rgba(0,0,0,1)"],]
                    },
                    zIndex: 1,
                    maxWidth: 1250,
                    maxHeight: 700,
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    speed: 5,
                    conditions: ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'],
                };
                for (let key in this.element2) {
                    this.gui[key] = this.element2[key];
                }
                this.type = type;
            }
            if (template == 'colorfill') {
                this.element2 = element;
                this.name = name;
                this.element = {}
                this.gui = {
                    type: 'colorfill',
                    typeValue: '#000000',
                    zIndex: 1,
                    maxWidth: 1250,
                    maxHeight: 700,
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    speed: 5,
                    conditions: ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'],
                };
                for (let key in this.element2) {
                    this.gui[key] = this.element2[key];
                }
                this.type = type;
            }
            if (template == 'image') {
                this.element2 = element;
                this.name = name;
                this.element = {}
                this.gui = {
                    type: 'image',
                    zIndex: 1,
                    maxWidth: 1250,
                    maxHeight: 700,
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    speed: 5,
                    conditions: ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'],
                };
                for (let key in this.element2) {
                    this.gui[key] = this.element2[key];
                }
                this.type = type;
            }
            if (template == 'text') {
                this.element2 = element;
                this.name = name;
                this.element = {}
                this.gui = {
                    type: 'text',
                    typeValue: [20, 'hello world!'],
                    zIndex: 1,
                    maxWidth: 1250,
                    maxHeight: 700,
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    speed: 5,
                    conditions: ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'],
                };
                for (let key in this.element2) {
                    this.gui[key] = this.element2[key];
                }
                this.type = type;
            }
        }
        if (type == 'gui') {
            let canvas;
            if (Creation.pool.length > 0) {
                canvas = Creation.pool.pop();
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
                canvas.style.display = 'block'; // Show it
            } else {
                canvas = document.createElement('canvas');
            }
            canvas.style.zIndex = this.gui.zIndex + 1;
            canvas.style.position = 'absolute';
            canvas.id = this.name;
            canvas.width = this.gui.maxWidth;
            canvas.height = this.gui.maxHeight;
            canvas.style.imageRendering = "pixelated"; // Ensure sharp pixels
            this.html = canvas;
            this.html.creationInstance = this; // Attach instance for safe removal
            document.getElementById('stage').appendChild(this.html)
        }
        this.keydata = {};

        this._keydownHandler = (event) => this.keydown(event);
        this._keyupHandler = (event) => this.keyup(event);
        document.addEventListener("keydown", this._keydownHandler);
        document.addEventListener("keyup", this._keyupHandler);
    }

    keydown(event) {
        this.keydata[event.key] = true;
    }

    keyup(event) {
        this.keydata[event.key] = false;
    }

    infMove() {
        this.inf = true;
        this.infa();
    }
    infa() {
        if (this.inf) {
            this.move();
            this.canvas();
            requestAnimationFrame(() => this.infa());
        }
    }
    move() {
        const speed = this.gui.speed;
        const conditions = this.gui.conditions;
        (this.keydata[conditions[0]] && this.gui.x + this.gui.width + speed <= this.gui.maxWidth) && (this.gui.x += speed);
        (this.keydata[conditions[1]] && this.gui.x - speed >= 0) && (this.gui.x -= speed);
        (this.keydata[conditions[2]] && this.gui.y - speed >= 0) && (this.gui.y -= speed);
        (this.keydata[conditions[3]] && this.gui.y + this.gui.height + speed <= this.gui.maxHeight) && (this.gui.y += speed);

    }

    canvas() {
        const cre = document.getElementById(this.name);
        if (!cre) return;
        const ctx = cre.getContext('2d');
        ctx.clearRect(0, 0, this.gui.maxWidth, this.gui.maxHeight);

        const cx = this.gui.x;
        const cy = this.gui.y;

        ctx.save();

        ctx.translate(cx, cy);

        if (this.gui.type === 'newcreate') {
            const dotSize = parseInt(this.gui.typeValue.dot.replace("px", ""));
            const data = this.gui.typeValue.data;
            for (let y = 0; y < data.length; y++) {
                for (let x = 0; x < data[y].length; x++) {
                    const pixelColor = data[y][x];
                    if (pixelColor && pixelColor !== "rgba(0,0,0,0)") {
                        ctx.fillStyle = pixelColor;
                        ctx.fillRect(x * dotSize, y * dotSize, dotSize, dotSize);
                    }
                }
            }
        }

        if (this.gui.type === 'colorfill') {
            ctx.fillStyle = this.gui.typeValue;
            ctx.fillRect(0, 0, this.gui.width, this.gui.height);
        }

        if (this.gui.type === 'image') {
            if (!this.img) {
                this.img = new Image();
                this.img.src = this.gui.typeValue;
                this.img.onload = () => {
                    ctx.drawImage(this.img, 0, 0, this.gui.width, this.gui.height);
                };
            }
            if (this.img.complete) {
                ctx.drawImage(this.img, 0, 0, this.gui.width, this.gui.height);
            }
        }

        if (this.gui.type === 'text') {
            document.fonts.load(`${this.gui.typeValue[0]}px DotJP`).then(() => {
                ctx.font = this.gui.typeValue[0] + 'px DotJP';
                ctx.fillStyle = 'black';
                this.gui.typeValue[1].split("\n").forEach((line, index) => {
                    ctx.fillText(
                        line,
                        this.gui.x,
                        this.gui.y + index * this.gui.typeValue[0]
                    );
                });
            });
        }


        ctx.restore();
    }


    delete() {
        const cre = document.getElementById(this.name);
        const ctx = cre.getContext('2d');
        ctx.clearRect(0, 0, this.gui.maxWidth, this.gui.maxHeight);
    }
    remove() {
        if (this._keydownHandler) {
            document.removeEventListener("keydown", this._keydownHandler);
            this._keydownHandler = null;
        }
        if (this._keyupHandler) {
            document.removeEventListener("keyup", this._keyupHandler);
            this._keyupHandler = null;
        }

        const cre = document.getElementById(this.name);
        if (cre) {
            cre.creationInstance = null; // Detach instance
            cre.remove();
            if (cre.tagName === 'CANVAS') {
                Creation.addToPool(cre);
            }
        }
    }
    static create(name, type, element, template) {
        return new Creation(name, type, element, template);
    }
    ;
}