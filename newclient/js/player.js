function spawnPlayer() {
    const mazeWidth = MAZE_COLS * ROOM_SIZES[2].width;
    const mazeHeight = MAZE_ROWS * ROOM_SIZES[2].height;
    let attempts = 0;
    do {
        player.x = player.radius + Math.random() * (mazeWidth - 2 * player.radius);
        player.y = player.radius + Math.random() * (mazeHeight - 2 * player.radius);
        attempts++;
    } while (checkCollision(player.x, player.y) && attempts < 100);
}

function updatePlayer() {
    if (gameOver || gameWon) return;
    
    // Start timer on first movement
    if (!gameTimerStarted && (movingForward || movingBackward || rotatingLeft || 
        rotatingRight || strafingLeft || strafingRight || 
        touchControls.moveJoystick.moveSpeed > 0)) {
        gameStartTime = performance.now();
        gameTimerStarted = true;
        document.getElementById("gameTimer").style.display = "block";
        console.log("Game timer started!");
    }
    
    // Handle rotation
    if (rotatingLeft) {
        player.angle -= player.rotationSpeed;
    }
    if (rotatingRight) {
        player.angle += player.rotationSpeed;
    }
    
    // Normalize angle
    player.angle = ((player.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    
    // Process touch movement (always check, regardless of joystick active state)
    applyTouchMovement();
    
    // Process keyboard movement
    // Calculate movement vectors for keyboard controls
    const dx = Math.cos(player.angle);
    const dy = Math.sin(player.angle);
    
    // Calculate perpendicular vector (RIGHT direction)
    const rightX = -dy;
    const rightY = dx;
    
    // Use simplified strafing logic with ternary operators
    const angleDeg = player.angle * 180 / Math.PI;
    const isFacingDown = angleDeg > 0 && angleDeg < 180;
    
    // Simplified strafe direction calculation
    const strafeRightX = isFacingDown ? -rightX : rightX;
    const strafeRightY = isFacingDown ? -rightY : rightY;
    
    // Initialize movement with zero
    let moveX = 0;
    let moveY = 0;
    
    // Add forward/backward movement
    if (movingForward) {
        moveX += dx * player.maxSpeed;
        moveY += dy * player.maxSpeed;
    }
    if (movingBackward) {
        moveX -= dx * player.maxSpeed * 0.5;
        moveY -= dy * player.maxSpeed * 0.5;
    }
    
    // Apply strafe movement using the simplified vectors
    if (strafingLeft) {
        moveX -= strafeRightX * player.maxSpeed * 0.8;
        moveY -= strafeRightY * player.maxSpeed * 0.8;
    }
    if (strafingRight) {
        moveX += strafeRightX * player.maxSpeed * 0.8;
        moveY += strafeRightY * player.maxSpeed * 0.8;
    }
    
    // Apply keyboard movement if any keys are pressed
    if (movingForward || movingBackward || strafingLeft || strafingRight) {
        // Try to move
        let newX = player.x + moveX;
        let newY = player.y + moveY;
        
        // Check for collisions and handle movement
        if (!checkCollision(newX, newY)) {
            // No collision, move normally
            player.x = newX;
            player.y = newY;
        } else {
            // Try horizontal movement only
            if (!checkCollision(player.x + moveX, player.y)) {
                player.x += moveX;
            } 
            // Try vertical movement only
            else if (!checkCollision(player.x, player.y + moveY)) {
                player.y += moveY;
            }
        }
    }
    
    updateCamera();
}

function drawDebugIndicators() {
    // Only draw in debug mode
    if (!window.debugMode) return;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Forward direction (green)
    const fwdX = Math.cos(player.angle) * 40;
    const fwdY = Math.sin(player.angle) * 40;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(fwdX, fwdY);
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Calculate strafe vectors with the compact code
    const rightX = -Math.sin(player.angle);
    const rightY = Math.cos(player.angle);
    const angleDeg = player.angle * 180 / Math.PI;
    const isFacingDown = angleDeg > 0 && angleDeg < 180;
    
    // Use ternary operators for more concise code
    const strafeRightX = isFacingDown ? -rightX : rightX;
    const strafeRightY = isFacingDown ? -rightY : rightY;
    
    // Calculate the angle for active strafing (if any)
    const strafeAngle = strafingLeft ? 
        Math.atan2(-strafeRightY, -strafeRightX) : 
        Math.atan2(strafeRightY, strafeRightX);
    
    // Draw strafe right vector (blue)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(strafeRightX * 30, strafeRightY * 30);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // If actively strafing, draw the movement vector in red
    if (strafingLeft || strafingRight) {
        const magnitude = 50; // Length of the strafe indicator
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
            Math.cos(strafeAngle) * magnitude,
            Math.sin(strafeAngle) * magnitude
        );
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Show which strafe direction is active
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(-50, -65, 100, 24);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`STRAFING ${strafingLeft ? "LEFT" : "RIGHT"}`, 0, -50);
    }
    
    // Add status indicator showing the strafing mode
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-90, -80, 180, 24);
    ctx.fillStyle = isFacingDown ? '#ffaa00' : '#00ffaa';
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Strafe mode: ${isFacingDown ? "FLIPPED" : "NORMAL"}`, 0, -65);
    
    // Calculate positions for A/D labels with proper scaling
    const labelDistance = 45; // Distance from player for labels
    
    // Left label background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(
        -strafeRightX * labelDistance - 15,
        -strafeRightY * labelDistance - 10,
        30, 20
    );
    
    // Right label background
    ctx.fillRect(
        strafeRightX * labelDistance - 15,
        strafeRightY * labelDistance - 10,
        30, 20
    );
    
    // Draw strafe indicators with larger font
    const leftLabel = "A ←";
    const rightLabel = "→ D";
    ctx.font = "14px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(leftLabel, -strafeRightX * labelDistance, -strafeRightY * labelDistance);
    ctx.fillText(rightLabel, strafeRightX * labelDistance, strafeRightY * labelDistance);
    
    // Draw angle indicator at the top with more details
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-55, -50, 110, 24);
    ctx.fillStyle = 'yellow';
    ctx.fillText(`Angle: ${Math.round(angleDeg)}°`, 0, -38);
    
    ctx.restore();
    
    // Draw touch control debug info if active
    if (touchControls.moveJoystick.active) {
        const dx = touchControls.moveJoystick.currentX - touchControls.moveJoystick.startX;
        const dy = touchControls.moveJoystick.currentY - touchControls.moveJoystick.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalizedX = dx / Math.max(distance, 0.001);
        const normalizedY = dy / Math.max(distance, 0.001);
        
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Draw touch movement vector (purple)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(normalizedX * 50, normalizedY * 50);
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Label it
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(-70, 40, 140, 24);
        ctx.fillStyle = '#ff88ff';
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Touch Move: (${normalizedX.toFixed(1)}, ${normalizedY.toFixed(1)})`, 0, 55);
        
        ctx.restore();
    }
    
    // Draw touch control movement vector if active
    if (touchControls.moveJoystick.moveSpeed > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Draw touch movement vector (purple)
        const moveLen = touchControls.moveJoystick.moveSpeed * 60;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
            touchControls.moveJoystick.moveX * moveLen,
            touchControls.moveJoystick.moveY * moveLen
        );
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Label it
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(-85, 40, 170, 24);
        ctx.fillStyle = '#ff88ff';
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `Touch: (${touchControls.moveJoystick.moveX.toFixed(1)}, ${touchControls.moveJoystick.moveY.toFixed(1)}) × ${touchControls.moveJoystick.moveSpeed.toFixed(1)}`, 
            0, 55
        );
        
        ctx.restore();
    }
}