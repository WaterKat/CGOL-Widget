/**
 * 
 * @param {number} height 
 * @param {number} width 
 * @returns 
 */
export function CreateCanvas(width, height) {
    /* initialize arrays */
    const arrayA = new Array(height);
    for (let y = 0; y < height; y++) {
        arrayA[y] = new Array(width);
        for (let x = 0; x < width; x++) {
            arrayA[y][x] = 0;
        }
    }
    const arrayB = new Array(height);
    for (let y = 0; y < height; y++) {
        arrayB[y] = new Array(width);
        for (let x = 0; x < width; x++) {
            arrayB[y][x] = 0;
        }
    }
    const neighbors = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0], [1, 0],
        [-1, 1], [0, 1], [1, 1]
    ];
    const arrays = [arrayA, arrayB];
    let arrayIndex = 0;

    /* calculation loop */
    function step() {
        const current = arrays[arrayIndex];
        const next = arrays[1 - arrayIndex];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let neighborsCount = 0;
                for (const [dx, dy] of neighbors) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                        continue;
                    }
                    neighborsCount += current[ny][nx];
                }
                if (neighborsCount === 3 || (neighborsCount === 2 && current[y][x])) {
                    next[y][x] = 1;
                } else {
                    next[y][x] = 0;
                }
            }
        }
        arrayIndex = 1 - arrayIndex;
        return next;
    }

}