// Gladiators Game

// Game settings
const PLAYER_RADIUS = 15;
const PLAYER_SPEED = 2;
const MAX_HP = 5;
const MAX_SHOTS = 3;
const SHOT_SPEED = 4;
const RELOAD_TIME = 3000; // 3 seconds in milliseconds
const WALL_THICKNESS = 10;

// Visual effects types
const EFFECT_TYPES = {
    MUZZLE_FLASH: 'muzzle_flash',
    HIT: 'hit',
    PLAYER_DAMAGE: 'player_damage'
};

// Touch controls structure
let touchControls = {
    enabled: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    moveJoystick: { 
        active: false, 
        startX: 0, 
        startY: 0, 
        currentX: 0, 
        currentY: 0,
        moveX: 0,
        moveY: 0,
        moveSpeed: 0 
    },
    aimJoystick: { 
        active: false, 
        startX: 0, 
        startY: 0, 
        currentX: 0, 
        currentY: 0 
    },
    joystickSize: 50,
    maxDistance: 75,
    deadzone: 10
};

// Game variables
let canvas;
let ctx;
let gameActive = false;
let p1, p2;
let walls = [];
let shots = [];
let visualEffects = [];
let debugMode = false; // Add debugging

// Add keyboard control handling similar to unified.html
let keys = {};

// Keyboard event handlers
function handleKeyDown(e) {
    // Arrow keys for rotation and forward/back movement
    switch(e.key) {
        case 'ArrowUp':
            keys.arrowUp = true;
            break;
        case 'ArrowDown':
            keys.arrowDown = true;
            break;
        case 'ArrowLeft':
            keys.arrowLeft = true;
            break;
        case 'ArrowRight':
            keys.arrowRight = true;
            break;
        // WASD for strafing and forward/back movement
        case 'w':
            keys.w = true;
            break;
        case 's':
            keys.s = true;
            break;
        case 'a':
            keys.a = true;
            break;
        case 'd':
            keys.d = true;
            break;
        // Spacebar to fire
        case ' ':
            keys.space = true;
            break;
    }
}

function handleKeyUp(e) {
    switch(e.key) {
        case 'ArrowUp':
            keys.arrowUp = false;
            break;
        case 'ArrowDown':
            keys.arrowDown = false;
            break;
        case 'ArrowLeft':
            keys.arrowLeft = false;
            break;
        case 'ArrowRight':
            keys.arrowRight = false;
            break;
        case 'w':
            keys.w = false;
            break;
        case 's':
            keys.s = false;
            break;
        case 'a':
            keys.a = false;
            break;
        case 'd':
            keys.d = false;
            break;
        case ' ':
            keys.space = false;
            break;
    }
}

function setupKeyboardControls() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// Start the game when the button is clicked
function startGame() {
    console.log("Starting game...");
    // Hide menu and show game
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    
    // Initialize canvas
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Could not get canvas context!");
        return;
    }
    
    // Set canvas to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 150; // Leave room for controls and scoreboard
    console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
    
    // Initialize player 1
    p1 = {
        x: canvas.width * 0.25,
        y: canvas.height * 0.5,
        angle: 0,
        speed: 0,
        hp: MAX_HP,
        shots: MAX_SHOTS,
        lastShotTime: 0,
        radius: PLAYER_RADIUS,
        color: 'red'
    };

    // Remove p2: set to null until a second player logs in
    p2 = null;
    
    console.log("Player 1 initialized:", p1);
    
    // Initialize walls (arena boundaries)
    walls = [
        // Top wall
        { x: 0, y: 0, width: canvas.width, height: WALL_THICKNESS },
        // Right wall
        { x: canvas.width - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: canvas.height },
        // Bottom wall
        { x: 0, y: canvas.height - WALL_THICKNESS, width: canvas.width, height: WALL_THICKNESS },
        // Left wall
        { x: 0, y: 0, width: WALL_THICKNESS, height: canvas.height }
    ];
    
    // Clear any existing shots and effects
    shots = [];
    visualEffects = [];
    
    // Set game as active
    gameActive = true;
    
    // Initialize touch controls instead of nipplejs
    setupTouchControls();
    setupKeyboardControls(); // NEW: attach keyboard event listeners
    updateScoreboard();
    
    // Make canvas focusable for keyboard events
    canvas.tabIndex = 1;
    canvas.focus();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Start the game loop
    console.log("Starting game loop...");
    gameLoop();
    
    // Draw once immediately to ensure players appear
    draw();
}

