/**
 * The configuration object for the game of life widget.
 * The width and height are the dimensions of the game of life object.
 * The cellSize is the size of each cell in the game of life object.
 * The timeBeforeDecay is the time in seconds before the game of life object
 * decays.
 * The frameRate is the frame rate of the game of life object.
 */
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
let lastEventTime;

/** @type {boolean} */
let running = false;

/** @type {boolean} */
let hasInit = false;

/**
 * The game of life class. This class is responsible for the game of life logic
 * and the state of the game of life object. It can randomize the game of life
 * object, step the game of life object and get the current state of the game 
 * of life object.
 */
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

/**
 * The canvas rendering function. It will render the game of life object
 * and then call itself again after a delay.
 * If the game of life object is empty or the running flag is set to false
 * the function will clear the canvas and return.
 * @returns {Promise<void>}
 */
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

        const dissolve = new Date().getTime() - lastEventTime.getTime()
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
 * Verifies that the event is a usable stream elements event.
 * Usable meaning that this is an event that can be used to trigger
 * the randomization of the game of life object and the rendering of the canvas
 * @param {*} potentialEvent The event to verify from stream elements
 * @returns {StreamElementsEvent | undefined} A valid stream elements event or 
 * undefined if the event is not usable.
 */
function VerifyStreamElementsEvent(potentialEvent) {
    if (!potentialEvent ||
        !potentialEvent["detail"] || !potentialEvent["detail"]["event"] ||
        !potentialEvent["detail"]["event"]["name"])
        return undefined;

    if (typeof potentialEvent.detail.event.itemId !== "undefined") {
        potentialEvent.detail.listener = "redemption-latest";
    }

    const streamElementEvent = {
        ...potentialEvent.detail.event,
        type: potentialEvent.detail.listener.toLowerCase().split("-")[0]
    }

    return streamElementEvent;
}

/**
 * Handles events received from stream elements.
 * Resets the last generation and randomizes the game of life object.
 * Then starts the rendering of the canvas.
 * @param {*} streamElementsEvent 
 */
function onEventReceived(streamElementsEvent) {
    const event = VerifyStreamElementsEvent(streamElementsEvent);
    if (!event)
        return;

    lastEventTime = new Date();
    gol.randomize(0, gol.height - 5, gol.width, gol.height);
    Render();
}

/**
 * This widgets main function essentially.
 * Grabs the field data and assigns it the config object. These will be used in
 * to create the canvas and the game of life object. 
 * The function also listens for the onEventReceived event to trigger the
 * randomization of the game of life object and the rendering of the canvas.
 * @param {*} widgetLoadEvent the stream elements widget load event which
 * contains the field data.
 */
function onWidgetLoad(widgetLoadEvent) {
    if (hasInit)
        return;
    hasInit = true;

    const fieldData = widgetLoadEvent.detail.fieldData;
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
    lastEventTime = new Date();
    Render();

    window.addEventListener('onEventReceived', onEventReceived);
}

window.addEventListener('onWidgetLoad', onWidgetLoad);

//# sourceURL=browsertools://aonyxbuddy/cgol.js
