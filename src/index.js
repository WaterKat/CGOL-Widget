
const config = {
    width: 96,
    height: 53,
    cellSize: 20,
    timeBeforeDecay: 3,
    frameRate: 10
}

/** @type {HTMLCanvasElement} */
let canvas;

/** @type {CanvasRenderingContext2D} */
let ctx;

/** @type {GameOfLife} */
let gol;

/** @type {Date} */
let lastGeneration;

/** @type {boolean} */
let running = false;

/** @type {boolean} */
let hasInit = false;

class GameOfLife {
    #arrays;
    #index;
    #width;
    #height;
    #count;

    static #neighbors = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0], [1, 0],
        [-1, 1], [0, 1], [1, 1]
    ];

    /**
     * 
     * @param {number} width 
     * @param {number} height 
     * @param {boolean} randomize 
     */
    constructor(width, height, randomize = false) {
        this.#width = width;
        this.#height = height;
        this.#index = 0;
        this.#count = 0;
        this.#arrays = [
            GameOfLife.#CreateEmptyArray(width, height),
            GameOfLife.#CreateEmptyArray(width, height)
        ];
        if (randomize) {
            this.randomize();
        }
    }

    /**
     * 
     * @param {number} sx 
     * @param {number} sy 
     * @param {number} dx 
     * @param {number} dy 
     */
    randomize(sx = 0, sy = 0, dx = this.#width, dy = this.#height) {
        const current = this.#arrays[this.#index];
        this.#count = 0;

        sx = Math.floor(Math.max(sx, 0));
        sy = Math.floor(Math.max(sy, 0));

        dx = Math.floor(Math.min(dx, this.#width));
        dy = Math.floor(Math.min(dy, this.#height));


        for (let j = sy; j < dy; j++) {
            for (let i = sx; i < dx; i++) {
                const value = Math.random() > 0.75 ? 1 : 0;
                current[j][i] = value;
                this.#count += value
            }
        }
    }

    /**
     * 
     * @param {boolean} dissolve 
     */
    step(dissolve = false, dissolveChance = 0.2) {
        const current = this.#arrays[this.#index];
        const next = this.#arrays[1 - this.#index];

        this.#count = 0;

        for (let y = 0; y < this.#height; y++) {
            for (let x = 0; x < this.#width; x++) {
                let neighborsCount = 0;
                for (const [dx, dy] of GameOfLife.#neighbors) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= this.#width
                        || ny < 0 || ny >= this.#height) {
                        continue;
                    }
                    neighborsCount += current[ny][nx];
                }
                if (current[y][x] === 0 && neighborsCount === 3) {
                    next[y][x] = 1;
                } else if (current[y][x] === 1
                    && (neighborsCount === 3 || neighborsCount === 2)) {
                    next[y][x] = 1;
                } else {
                    next[y][x] = 0;
                }

                if (dissolve && Math.random() < dissolveChance) {
                    next[y][x] = 0;
                }

                this.#count += next[y][x];
            }
        }

        this.#index = 1 - this.#index;
    }

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
    }

    get count() {
        return this.#count;
    }

    getArray() {
        return this.#arrays[this.#index];
    }

    /**
     * 
     * @param {number[][]} array 
     */
    setArray(array) {
        for (let y = 0; y < this.#height; y++) {
            for (let x = 0; x < this.#width; x++) {
                this.#arrays[this.#index][y][x] = array[y][x];
            }
        }
    }

    /**
     * 
     * @param {number} width 
     * @param {number} height 
     * @returns {number[][]}
     */
    static #CreateEmptyArray(width, height) {
        const arrayA = new Array(height);
        for (let y = 0; y < height; y++) {
            arrayA[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                arrayA[y][x] = 0;
            }
        }
        return arrayA;
    }
}

async function Render() {
    if (!ctx) {
        running = false;
        return;
    }

    if (running || gol.count === 0) {
        running = false;
        ctx.clearRect(
            0, 0,
            config.width * config.cellSize, config.height * config.cellSize
        );
        return;
    }

    const arr = gol.getArray();

    const imageData = ctx.createImageData(config.width, config.height);

    for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
            const index = (y * config.width + x) * 4;
            const color = arr[y][x] === 1 ? 255 : 0;
            imageData.data[index] = color;
            imageData.data[index + 1] = color;
            imageData.data[index + 2] = color;
            imageData.data[index + 3] = color;
        }
    }

    try {
        const bitmap = await createImageBitmap(
            new ImageData(imageData.data, config.width, config.height)
        );

        ctx.clearRect(
            0, 0,
            config.width * config.cellSize, config.height * config.cellSize
        );
        ctx.drawImage(bitmap,
            0, 0,
            config.width * config.cellSize, config.height * config.cellSize
        );

        const dissolve = new Date().getTime() - lastGeneration.getTime()
            > config.timeBeforeDecay * 1000;

        gol.step(dissolve);

        setTimeout(() => {
            requestAnimationFrame(Render);
        }, 1000 / config.frameRate);
    } catch (e) {
        console.error(e);
        running = false;
    }
}

/**
 * @typedef StreamElementsEvent
 * @type {object} 
 * @property {string} type
 * @property {string} name
 * @property {number | undefined} amount
 * @property {string | undefined} message
 * @property {boolean | undefined} gifted
 * @property {string | undefined} sender
 * @property {boolean | undefined} bulkGifted
 * @property {boolean | undefined} isCommunityGift
 * @property {boolean | undefined} playedAsCommunityGift
 */

/**
 * 
 * @param {*} event 
 * @returns {StreamElementsEvent | undefined}
 */
function VerifyStreamElementsEvent(event) {
    if (!event ||
        !event["detail"] || !event["detail"]["event"] ||
        !event["detail"]["event"]["name"])
        return undefined;

    if (typeof event.detail.event.itemId !== "undefined") {
        event.detail.listener = "redemption-latest";
    }

    const streamElementEvent = {
        ...event.detail.event,
        type: event.detail.listener.toLowerCase().split("-")[0]
    }

    return streamElementEvent;
}

/**
 * 
 * @param {any} obj 
 */
function onEventReceived(obj) {
    const event = VerifyStreamElementsEvent(obj);
    if (!event)
        return;

    lastGeneration = new Date();
    gol.randomize(0, gol.height - 5, gol.width, gol.height);
    Render();
}

/**
 * Thiw widgets main function essentially.
 * Grabs the field data and assigns it to some variables. these will be used in
 * the widget.
 * @param {*} obj 
 */
function onWidgetLoad(obj) {
    if (hasInit)
        return;
    hasInit = true;

    const fieldData = obj.detail.fieldData;
    Object.keys(config).forEach(key => {
        if (fieldData[key]) {
            // @ts-ignore
            config[key] = fieldData[key];
        }
    });

    canvas = document.createElement("canvas");
    canvas.width = config.width * config.cellSize;
    canvas.height = config.height * config.cellSize;
    canvas.style.margin = "0";
    canvas.style.padding = "0";
    document.body.appendChild(canvas);

    ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
    ctx.imageSmoothingEnabled = false;

    gol = new GameOfLife(config.width, config.height, false);
    lastGeneration = new Date();
    Render();

    window.addEventListener('onEventReceived', onEventReceived);
}

window.addEventListener('onWidgetLoad', onWidgetLoad);

//# sourceURL=browsertools://aonyxbuddy/cgol.js
