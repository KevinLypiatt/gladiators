function init() {
    console.log("Initializing game...");
    
    if (!canvas || !ctx) {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        arrowCountDisplay = document.getElementById('arrowCount');
        livesCountDisplay = document.getElementById('livesCount');
    }
    
    // Clear any existing game loop
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
    }
    
    // Set up initial canvas size
    resizeCanvas();
    
    // Ensure event listener for resize is only added once
    window.removeEventListener('resize', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    
    console.log("Generating maze...");
    generateMaze();
    console.log("Maze generated with", walls.length, "wall segments");
    
    // Spawn player after maze exists
    spawnPlayer();
    console.log("Player spawned at", player.x, player.y);
    
    // Create exactly 3 nests
    nests = [];
    while (nests.length < 3) {
        spawnNest();
    }
    console.log("Created", nests.length, "nests");
    
    // Update UI
    document.getElementById("nestCount").textContent = nests.length;
    livesCountDisplay.textContent = characterLives;
    arrowCountDisplay.textContent = arrowCount;
    
    // Set up input controls
    setupControls();
    setupTouchControls();
    
    // Focus the canvas
    setFocus();
    
    // Initial render to show the maze
    render();
    
    // Start game loop
    console.log("Starting game loop");
    gameLoop();
}

function gameLoop() {
    updatePlayer();
    updateArrows();
    spawnSpiders();
    updateSpiders();
    updateVisualEffects();
    checkArrowCollisions();
    checkWinCondition();
    
    if (gameTimerStarted) {
        updateTimer();
    }
    
    render();
    window.gameLoopId = requestAnimationFrame(gameLoop);
}

function checkWinCondition() {
    if (!gameOver && !gameWon && nests.length === 0 && spiders.length === 0) {
        gameWon = true;
        gameEndTime = performance.now();
        const finalTime = updateTimer();
        document.getElementById("timePlayedWin").textContent = finalTime;
        document.getElementById("gameWonBanner").style.display = "block";
    }
}

function updateTimer() {
    if (!gameTimerStarted) return "0:00";
    
    const currentTime = performance.now();
    elapsedTime = Math.floor((currentTime - gameStartTime) / 1000);
    
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (!gameOver && !gameWon) {
        document.getElementById("gameTimer").textContent = `Time: ${formattedTime}`;
    }
    
    return formattedTime;
}

function restartGame() {
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
    }
    
    // Reset game state
    gameOver = false;
    gameWon = false;
    gameStartTime = 0;
    gameTimerStarted = false;
    elapsedTime = 0;
    characterLives = 3;
    arrowCount = MAX_ARROWS;
    arrows = [];
    spiders = [];
    nests = [];
    
    // Reset movement flags
    movingForward = false;
    movingBackward = false;
    rotatingLeft = false;
    rotatingRight = false;
    strafingLeft = false;
    strafingRight = false;
    
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
    
    // Reset camera
    camera = { x: 0, y: 0 };
    
    // Hide banners
    document.getElementById("gameOverBanner").style.display = "none";
    document.getElementById("gameWonBanner").style.display = "none";
    document.getElementById("gameTimer").style.display = "none";
    
    // Reinitialize
    init();
    
    // Update UI
    document.getElementById("nestCount").textContent = nests.length;
    livesCountDisplay.textContent = characterLives;
}

// Ensure window load handler is last
window.removeEventListener('load', init);
window.addEventListener('load', init);
