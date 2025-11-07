// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('warehouseHighScore') || 0;
let frameCount = 0;
let gameSpeed = 5;

// Update high score display
document.getElementById('highScore').textContent = highScore;

// Forklift object
const forklift = {
    x: 50,
    y: 0,
    width: 60,
    height: 50,
    velocityY: 0,
    jumping: false,
    grounded: false,

    draw() {
        // Forklift body (main chassis)
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(this.x, this.y + 20, 45, 25);

        // Cabin
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(this.x + 25, this.y + 10, 20, 20);

        // Cabin window
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(this.x + 28, this.y + 13, 14, 10);

        // Fork (front)
        ctx.fillStyle = '#696969';
        ctx.fillRect(this.x + 45, this.y + 35, 12, 3);
        ctx.fillRect(this.x + 45, this.y + 40, 12, 3);

        // Fork support
        ctx.fillStyle = '#808080';
        ctx.fillRect(this.x + 45, this.y + 25, 3, 18);

        // Wheels
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 45, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 35, this.y + 45, 5, 0, Math.PI * 2);
        ctx.fill();

        // Wheel details (tire tread)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 45, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 35, this.y + 45, 3, 0, Math.PI * 2);
        ctx.stroke();
    },

    update() {
        // Gravity
        const gravity = 0.8;
        const groundY = canvas.height - 50 - this.height;

        // Apply gravity
        this.velocityY += gravity;

        // Apply velocity to position
        this.y += this.velocityY;

        // Check if landed on ground
        if (this.y >= groundY) {
            this.y = groundY;
            this.velocityY = 0;
            this.jumping = false;
            this.grounded = true;
        } else {
            this.grounded = false;
        }
    },

    jump() {
        if (!this.jumping && this.grounded) {
            this.velocityY = -15;
            this.jumping = true;
        }
    },

    getBottom() {
        return this.y + this.height;
    },

    getRight() {
        return this.x + this.width;
    }
};

// Obstacle (warehouse racks) array
const obstacles = [];

class Obstacle {
    constructor() {
        this.width = 40;
        this.height = Math.random() > 0.5 ? 60 : 80;
        this.x = canvas.width;
        this.y = canvas.height - 50 - this.height;
        this.passed = false;
    }

    draw() {
        // Rack frame
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Vertical supports
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 2, this.y, 4, this.height);
        ctx.fillRect(this.x + this.width - 6, this.y, 4, this.height);

        // Horizontal shelves
        const shelfCount = Math.floor(this.height / 20);
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < shelfCount; i++) {
            ctx.fillRect(this.x, this.y + i * 20, this.width, 3);
        }

        // Shelf items (boxes on rack)
        ctx.fillStyle = '#D2691E';
        for (let i = 0; i < shelfCount - 1; i++) {
            ctx.fillRect(this.x + 8, this.y + i * 20 + 5, 10, 10);
            ctx.fillRect(this.x + 22, this.y + i * 20 + 5, 10, 10);
        }
    }

    update() {
        this.x -= gameSpeed;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    collidesWith(forklift) {
        return forklift.x < this.x + this.width &&
               forklift.getRight() > this.x &&
               forklift.y < this.y + this.height &&
               forklift.getBottom() > this.y;
    }
}

// Collectible boxes array
const boxes = [];
const thrownBoxes = [];

class Box {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.x = canvas.width;
        this.y = canvas.height - 50 - this.height - Math.random() * 30;
        this.collected = false;
        this.color = this.randomColor();
    }

    randomColor() {
        const colors = ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF69B4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw() {
        // Box
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Box outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Box tape/straps
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.stroke();
    }

    update() {
        this.x -= gameSpeed;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    collidesWith(forklift) {
        return forklift.x < this.x + this.width &&
               forklift.getRight() > this.x &&
               forklift.y < this.y + this.height &&
               forklift.getBottom() > this.y;
    }
}

class ThrownBox {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.color = color;
        this.velocityY = -12;
        this.velocityX = 2;
        this.rotation = 0;
        this.rotationSpeed = 0.2;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Box
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Box outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.restore();
    }

    update() {
        this.velocityY += 0.5; // gravity
        this.y += this.velocityY;
        this.x += this.velocityX;
        this.rotation += this.rotationSpeed;

        // Fade out as it goes up
        if (this.y < 100) {
            this.alpha -= 0.02;
        }
    }

    isOffScreen() {
        return this.y > canvas.height || this.alpha <= 0;
    }
}

