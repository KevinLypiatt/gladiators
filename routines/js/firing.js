function fireArrow() {
    if (gameOver) return;
    console.log("Attempting to fire arrow, count:", arrowCount);
    
    if (arrowCount > 0) {
        // Create arrow
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
        
        arrows.push(newArrow);
        
        // Create muzzle flash
        const muzzleOffset = 12;
        const flashX = player.x + Math.cos(player.angle) * muzzleOffset;
        const flashY = player.y + Math.sin(player.angle) * muzzleOffset;
        
        createVisualEffect(EFFECT_TYPES.MUZZLE_FLASH, flashX, flashY, player.angle);
        
        // Update arrow count
        arrowCount--;
        arrowCountDisplay.textContent = arrowCount;
    }
}

function updateArrows() {
    if (gameOver) return;
    
    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];
        
        if (arrow.isStuck) {
            arrow.stuckTime++;
            if (arrow.stuckTime > 120) { // 2 seconds at 60fps
                arrows.splice(i, 1);
                arrowCount++;
                arrowCountDisplay.textContent = arrowCount;
            }
            continue;
        }
        
        const newX = arrow.x + Math.cos(arrow.angle) * arrow.speed;
        const newY = arrow.y + Math.sin(arrow.angle) * arrow.speed;
        
        // Check wall collisions
        let collision = false;
        for (const wall of walls) {
            if (lineIntersectsRect(
                {x: arrow.x, y: arrow.y},
                {x: newX, y: newY},
                wall
            )) {
                arrow.isStuck = true;
                arrow.stuckTime = 0;
                const intersection = findIntersection(
                    {x: arrow.x, y: arrow.y},
                    {x: newX, y: newY},
                    wall
                );
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
            const distanceTraveled = Math.hypot(arrow.x - player.x, arrow.y - player.y);
            if (distanceTraveled > window.innerWidth / 3 * 0.8) {
                arrows.splice(i, 1);
                arrowCount++;
                arrowCountDisplay.textContent = arrowCount;
            }
        }
    }
}

function checkArrowCollisions() {
    if (gameOver) return;
    
    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];
        
        // Check arrow collision with spiders
        for (let j = spiders.length - 1; j >= 0; j--) {
            const spider = spiders[j];
            
            // Skip spiders that are already dying
            if (spider.state === SPIDER_STATES.DYING) continue;
            
            // Check distance
            if (Math.hypot(arrow.x - spider.x, arrow.y - spider.y) < 11) {
                // Check if there's a wall between arrow and spider
                const lineBlocked = walls.some(wall => 
                    lineIntersectsRect(
                        {x: arrow.x, y: arrow.y}, 
                        {x: spider.x, y: spider.y}, 
                        wall
                    )
                );
                
                if (!lineBlocked) {
                    // Create hit effect
                    createHitEffect(EFFECT_TYPES.SPIDER_HIT, spider.x, spider.y, 6);
                    
                    // Reduce spider health
                    spider.health--;
                    
                    // Handle retreat behavior when health is critical
                    if (spider.health === 1) {
                        spider.state = SPIDER_STATES.RETREAT;
                        spider.lastStateChange = performance.now();
                    }
                    
                    // Handle spider death
                    if (spider.health <= 0) {
                        spider.state = SPIDER_STATES.DYING;
                        spider.deathStartTime = performance.now();
                        spider.opacity = 1.0;
                        spider.speed = 0;
                        createHitEffect(EFFECT_TYPES.SPIDER_HIT, spider.x, spider.y, 12, 1.0);
                    }
                    
                    // Remove arrow
                    arrows.splice(i, 1);
                    arrowCount++;
                    arrowCountDisplay.textContent = arrowCount;
                    break;
                }
            }
        }
        
        // Check nest collisions if arrow still exists
        if (i >= 0 && i < arrows.length) {
            for (let k = nests.length - 1; k >= 0; k--) {
                const nest = nests[k];
                const distance = Math.hypot(arrow.x - nest.x, arrow.y - nest.y);
                
                if (distance < 25) { // Nest radius
                    nest.hp--;
                    createHitEffect(EFFECT_TYPES.NEST_HIT, nest.x, nest.y, 10);
                    
                    arrows.splice(i, 1);
                    arrowCount++;
                    arrowCountDisplay.textContent = arrowCount;
                    
                    // Handle nest destruction
                    if (nest.hp <= 0) {
                        createHitEffect(EFFECT_TYPES.NEST_HIT, nest.x, nest.y, 20, 1.3);
                        nests.splice(k, 1);
                        document.getElementById("nestCount").textContent = nests.length;
                        
                        // Check win condition
                        if (nests.length === 0 && spiders.length === 0) {
                            checkWinCondition();
                        }
                    }
                    break;
                }
            }
        }
    }
}
