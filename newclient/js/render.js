// Draw the game world
function render() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply camera transform
    ctx.translate(-camera.x, -camera.y);
    
    // Draw game elements
    drawWalls();
    drawArrows();
    drawPlayer();
    
    // Draw debug indicators if enabled
    if (window.debugMode) {
        drawDebugIndicators();
    }
    
    // Draw visual effects
    drawVisualEffects();
    
    ctx.restore();
    
    // Draw screen-space effects like damage flash
    drawScreenEffects();
    
    // Draw debug mode indicator
    if (window.debugMode) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(canvas.width - 110, 5, 105, 24);
        ctx.font = "16px Arial";
        ctx.fillStyle = "#00ff00";
        ctx.fillText("DEBUG MODE", canvas.width - 100, 22);
    }
}

// Draw walls
function drawWalls() {
    const mazeWidth = MAZE_COLS * ROOM_SIZES[2].width;
    const mazeHeight = MAZE_ROWS * ROOM_SIZES[2].height;
    
    // Draw outer boundary
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, mazeWidth, mazeHeight);
    
    // Draw inner walls
    ctx.fillStyle = 'black';
    for (const wall of walls) {
        // Only draw walls that are potentially visible
        if (wall.x + wall.width >= camera.x && 
            wall.x <= camera.x + canvas.width &&
            wall.y + wall.height >= camera.y && 
            wall.y <= camera.y + canvas.height) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
    }
}

// Draw arrows
function drawArrows() {
    for (const arrow of arrows) {
        ctx.save();
        if (arrow.isStuck) {
            // Draw stuck arrow
            ctx.translate(arrow.stuckX, arrow.stuckY);
            ctx.rotate(arrow.angle);
        } else {
            // Draw moving arrow
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.angle);
        }
        
        // Draw arrow body
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, 0);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw arrow head
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-4, 3);
        ctx.lineTo(-4, -3);
        ctx.closePath();
        ctx.fillStyle = 'black';
        ctx.fill();
        
        ctx.restore();
    }
}

// Draw player
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // Draw player circle
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    
    // Draw direction indicator
    ctx.beginPath();
    ctx.moveTo(player.radius, 0);
    ctx.lineTo(player.radius - 5, -5);
    ctx.lineTo(player.radius - 5, 5);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
}

// Draw visual effects
function drawVisualEffects() {
    const currentTime = performance.now();
    
    visualEffects.forEach(effect => {
        ctx.save();
        
        if (effect.type === 'muzzle_flash') {
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
        
        ctx.restore();
    });
}

// Draw screen-space effects
function drawScreenEffects() {
    // Nothing to draw here since player damage effects were related to spiders
}

// Draw debug indicators
function drawDebugIndicators() {
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
    
    // Calculate strafe vectors
    const rightX = -Math.sin(player.angle);
    const rightY = Math.cos(player.angle);
    const angleDeg = player.angle * 180 / Math.PI;
    const isFacingDown = angleDeg > 0 && angleDeg < 180;
    
    const strafeRightX = isFacingDown ? -rightX : rightX;
    const strafeRightY = isFacingDown ? -rightY : rightY;
    
    // Draw strafe right vector (blue)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(strafeRightX * 30, strafeRightY * 30);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
}

function updateUI() {
    arrowCountDisplay.textContent = arrowCount;
    livesCountDisplay.textContent = characterLives;
    document.getElementById("spiderCount").textContent = spiders.length;
}