// Fire an arrow from the player
function fireArrow() {
    if (gameOver) return;
    
    if (arrowCount > 0) {
        // Create a new arrow
        const newArrow = {
            x: player.x,
            y: player.y,
            angle: player.angle,
            speed: ARROW_SPEED,
            stuckTime: 0,
            isStuck: false,
            stuckX: 0,
            stuckY: 0
        };
        
        // Add arrow to array
        arrows.push(newArrow);
        
        // Create muzzle flash effect
        const muzzleOffset = 12;
        const flashX = player.x + Math.cos(player.angle) * muzzleOffset;
        const flashY = player.y + Math.sin(player.angle) * muzzleOffset;
        
        visualEffects.push({
            type: 'muzzle_flash',
            x: flashX,
            y: flashY,
            angle: player.angle,
            size: 5,
            duration: 120,
            startTime: performance.now(),
            opacity: 0.8
        });
        
        // Decrease arrow count and update display
        arrowCount--;
        arrowCountDisplay.textContent = arrowCount;
    }
}

// Update arrows (movement and collision)
function updateArrows() {
    if (gameOver) return;
    
    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];
        
        if (arrow.isStuck) {
            // If arrow is stuck in a wall, count down its "stuck time"
            arrow.stuckTime++;
            if (arrow.stuckTime > 120) { // 2 seconds at 60fps
                arrows.splice(i, 1);
                arrowCount++;
                arrowCountDisplay.textContent = arrowCount;
            }
            continue;
        }
        
        // Move the arrow
        const newX = arrow.x + Math.cos(arrow.angle) * arrow.speed;
        const newY = arrow.y + Math.sin(arrow.angle) * arrow.speed;
        
        // Check for collision with walls
        let collision = false;
        for (const wall of walls) {
            const lineStart = { x: arrow.x, y: arrow.y };
            const lineEnd = { x: newX, y: newY };
            
            if (lineIntersectsRect(lineStart, lineEnd, wall)) {
                arrow.isStuck = true;
                arrow.stuckTime = 0;
                // Position the arrow at the wall
                const intersection = findIntersection(lineStart, lineEnd, wall);
                arrow.stuckX = intersection.x;
                arrow.stuckY = intersection.y;
                collision = true;
                break;
            }
        }
        
        if (!collision) {
            arrow.x = newX;
            arrow.y = newY;
            
            // Check if arrow has traveled too far
            const distanceTraveled = Math.sqrt(
                Math.pow(arrow.x - player.x, 2) + Math.pow(arrow.y - player.y, 2)
            );
            if (distanceTraveled > window.innerWidth / 3 * 0.8) {
                arrows.splice(i, 1);
                arrowCount++;
                arrowCountDisplay.textContent = arrowCount;
            }
        }
    }
}

// Process arrow collisions (now only with walls since we removed spiders)
function checkArrowCollisions() {
    // Since we've removed spiders and nests, this only needs to check
    // wall collisions, which is already handled in updateArrows
}
