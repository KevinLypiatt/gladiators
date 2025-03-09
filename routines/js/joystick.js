function setupTouchControls() {
    // Check if device supports touch events
    touchControls.enabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!touchControls.enabled) {
        console.log("Touch controls not supported");
        return;
    }
    
    console.log("Setting up touch controls");
    
    // Create touch overlay
    const gameContainer = document.querySelector('.game-container');
    let touchOverlay = document.getElementById('touchControls');
    if (!touchOverlay) {
        touchOverlay = document.createElement('div');
        touchOverlay.id = 'touchControls';
        touchOverlay.style.position = 'absolute';
        touchOverlay.style.top = '0';
        touchOverlay.style.left = '0';
        touchOverlay.style.width = '100%';
        touchOverlay.style.height = '100%';
        touchOverlay.style.zIndex = '1000';
        gameContainer.appendChild(touchOverlay);
        
        // Create joystick elements with explicit visibility
        ['moveJoystick', 'aimJoystick'].forEach(id => {
            const joystick = document.createElement('div');
            joystick.id = id;
            joystick.className = 'joystick';
            joystick.style.display = 'none';
            joystick.style.position = 'absolute';
            joystick.style.zIndex = '1001';
            joystick.innerHTML = `
                <div class="joystick-base"></div>
                <div class="joystick-thumb"></div>
            `;
            touchOverlay.appendChild(joystick);
        });
    }
    
    // Update touch control styles
    addTouchControlStyles();
    
    // Add touch event listeners to overlay instead of canvas
    touchOverlay.addEventListener('touchstart', handleTouchStart, { passive: false });
    touchOverlay.addEventListener('touchmove', handleTouchMove, { passive: false });
    touchOverlay.addEventListener('touchend', handleTouchEnd, { passive: false });
    touchOverlay.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    // Update focus message for touch devices
    document.getElementById("focusMessage").innerHTML = 
        "Tap to play<br>Left side: Move, Right side: Aim & Shoot";
}

