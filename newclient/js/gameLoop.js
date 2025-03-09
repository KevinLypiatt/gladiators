// Game initialization
function init() {
    resizeCanvas();
    generateMaze();
    spawnPlayer();
    
    // Reset game timer state
    gameStartTime = 0;
    gameTimerStarted = false;
    gameWon = false;
    gameOver = false;
    
    // Reset player state
    characterLives = 3;
    arrowCount = MAX_ARROWS;
    arrows = [];
    
    // Setup keyboard control handling
    setupControls();
    
    // Hide timer initially - will show on first movement
    document.getElementById("gameTimer").style.display = "none";

    // Initialize touch controls if on touch device
    setupTouchControls();
    
    // Ensure focus works
    canvas.focus();
    console.log("Game initialized, canvas focused:", document.activeElement === canvas);
    
    // Add click listener for game container
    document.querySelector('.game-container').addEventListener('click', function() {
        canvas.focus();
    });

    // Update focus message
    document.getElementById("focusMessage").innerHTML = 
        "Click here to play<br>(WASD or Arrows to move/rotate, A/D to strafe, Space to shoot)";
    
    // Start the game loop
    gameLoop();
}

// Main game loop
function gameLoop() {
    updatePlayer();
    updateArrows();
    updateVisualEffects();
    checkArrowCollisions();
    
    // Update timer
    if (gameTimerStarted) {
        updateTimer();
    }
    
    render();
    
    // Store animation frame ID
    window.gameLoopId = requestAnimationFrame(gameLoop);
}

// Restart game function
function restartGame() {
    // First clear existing game loop
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
        window.gameLoopId = null;
    }
    
    // Reset player
    player = {
        x: 150,
        y: 150,
        angle: 0,
        speed: 0,
        maxSpeed: PLAYER_SPEED,
        radius: 10,
        rotationSpeed: Math.PI / 60
    };
    
    // Reset game state
    gameOver = false;
    gameWon = false;
    gameStartTime = 0;
    gameTimerStarted = false;
    elapsedTime = 0;
    characterLives = 3;
    arrowCount = MAX_ARROWS;
    arrows = [];
    
    // Reset movement flags
    movingForward = false;
    movingBackward = false;
    rotatingLeft = false;
    rotatingRight = false;
    strafingLeft = false;
    strafingRight = false;
    
    // Reset camera
    camera = { x: 0, y: 0 };
    
    // Hide UI banners
    document.getElementById("gameOverBanner").style.display = "none";
    document.getElementById("gameWonBanner").style.display = "none";
    document.getElementById("gameTimer").style.display = "none";
    
    // Reinitialize the game
    init();

    // Update UI with reset values
    livesCountDisplay.textContent = characterLives;
    arrowCountDisplay.textContent = arrowCount;
}

// Timer function
function updateTimer() {
    if (!gameTimerStarted) return "0:00";
    
    const currentTime = performance.now();
    elapsedTime = Math.floor((currentTime - gameStartTime) / 1000);
    
    // Format time as minutes:seconds
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update timer display if game is active
    if (!gameOver && !gameWon) {
        document.getElementById("gameTimer").textContent = `Time: ${formattedTime}`;
    }
    
    return formattedTime;
}

// Initialize on page load
window.addEventListener('load', init);
