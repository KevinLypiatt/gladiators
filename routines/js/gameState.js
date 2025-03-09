// Get DOM elements
let canvas;
let ctx;
let arrowCountDisplay;
let livesCountDisplay;

// Add DOM initialization
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    arrowCountDisplay = document.getElementById('arrowCount');
    livesCountDisplay = document.getElementById('livesCount');
    
    // Initial canvas sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});

// Debug mode
window.debugMode = false;

// Spider states definition
const SPIDER_STATES = {
    PATROL: 'patrol',
    ATTACK: 'attack',
    RETREAT: 'retreat',
    HEAL: 'heal',
    DYING: 'dying'
};

// Global game state variables
let arrowCount = MAX_ARROWS;
let arrows = [];
let walls = [];
let camera = { x: 0, y: 0 };
let movingForward = false, movingBackward = false;
let rotatingLeft = false, rotatingRight = false;
let strafingLeft = false, strafingRight = false;
let characterLives = 3;
let gameOver = false;
let gameWon = false;
let gameStartTime = 0;
let gameTimerStarted = false;
let gameEndTime = 0;
let elapsedTime = 0;
let visualEffects = [];
let touchControls = {
    enabled: false,
    moveJoystick: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, moveX: 0, moveY: 0, moveSpeed: 0 },
    aimJoystick: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 },
    joystickSize: 50,
    maxDistance: 75,
    deadzone: 10
};
// Player and game object declarations
let player = {
    x: 150,
    y: 150,
    angle: 0,
    speed: 0,
    maxSpeed: PLAYER_SPEED,
    radius: 10,
    rotationSpeed: Math.PI / 60
};
let nests = [];
let spiders = [];

// Fix canvas sizing function
function resizeCanvas() {
    if (!canvas) return;
    
    // Set canvas size to match the original dimensions
    const containerWidth = window.innerWidth * 0.9;
    const containerHeight = window.innerHeight * 0.9;
    
    // Maintain aspect ratio but ensure it's large enough
    canvas.width = Math.min(containerWidth, containerHeight * 1.5);
    canvas.height = canvas.width * 0.75; // 4:3 aspect ratio like the original
    
    // Force redraw if context exists
    if (ctx) {
        render();
    }
}