function addTouchControlStyles() {
    let style = document.getElementById('touchControlStyles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'touchControlStyles';
        style.textContent = `
            .joystick {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
            }
            .joystick-base {
                width: ${touchControls.joystickSize * 2}px;
                height: ${touchControls.joystickSize * 2}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                border: 3px solid rgba(255, 255, 255, 0.7);
                position: absolute;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            }
            .joystick-thumb {
                width: ${touchControls.joystickSize}px;
                height: ${touchControls.joystickSize}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.8);
                border: 2px solid rgba(0, 0, 0, 0.3);
                position: absolute;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 5px rgba(0,0,0,0.3);
            }
            @media (max-width: 768px) {
                .info {
                    font-size: 14px;
                    padding: 5px;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 5px;
                }
                .timer {
                    font-size: 14px;
                }
                #focusMessage {
                    font-size: 18px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function handleTouchStart(e) {
    e.preventDefault(); // Prevent scrolling
    
    // Hide focus message
    document.getElementById("focusMessage").style.opacity = "0";
    
    // Start timer if this is first interaction
    if (!gameTimerStarted) {
        gameStartTime = performance.now();
        gameTimerStarted = true;
        document.getElementById("gameTimer").style.display = "block";
    }
    
    // Determine which side of screen was touched
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
            
            // Show move joystick - ensure it's visible by adding correct CSS positioning
            const joystick = document.getElementById('moveJoystick');
            joystick.style.display = 'block';
            joystick.style.left = touchX + 'px';
            joystick.style.top = touchY + 'px';
            
            const thumb = joystick.querySelector('.joystick-thumb');
            thumb.style.left = '0px';
            thumb.style.top = '0px';
            
            // Fire arrow on left joystick activation too
            fireArrow();
        }
        // Right half - aim/fire joystick
        else if (touchX >= canvasMidX && !touchControls.aimJoystick.active) {
            touchControls.aimJoystick.active = true;
            touchControls.aimJoystick.identifier = touch.identifier;
            touchControls.aimJoystick.startX = touchX;
            touchControls.aimJoystick.startY = touchY;
            touchControls.aimJoystick.currentX = touchX;
            touchControls.aimJoystick.currentY = touchY;
            
            // Show aim joystick - ensure it's visible by adding correct CSS positioning
            const joystick = document.getElementById('aimJoystick');
            joystick.style.display = 'block';
            joystick.style.left = touchX + 'px';
            joystick.style.top = touchY + 'px';
            
            const thumb = joystick.querySelector('.joystick-thumb');
            thumb.style.left = '0px';
            thumb.style.top = '0px';
            
            // Fire arrow when aim joystick is first touched
            fireArrow();
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault(); // Prevent scrolling
    
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
            
            // Update joystick thumb position using absolute positioning
            const thumb = document.getElementById('moveJoystick').querySelector('.joystick-thumb');
            thumb.style.left = (dx) + 'px';
            thumb.style.top = (dy) + 'px';
            
            // Update player movement based on joystick position
            updatePlayerFromMoveJoystick(dx, dy, distance);
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
            
            // Update joystick thumb position using absolute positioning
            const thumb = document.getElementById('aimJoystick').querySelector('.joystick-thumb');
            thumb.style.left = (dx) + 'px';
            thumb.style.top = (dy) + 'px';
            
            // Update player aim based on joystick position
            updatePlayerAimFromJoystick(dx, dy, distance);
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        
        // Check if this is the move joystick touch
        if (touchControls.moveJoystick.active && touch.identifier === touchControls.moveJoystick.identifier) {
            touchControls.moveJoystick.active = false;
            
            // Reset movement parameters to stop movement when touch ends
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

function updatePlayerFromMoveJoystick(dx, dy, distance) {
    // Only update movement values if outside deadzone
    if (distance > touchControls.deadzone) {
        // Calculate normalized direction vector
        touchControls.moveJoystick.moveX = dx / distance;
        touchControls.moveJoystick.moveY = dy / distance;
        
        // Calculate speed factor (0 to 1) based on how far joystick is pushed
        touchControls.moveJoystick.moveSpeed = Math.min(distance / touchControls.maxDistance, 1.0);
        
        // Log movement parameters if in debug mode
        if (window.debugMode) {
            console.log(`Touch joystick: Direction (${touchControls.moveJoystick.moveX.toFixed(2)}, ${touchControls.moveJoystick.moveY.toFixed(2)}), Speed: ${touchControls.moveJoystick.moveSpeed.toFixed(2)}`);
        }
    } else {
        // If in deadzone, no movement
        touchControls.moveJoystick.moveX = 0;
        touchControls.moveJoystick.moveY = 0;
        touchControls.moveJoystick.moveSpeed = 0;
    }
}

function updatePlayerAimFromJoystick(dx, dy, distance) {
    // Set aiming direction only if outside deadzone
    if (distance > touchControls.deadzone) {
        // Calculate angle from joystick (in screen coordinates)
        const angle = Math.atan2(dy, dx);
        
        // Update player's angle directly
        player.angle = angle;
    }
}

function applyTouchMovement() {
    if (touchControls.moveJoystick.moveSpeed > 0) {
        // Calculate actual movement speed based on joystick position
        const moveSpeed = player.maxSpeed * touchControls.moveJoystick.moveSpeed;
        
        // Calculate new position
        let newX = player.x + touchControls.moveJoystick.moveX * moveSpeed;
        let newY = player.y + touchControls.moveJoystick.moveY * moveSpeed;
        
        // Check for collisions and handle movement
        if (!checkCollision(newX, newY)) {
            // No collision, move normally
            player.x = newX;
            player.y = newY;
        } else {
            // Try horizontal movement only
            if (!checkCollision(player.x + touchControls.moveJoystick.moveX * moveSpeed, player.y)) {
                player.x += touchControls.moveJoystick.moveX * moveSpeed;
            } 
            // Try vertical movement only
            else if (!checkCollision(player.x, player.y + touchControls.moveJoystick.moveY * moveSpeed)) {
                player.y += touchControls.moveJoystick.moveY * moveSpeed;
            }
        }
    }
}