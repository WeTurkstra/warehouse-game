// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grid settings
const TILE_SIZE = 64;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

// Game state
let currentLevel = 0;
let moves = 0;
let moveHistory = [];
let levelBestMoves = {};

// Tile types
const TILES = {
    EMPTY: 0,
    WALL: 1,
    BOX: 2,
    EXIT: 3,
    PLAYER: 4,
    FLOOR: 5
};

// Player direction
let playerDirection = 'down'; // up, down, left, right

// Level definitions
const levels = [
    {
        name: "Tutorial",
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 4, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 5, 2, 5, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 3, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ]
    },
    {
        name: "The Corridor",
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 4, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 1, 1, 1, 1, 1, 1, 5, 1],
            [1, 5, 1, 5, 2, 5, 5, 1, 5, 1],
            [1, 5, 1, 5, 5, 2, 5, 1, 5, 1],
            [1, 5, 1, 5, 5, 5, 5, 1, 5, 1],
            [1, 5, 1, 1, 1, 1, 1, 1, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 3, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ]
    },
    {
        name: "Box Puzzle",
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 4, 5, 5, 1, 5, 5, 5, 5, 1],
            [1, 5, 2, 5, 1, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 1, 5, 5, 5, 5, 1],
            [1, 1, 5, 1, 1, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 2, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 1, 1, 1, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 3, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ]
    },
    {
        name: "Warehouse",
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 4, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 1, 1, 2, 1, 1, 5, 5, 1],
            [1, 5, 1, 5, 5, 5, 1, 5, 5, 1],
            [1, 5, 1, 5, 2, 5, 1, 5, 5, 1],
            [1, 5, 1, 5, 5, 5, 1, 5, 5, 1],
            [1, 5, 1, 1, 2, 1, 1, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 3, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ]
    },
    {
        name: "The Maze",
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 4, 5, 1, 2, 5, 5, 5, 5, 1],
            [1, 1, 5, 1, 5, 1, 1, 1, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
            [1, 5, 1, 1, 1, 1, 5, 1, 1, 1],
            [1, 5, 5, 5, 2, 5, 5, 5, 5, 1],
            [1, 1, 1, 5, 1, 1, 1, 1, 5, 1],
            [1, 5, 5, 5, 5, 5, 2, 5, 5, 1],
            [1, 5, 5, 5, 5, 5, 5, 5, 3, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ]
    }
];

// Current game grid and player position
let grid = [];
let playerX = 0;
let playerY = 0;

// Load level
function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        showGameComplete();
        return;
    }

    currentLevel = levelIndex;
    const level = levels[levelIndex];

    // Deep copy the grid
    grid = level.grid.map(row => [...row]);

    // Find player position
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x] === TILES.PLAYER) {
                playerX = x;
                playerY = y;
                grid[y][x] = TILES.FLOOR; // Replace player tile with floor
            }
        }
    }

    // Reset moves
    moves = 0;
    moveHistory = [];

    // Update UI
    updateUI();
    draw();
}

// Update UI elements
function updateUI() {
    document.getElementById('level').textContent = currentLevel + 1;
    document.getElementById('moves').textContent = moves;

    const bestKey = `level_${currentLevel}`;
    const best = levelBestMoves[bestKey];
    document.getElementById('bestMoves').textContent = best ? best : '--';
}

// Draw functions
function drawTile(x, y, type) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    switch(type) {
        case TILES.WALL:
            // Warehouse wall
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

            // Brick pattern
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + TILE_SIZE / 2, py);
            ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE);
            ctx.stroke();
            break;

        case TILES.FLOOR:
            // Warehouse floor
            ctx.fillStyle = '#D3D3D3';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#A9A9A9';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            break;

        case TILES.BOX:
            // Floor first
            ctx.fillStyle = '#D3D3D3';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#A9A9A9';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

            // Box
            const boxPadding = 8;
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(px + boxPadding, py + boxPadding,
                        TILE_SIZE - boxPadding * 2, TILE_SIZE - boxPadding * 2);
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.strokeRect(px + boxPadding, py + boxPadding,
                          TILE_SIZE - boxPadding * 2, TILE_SIZE - boxPadding * 2);

            // Box tape
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(px + boxPadding, py + TILE_SIZE / 2);
            ctx.lineTo(px + TILE_SIZE - boxPadding, py + TILE_SIZE / 2);
            ctx.moveTo(px + TILE_SIZE / 2, py + boxPadding);
            ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE - boxPadding);
            ctx.stroke();
            break;

        case TILES.EXIT:
            // Floor first
            ctx.fillStyle = '#D3D3D3';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Exit door
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 3;
            ctx.strokeRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);

            // Exit sign
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('EXIT', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
            break;
    }
}