// Set up direct touch controls based on unified.html
function setupTouchControls() {
    console.log("Setting up touch controls, enabled:", touchControls.enabled);
    
    if (!touchControls.enabled) return;
    
    // Create touch overlay for visual joysticks
    createTouchOverlay();
    
    // Add touch event listeners to the canvas
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

// Create visual elements for the touch joysticks
function createTouchOverlay() {
    // Create overlay container if it doesn't exist
    let touchOverlay = document.getElementById('touchOverlay');
    if (!touchOverlay) {
        touchOverlay = document.createElement('div');
        touchOverlay.id = 'touchOverlay';
        touchOverlay.style.position = 'absolute';
        touchOverlay.style.top = '0';
        touchOverlay.style.left = '0';
        touchOverlay.style.width = '100%';
        touchOverlay.style.height = '100%';
        touchOverlay.style.pointerEvents = 'none';
        document.getElementById('game-container').appendChild(touchOverlay);
    }
    
    // Create visual joysticks
    const joystickStyles = `
        position: absolute;
        pointer-events: none;
        z-index: 1000;
        display: none;
    `;
    
    const baseStyles = `
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        border: 3px solid rgba(255, 255, 255, 0.7);
        position: absolute;
        transform: translate(-50%, -50%);
    `;
    
    const thumbStyles = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.8);
        border: 2px solid rgba(0, 0, 0, 0.3);
        position: absolute;
        transform: translate(-50%, -50%);
    `;
    
    // Add move joystick
    let moveJoystick = document.createElement('div');
    moveJoystick.id = 'moveJoystick';
    moveJoystick.className = 'joystick';
    moveJoystick.style = joystickStyles;
    moveJoystick.innerHTML = `
        <div class="joystick-base" style="${baseStyles}"></div>
        <div class="joystick-thumb" style="${thumbStyles}"></div>
    `;
    touchOverlay.appendChild(moveJoystick);
    
    // Add aim joystick
    let aimJoystick = document.createElement('div');
    aimJoystick.id = 'aimJoystick';
    aimJoystick.className = 'joystick';
    aimJoystick.style = joystickStyles;
    aimJoystick.innerHTML = `
        <div class="joystick-base" style="${baseStyles}"></div>
        <div class="joystick-thumb" style="${thumbStyles}"></div>
    `;
    touchOverlay.appendChild(aimJoystick);
    
    console.log("Touch overlay created");
}

// Handle touch start events
function handleTouchStart(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    const canvasRect = canvas.getBoundingClientRect();
    const canvasMidX = canvasRect.width / 2;
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchX = touch.clientX - canvasRect.left;
        const touchY = touch.clientY - canvasRect.top;
        
        // Left half of screen - movement joystick
        if (touchX < canvasMidX && !touchControls.moveJoystick.active) {
            touchControls.moveJoystick.active = true;
            touchControls.moveJoystick.identifier = touch.identifier;
            touchControls.moveJoystick.startX = touchX;
            touchControls.moveJoystick.startY = touchY;
            touchControls.moveJoystick.currentX = touchX;
            touchControls.moveJoystick.currentY = touchY;
            
            // Show move joystick
            const joystick = document.getElementById('moveJoystick');
            joystick.style.display = 'block';
            joystick.style.left = touchX + 'px';
            joystick.style.top = touchY + 'px';
            
            const thumb = joystick.querySelector('.joystick-thumb');
            thumb.style.left = '50%';
            thumb.style.top = '50%';
            
            console.log("Move joystick activated");
        }
        // Right half - aim/fire joystick
        else if (touchX >= canvasMidX && !touchControls.aimJoystick.active) {
            touchControls.aimJoystick.active = true;
            touchControls.aimJoystick.identifier = touch.identifier;
            touchControls.aimJoystick.startX = touchX;
            touchControls.aimJoystick.startY = touchY;
            touchControls.aimJoystick.currentX = touchX;
            touchControls.aimJoystick.currentY = touchY;
            
            // Show aim joystick
            const joystick = document.getElementById('aimJoystick');
            joystick.style.display = 'block';
            joystick.style.left = touchX + 'px';
            joystick.style.top = touchY + 'px';
            
            const thumb = joystick.querySelector('.joystick-thumb');
            thumb.style.left = '50%';
            thumb.style.top = '50%';
            
            // Fire when first touching the right side
            if (p1.shots > 0 && Date.now() - p1.lastShotTime > 500) {
                fireShot(p1);
            }
            
            console.log("Aim joystick activated");
        }
    }
}

// Handle touch move events
function handleTouchMove(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    const canvasRect = canvas.getBoundingClientRect();
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchX = touch.clientX - canvasRect.left;
        const touchY = touch.clientY - canvasRect.top;
        
        // Update move joystick
        if (touchControls.moveJoystick.active && touch.identifier === touchControls.moveJoystick.identifier) {
            touchControls.moveJoystick.currentX = touchX;
            touchControls.moveJoystick.currentY = touchY;
            
            // Calculate joystick displacement
            let dx = touchX - touchControls.moveJoystick.startX;
            let dy = touchY - touchControls.moveJoystick.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Limit to max distance
            if (distance > touchControls.maxDistance) {
                dx = dx * touchControls.maxDistance / distance;
                dy = dy * touchControls.maxDistance / distance;
            }
            
            // Update joystick thumb position
            const thumb = document.getElementById('moveJoystick').querySelector('.joystick-thumb');
            thumb.style.left = `calc(50% + ${dx}px)`;
            thumb.style.top = `calc(50% + ${dy}px)`;
            
            // Update player movement values
            if (distance > touchControls.deadzone) {
                touchControls.moveJoystick.moveX = dx / Math.max(distance, 1);
                touchControls.moveJoystick.moveY = dy / Math.max(distance, 1);
                touchControls.moveJoystick.moveSpeed = Math.min(distance / touchControls.maxDistance, 1);
            } else {
                touchControls.moveJoystick.moveX = 0;
                touchControls.moveJoystick.moveY = 0;
                touchControls.moveJoystick.moveSpeed = 0;
            }
        }
        
        // Update aim joystick
        if (touchControls.aimJoystick.active && touch.identifier === touchControls.aimJoystick.identifier) {
            touchControls.aimJoystick.currentX = touchX;
            touchControls.aimJoystick.currentY = touchY;
            
            // Calculate joystick displacement
            let dx = touchX - touchControls.aimJoystick.startX;
            let dy = touchY - touchControls.aimJoystick.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Limit to max distance
            if (distance > touchControls.maxDistance) {
                dx = dx * touchControls.maxDistance / distance;
                dy = dy * touchControls.maxDistance / distance;
            }
            
            // Update joystick thumb position
            const thumb = document.getElementById('aimJoystick').querySelector('.joystick-thumb');
            thumb.style.left = `calc(50% + ${dx}px)`;
            thumb.style.top = `calc(50% + ${dy}px)`;
            
            // Update player aim
            if (distance > touchControls.deadzone) {
                // Set player angle
                p1.angle = Math.atan2(dy, dx);
                
                // Fire when moving joystick far enough
                if (distance > touchControls.maxDistance * 0.7 && 
                    p1.shots > 0 && Date.now() - p1.lastShotTime > 500) {
                    fireShot(p1);
                }
            }
        }
    }
}

// Handle touch end events
function handleTouchEnd(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        
        // Check if this is the move joystick touch
        if (touchControls.moveJoystick.active && touch.identifier === touchControls.moveJoystick.identifier) {
            touchControls.moveJoystick.active = false;
            touchControls.moveJoystick.moveX = 0;
            touchControls.moveJoystick.moveY = 0;
            touchControls.moveJoystick.moveSpeed = 0;
            
            // Hide move joystick
            document.getElementById('moveJoystick').style.display = 'none';
        }
        
        // Check if this is the aim joystick touch
        if (touchControls.aimJoystick.active && touch.identifier === touchControls.aimJoystick.identifier) {
            touchControls.aimJoystick.active = false;
            
            // Hide aim joystick
            document.getElementById('aimJoystick').style.display = 'none';
        }
    }
}

// Collision detection
function checkCollision(x, y, radius) {
    for (const wall of walls) {
        const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.height));
        
        const distanceX = x - closestX;
        const distanceY = y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        
        if (distanceSquared < radius * radius) {
            return true;
        }
    }
    
    return false;
}

// Update player movement
function updatePlayerMovement() {
    // Only update if game is active
    if (!gameActive) return;
    
    // Update player 1 movement based on joystick
    if (touchControls.moveJoystick.moveSpeed > 0) {
        const moveSpeed = PLAYER_SPEED * touchControls.moveJoystick.moveSpeed;
        const moveX = touchControls.moveJoystick.moveX * moveSpeed;
        const moveY = touchControls.moveJoystick.moveY * moveSpeed;
        
        const newX = p1.x + moveX;
        const newY = p1.y + moveY;
        
        // Check for wall collisions and handle movement
        if (!checkCollision(newX, newY, p1.radius)) {
            p1.x = newX;
            p1.y = newY;
        } else {
            // Try horizontal movement only
            if (!checkCollision(p1.x + moveX, p1.y, p1.radius)) {
                p1.x += moveX;
            } 
            // Try vertical movement only
            else if (!checkCollision(p1.x, p1.y + moveY, p1.radius)) {
                p1.y += moveY;
            }
        }
    }

    // Keyboard-based movement:
    // Arrow keys: up = move forward, down = move backward, left/right = rotate (reversal occurs automatically by rotation)
    if (keys.arrowUp) {
        // Move forwards (in facing direction)
        let newX = p1.x + Math.cos(p1.angle) * PLAYER_SPEED;
        let newY = p1.y + Math.sin(p1.angle) * PLAYER_SPEED;
        if (!checkCollision(newX, newY, p1.radius)) { p1.x = newX; p1.y = newY; }
    }
    if (keys.arrowDown) {
        // Move backwards (in opposite facing direction)
        let newX = p1.x - Math.cos(p1.angle) * PLAYER_SPEED;
        let newY = p1.y - Math.sin(p1.angle) * PLAYER_SPEED;
        if (!checkCollision(newX, newY, p1.radius)) { p1.x = newX; p1.y = newY; }
    }
    if (keys.arrowLeft) {
        // Rotate left
        p1.angle -= 0.1; // rotation speed
    }
    if (keys.arrowRight) {
        // Rotate right
        p1.angle += 0.1;
    }

    // WASD for strafing and forward/back:
    if (keys.w) {
        // Also move forward
        let newX = p1.x + Math.cos(p1.angle) * PLAYER_SPEED;
        let newY = p1.y + Math.sin(p1.angle) * PLAYER_SPEED;
        if (!checkCollision(newX, newY, p1.radius)) { p1.x = newX; p1.y = newY; }
    }
    if (keys.s) {
        // Also move backward
        let newX = p1.x - Math.cos(p1.angle) * PLAYER_SPEED;
        let newY = p1.y - Math.sin(p1.angle) * PLAYER_SPEED;
        if (!checkCollision(newX, newY, p1.radius)) { p1.x = newX; p1.y = newY; }
    }
    if (keys.a) {
        // Strafe left (perpendicular to facing)
        let newX = p1.x - Math.sin(p1.angle) * PLAYER_SPEED;
        let newY = p1.y + Math.cos(p1.angle) * PLAYER_SPEED;
        if (!checkCollision(newX, newY, p1.radius)) { p1.x = newX; p1.y = newY; }
    }
    if (keys.d) {
        // Strafe right
        let newX = p1.x + Math.sin(p1.angle) * PLAYER_SPEED;
        let newY = p1.y - Math.cos(p1.angle) * PLAYER_SPEED;
        if (!checkCollision(newX, newY, p1.radius)) { p1.x = newX; p1.y = newY; }
    }
    if (keys.space) {
        // Fire a shot if space is pressed (only fire once per press)
        if (p1.shots > 0 && Date.now() - p1.lastShotTime > 500) {
            fireShot(p1);
            keys.space = false; // reset to avoid continual firing
        }
    }
    
    // For demo purposes, move second player only if exists
    if (p2) {
        moveAI(p2, p1);
    }
}

// Simple AI movement for player 2 (for testing)
function moveAI(ai, target) {
    // Calculate angle to player
    const dx = target.x - ai.x;
    const dy = target.y - ai.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);
    
    // Only move if not too close
    if (distToPlayer > 100) {
        ai.angle = Math.atan2(dy, dx);
        
        // Move toward player
        const moveSpeed = PLAYER_SPEED * 0.5; // Slower than player
        const moveX = Math.cos(ai.angle) * moveSpeed;
        const moveY = Math.sin(ai.angle) * moveSpeed;
        
        const newX = ai.x + moveX;
        const newY = ai.y + moveY;
        
        // Check collisions
        if (!checkCollision(newX, newY, ai.radius)) {
            ai.x = newX;
            ai.y = newY;
        }
    }
    
    // Occasionally fire at player
    if (Math.random() < 0.01 && ai.shots > 0 && Date.now() - ai.lastShotTime > 1000) {
        fireShot(ai);
    }
}

// Fire a shot
function fireShot(player) {
    if (player.shots <= 0) return;
    
    player.shots--;
    player.lastShotTime = Date.now();
    
    // Create a shot
    const shot = {
        x: player.x + Math.cos(player.angle) * (player.radius + 5),
        y: player.y + Math.sin(player.angle) * (player.radius + 5),
        angle: player.angle,
        speed: SHOT_SPEED,
        owner: player === p1 ? 'p1' : 'p2',
        radius: 3
    };
    
    shots.push(shot);
    
    // Create muzzle flash effect
    visualEffects.push({
        type: EFFECT_TYPES.MUZZLE_FLASH,
        x: shot.x,
        y: shot.y,
        angle: shot.angle,
        size: 5,
        duration: 120,
        startTime: Date.now(),
        opacity: 0.8
    });
    
    // Schedule reload
    setTimeout(() => {
        if (player.shots < MAX_SHOTS) {
            player.shots++;
            updateScoreboard();
        }
    }, RELOAD_TIME);
    
    updateScoreboard();
}

// Update shots and check for collisions
function updateShots() {
    for (let i = shots.length - 1; i >= 0; i--) {
        const shot = shots[i];
        
        // Move the shot
        shot.x += Math.cos(shot.angle) * shot.speed;
        shot.y += Math.sin(shot.angle) * shot.speed;
        
        // Check for wall collisions
        if (checkCollision(shot.x, shot.y, shot.radius)) {
            shots.splice(i, 1);
            continue;
        }
        
        // Check for out of bounds
        if (shot.x < 0 || shot.x > canvas.width || shot.y < 0 || shot.y > canvas.height) {
            shots.splice(i, 1);
            continue;
        }
        
        // Check for player hits
        const target = shot.owner === 'p1' ? p2 : p1;
        const dx = shot.x - target.x;
        const dy = shot.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < target.radius + shot.radius) {
            // Hit detected
            target.hp--;
            updateScoreboard();
            
            // Create hit effect
            createHitEffect(target.x, target.y, target.color);
            
            // Create player damage flash
            visualEffects.push({
                type: EFFECT_TYPES.PLAYER_DAMAGE,
                target: target === p1 ? 'p1' : 'p2',
                startTime: Date.now(),
                duration: 400,
                intensity: 0.6
            });
            
            // Remove the shot
            shots.splice(i, 1);
            
            // Check for game over
            if (target.hp <= 0) {
                endGame(shot.owner);
            }
        }
    }
}

// Create hit effect with particles
function createHitEffect(x, y, color) {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        const size = 1.5 + Math.random();
        
        visualEffects.push({
            type: EFFECT_TYPES.HIT,
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            color: color,
            duration: 400,
            startTime: Date.now(),
            opacity: 0.9
        });
    }
}

// Update visual effects
function updateVisualEffects() {
    const currentTime = Date.now();
    
    // Filter out completed effects
    visualEffects = visualEffects.filter(effect => {
        return currentTime - effect.startTime < effect.duration;
    });
    
    // Update particle positions
    visualEffects.forEach(effect => {
        if (effect.type === EFFECT_TYPES.HIT) {
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.vx *= 0.95;
            effect.vy *= 0.95;
            effect.opacity = 1 - (currentTime - effect.startTime) / effect.duration;
        }
    });
}

// Draw everything
function draw() {
    if (!canvas || !ctx) {
        console.error("Canvas or context is not initialized!");
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw arena - use white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw walls
    ctx.fillStyle = '#333';
    for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }
    
    // Draw shots
    ctx.fillStyle = '#000';
    for (const shot of shots) {
        ctx.beginPath();
        ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Debug log for player positions
    if (debugMode) {
        console.log(`P1: ${p1.x.toFixed(1)}, ${p1.y.toFixed(1)}`);
        console.log(`P2: ${p2?.x.toFixed(1)}, ${p2?.y.toFixed(1)}`);
    }
    
    // Draw players
    drawPlayer(p1);
    // Draw player 2 only if exists
    if (p2) {
        drawPlayer(p2);
    }
    
    // Draw visual effects
    drawVisualEffects();
}

// Draw a player
function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // Player body
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    
    // Direction indicator
    ctx.beginPath();
    ctx.moveTo(player.radius, 0);
    ctx.lineTo(player.radius - 5, -5);
    ctx.lineTo(player.radius - 5, 5);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    
    // Health bar
    const barWidth = player.radius * 2;
    const barHeight = 4;
    const barY = -player.radius - 10;
    
    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
    
    // Health segments
    const segmentWidth = barWidth / MAX_HP;
    for (let i = 0; i < player.hp; i++) {
        // Color based on health
        if (player.hp <= MAX_HP * 0.2) ctx.fillStyle = 'red';
        else if (player.hp <= MAX_HP * 0.6) ctx.fillStyle = 'orange';
        else ctx.fillStyle = 'green';
        
        ctx.fillRect(-barWidth/2 + i * segmentWidth, barY, segmentWidth - 1, barHeight);
    }
    
    // Shot indicators
    const indicatorY = barY - 7;
    const indicatorRadius = 2;
    const indicatorSpacing = 6;
    
    for (let i = 0; i < MAX_SHOTS; i++) {
        ctx.beginPath();
        ctx.arc(-barWidth/4 + i * indicatorSpacing, indicatorY, indicatorRadius, 0, Math.PI * 2);
        
        if (i < player.shots) {
            ctx.fillStyle = 'white';
        } else {
            ctx.fillStyle = '#666';
        }
        
        ctx.fill();
    }
    
    ctx.restore();
}

// Draw visual effects
function drawVisualEffects() {
    const currentTime = Date.now();
    
    visualEffects.forEach(effect => {
        ctx.save();
        
        if (effect.type === EFFECT_TYPES.MUZZLE_FLASH) {
            // Draw muzzle flash
            ctx.translate(effect.x, effect.y);
            ctx.rotate(effect.angle);
            
            const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, effect.size * 1.5);
            gradient.addColorStop(0, `rgba(255, 200, 50, ${effect.opacity})`);
            gradient.addColorStop(0.4, `rgba(255, 120, 20, ${effect.opacity * 0.7})`);
            gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, effect.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = `rgba(255, 255, 200, ${effect.opacity})`;
            ctx.beginPath();
            ctx.arc(0, 0, effect.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (effect.type === EFFECT_TYPES.HIT) {
            // Draw hit particles
            ctx.globalAlpha = effect.opacity;
            ctx.fillStyle = effect.color;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    });
    
    // Draw player damage flash if active
    const p1DamageEffect = visualEffects.find(effect => 
        effect.type === EFFECT_TYPES.PLAYER_DAMAGE && effect.target === 'p1');
    
    if (p1DamageEffect) {
        const progress = (currentTime - p1DamageEffect.startTime) / p1DamageEffect.duration;
        const intensity = (1 - progress) * p1DamageEffect.intensity;
        
        ctx.save();
        ctx.translate(p1.x, p1.y);
        ctx.strokeStyle = `rgba(255, 0, 0, ${intensity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p1.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    const p2DamageEffect = visualEffects.find(effect => 
        effect.type === EFFECT_TYPES.PLAYER_DAMAGE && effect.target === 'p2');
    
    if (p2DamageEffect) {
        const progress = (currentTime - p2DamageEffect.startTime) / p2DamageEffect.duration;
        const intensity = (1 - progress) * p2DamageEffect.intensity;
        
        ctx.save();
        ctx.translate(p2.x, p2.y);
        ctx.strokeStyle = `rgba(255, 0, 0, ${intensity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p2.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Update scoreboard
function updateScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = `
        <div class="player-info">
            <div class="player player-1">Player 1: ${p1?.hp || MAX_HP} HP, ${p1?.shots || MAX_SHOTS} Shots</div>
            <div class="player player-2">
                ${p2 ? `Player 2: ${p2.hp} HP, ${p2.shots} Shots` : 'Waiting for Player 2...'}
            </div>
        </div>
    `;
}

// Game over handling
function endGame(winner) {
    gameActive = false;
    
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = `
        <div class="game-over">
            <h2>${winner === 'p1' ? 'Player 1' : 'Player 2'} Wins!</h2>
            <button id="restart-game">Play Again</button>
        </div>
    `;
    
    document.getElementById('restart-game').addEventListener('click', restartGame);
}

// Restart the game
function restartGame() {
    // Reset player 1
    p1.x = canvas.width * 0.25;
    p1.y = canvas.height * 0.5;
    p1.hp = MAX_HP;
    p1.shots = MAX_SHOTS;
    
    // For player 2, if present, reset its values; otherwise, leave p2 as null
    if (p2) {
        p2.x = canvas.width * 0.75;
        p2.y = canvas.height * 0.5;
        p2.hp = MAX_HP;
        p2.shots = MAX_SHOTS;
    }
    
    // Clear shots and effects
    shots = [];
    visualEffects = [];
    
    // Reset game state
    gameActive = true;
    
    // Update scoreboard
    updateScoreboard();
}

// Handle window resize
function handleResize() {
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 150; // Leave room for controls and scoreboard
    
    // Update wall positions
    walls = [
        { x: 0, y: 0, width: canvas.width, height: WALL_THICKNESS },
        { x: canvas.width - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: canvas.height },
        { x: 0, y: canvas.height - WALL_THICKNESS, width: canvas.width, height: WALL_THICKNESS },
        { x: 0, y: 0, width: WALL_THICKNESS, height: canvas.height }
    ];
}

// Game loop
function gameLoop() {
    if (gameActive) {
        updatePlayerMovement();
        updateShots();
        updateVisualEffects();
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Toggle debug mode with D key
document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
        debugMode = !debugMode;
        console.log("Debug mode:", debugMode);
    }
});

// Event listener for start button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-game').addEventListener('click', startGame);
    console.log("Event listener added for start button");
});