// Ground
function drawGround() {
    // Ground base
    ctx.fillStyle = '#555';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Ground line detail
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.stroke();

    // Ground texture (warehouse floor lines)
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        const offset = (frameCount * gameSpeed) % 50;
        ctx.beginPath();
        ctx.moveTo(i - offset, canvas.height - 45);
        ctx.lineTo(i - offset, canvas.height);
        ctx.stroke();
    }
}

// Spawn obstacles
function spawnObstacle() {
    if (frameCount % 120 === 0) {
        obstacles.push(new Obstacle());
    }
}

// Spawn boxes
function spawnBox() {
    if (frameCount % 90 === 0 && Math.random() > 0.3) {
        boxes.push(new Box());
    }
}

// Update score
function updateScore() {
    document.getElementById('score').textContent = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('warehouseHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
}

// Collision detection and updates
function updateGame() {
    // Update forklift
    forklift.update();

    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();

        // Check collision
        if (obstacles[i].collidesWith(forklift)) {
            endGame();
            return;
        }

        // Award points for passing obstacle
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < forklift.x) {
            obstacles[i].passed = true;
            score += 5;
            updateScore();
        }

        // Remove off-screen obstacles
        if (obstacles[i].isOffScreen()) {
            obstacles.splice(i, 1);
        }
    }

    // Update and draw boxes
    for (let i = boxes.length - 1; i >= 0; i--) {
        boxes[i].update();

        // Check collection
        if (!boxes[i].collected && boxes[i].collidesWith(forklift)) {
            boxes[i].collected = true;
            score += 10;
            updateScore();

            // Create thrown box animation
            thrownBoxes.push(new ThrownBox(
                forklift.x + forklift.width / 2,
                forklift.y,
                boxes[i].color
            ));

            boxes.splice(i, 1);
        } else if (boxes[i].isOffScreen()) {
            boxes.splice(i, 1);
        }
    }

    // Update thrown boxes
    for (let i = thrownBoxes.length - 1; i >= 0; i--) {
        thrownBoxes[i].update();

        if (thrownBoxes[i].isOffScreen()) {
            thrownBoxes.splice(i, 1);
        }
    }

    // Gradually increase game speed
    if (frameCount % 300 === 0 && gameSpeed < 10) {
        gameSpeed += 0.5;
    }
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    drawGround();

    // Draw forklift
    forklift.draw();

    // Draw obstacles
    obstacles.forEach(obstacle => obstacle.draw());

    // Draw boxes
    boxes.forEach(box => box.draw());

    // Draw thrown boxes
    thrownBoxes.forEach(box => box.draw());

    // Draw start message
    if (!gameRunning && !gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click or Press SPACE to Start!', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Jump over racks, collect boxes!', canvas.width / 2, canvas.height / 2 + 40);
    }
}

// Game loop
function gameLoop() {
    if (gameRunning && !gameOver) {
        frameCount++;
        spawnObstacle();
        spawnBox();
        updateGame();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    if (!gameRunning && !gameOver) {
        gameRunning = true;
        score = 0;
        gameSpeed = 5;
        frameCount = 0;
        updateScore();
    }
}

// End game
function endGame() {
    gameOver = true;
    gameRunning = false;

    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Restart game
function restartGame() {
    gameOver = false;
    gameRunning = false;
    score = 0;
    gameSpeed = 5;
    frameCount = 0;
    obstacles.length = 0;
    boxes.length = 0;
    thrownBoxes.length = 0;
    forklift.y = 0;
    forklift.velocityY = 0;
    forklift.jumping = false;

    updateScore();
    document.getElementById('gameOver').classList.add('hidden');
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();

        if (!gameRunning && !gameOver) {
            startGame();
        } else if (gameRunning) {
            forklift.jump();
        }
    }
});

canvas.addEventListener('click', () => {
    if (!gameRunning && !gameOver) {
        startGame();
    } else if (gameRunning) {
        forklift.jump();
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    restartGame();
});

// Start game loop
gameLoop();