function drawPlayer(x, y) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const padding = 6;

    // Draw floor underneath
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#A9A9A9';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

    // Draw forklift based on direction
    ctx.save();
    ctx.translate(px + TILE_SIZE / 2, py + TILE_SIZE / 2);

    // Rotate based on direction
    switch(playerDirection) {
        case 'up':
            ctx.rotate(-Math.PI / 2);
            break;
        case 'down':
            ctx.rotate(Math.PI / 2);
            break;
        case 'left':
            ctx.rotate(Math.PI);
            break;
        // 'right' is default (no rotation)
    }

    // Draw forklift (facing right by default)
    const centerX = 0;
    const centerY = 0;
    const width = TILE_SIZE - padding * 2;
    const height = TILE_SIZE - padding * 2;

    // Main body
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(centerX - width / 2, centerY - height / 4, width * 0.6, height / 2);

    // Cabin
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(centerX - width / 4, centerY - height / 3, width * 0.35, height * 0.66);

    // Window
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(centerX - width / 5, centerY - height / 5, width * 0.2, height * 0.3);

    // Forks (front)
    ctx.fillStyle = '#696969';
    ctx.fillRect(centerX + width / 4, centerY - height / 6, width * 0.25, height * 0.1);
    ctx.fillRect(centerX + width / 4, centerY + height / 16, width * 0.25, height * 0.1);

    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX - width / 6, centerY + height / 4, height * 0.12, 0, Math.PI * 2);
    ctx.arc(centerX + width / 12, centerY + height / 4, height * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = grid[y][x];
            if (tile !== TILES.EMPTY) {
                drawTile(x, y, tile);
            }
        }
    }

    // Draw player
    drawPlayer(playerX, playerY);
}

// Movement and game logic
function canMoveTo(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        return false;
    }

    const tile = grid[y][x];
    return tile !== TILES.WALL;
}

function movePlayer(dx, dy) {
    const newX = playerX + dx;
    const newY = playerY + dy;

    // Update direction
    if (dx > 0) playerDirection = 'right';
    else if (dx < 0) playerDirection = 'left';
    else if (dy > 0) playerDirection = 'down';
    else if (dy < 0) playerDirection = 'up';

    // Check if we can move there
    if (!canMoveTo(newX, newY)) {
        return false;
    }

    // Check if there's a box
    if (grid[newY][newX] === TILES.BOX) {
        // Check if we can push the box
        const boxNewX = newX + dx;
        const boxNewY = newY + dy;

        if (!canMoveTo(boxNewX, boxNewY) || grid[boxNewY][boxNewX] === TILES.BOX) {
            return false; // Can't push box
        }

        // Save state for undo
        saveState();

        // Push the box
        grid[boxNewY][boxNewX] = TILES.BOX;
        grid[newY][newX] = TILES.FLOOR;

        // Move player
        playerX = newX;
        playerY = newY;

        moves++;
    } else {
        // Save state for undo
        saveState();

        // Just move player
        playerX = newX;
        playerY = newY;
        moves++;
    }

    updateUI();
    draw();

    // Check if reached exit
    if (grid[playerY][playerX] === TILES.EXIT) {
        levelComplete();
    }

    return true;
}

function saveState() {
    moveHistory.push({
        playerX: playerX,
        playerY: playerY,
        grid: grid.map(row => [...row]),
        moves: moves,
        direction: playerDirection
    });
}

function undo() {
    if (moveHistory.length === 0) return;

    const state = moveHistory.pop();
    playerX = state.playerX;
    playerY = state.playerY;
    grid = state.grid;
    moves = state.moves;
    playerDirection = state.direction;

    updateUI();
    draw();
}

function restartLevel() {
    loadLevel(currentLevel);
}

function levelComplete() {
    // Save best moves
    const bestKey = `level_${currentLevel}`;
    const currentBest = levelBestMoves[bestKey];
    let isNewRecord = false;

    if (!currentBest || moves < currentBest) {
        levelBestMoves[bestKey] = moves;
        localStorage.setItem('warehouseBestMoves', JSON.stringify(levelBestMoves));
        isNewRecord = true;
    }

    // Show completion dialog
    document.getElementById('finalMoves').textContent = moves;

    if (isNewRecord) {
        document.getElementById('newRecord').classList.remove('hidden');
    } else {
        document.getElementById('newRecord').classList.add('hidden');
    }

    document.getElementById('levelComplete').classList.remove('hidden');
}

function showGameComplete() {
    document.getElementById('gameComplete').classList.remove('hidden');
}

function nextLevel() {
    document.getElementById('levelComplete').classList.add('hidden');
    loadLevel(currentLevel + 1);
}

function playAgain() {
    document.getElementById('gameComplete').classList.add('hidden');
    loadLevel(0);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            movePlayer(1, 0);
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            restartLevel();
            break;
        case 'u':
        case 'U':
            e.preventDefault();
            undo();
            break;
    }
});

document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
document.getElementById('playAgainBtn').addEventListener('click', playAgain);

// Load saved best moves
const savedBestMoves = localStorage.getItem('warehouseBestMoves');
if (savedBestMoves) {
    levelBestMoves = JSON.parse(savedBestMoves);
}

// Initialize game
loadLevel(0);
