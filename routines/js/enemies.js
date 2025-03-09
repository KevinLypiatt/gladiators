function spawnNest() {
    const mazeWidth = MAZE_COLS * ROOM_SIZES[2].width;
    const mazeHeight = MAZE_ROWS * ROOM_SIZES[2].height;
    let attempts = 0;
    let nestX, nestY;
    const nestRadius = 20;
    
    do {
        nestX = nestRadius + Math.random() * (mazeWidth - 2 * nestRadius);
        nestY = nestRadius + Math.random() * (mazeHeight - 2 * nestRadius);
        attempts++;
    } while (nestCollidesWithWall(nestX, nestY, nestRadius) && attempts < 100);
    
    nests.push({
        x: nestX,
        y: nestY,
        hp: 3,
        lastSpawnTime: performance.now() - 25000 // Initialize ready to spawn
    });
    
    document.getElementById("nestCount").textContent = nests.length;
}

function nestCollidesWithWall(x, y, radius) {
    for (const wall of walls) {
        const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.height));
        const distanceX = x - closestX;
        const distanceY = y - closestY;
        if ((distanceX * distanceX + distanceY * distanceY) < radius * radius) {
            return true;
        }
    }
    return false;
}

function spawnSpiders() {
    if (gameOver) return;
    const currentTime = performance.now();
    nests.forEach((nest) => {
        if (!nest.lastSpawnTime) {
            nest.lastSpawnTime = currentTime - 25000;
        }
        
        // Spawn every 15 seconds
        if (currentTime - nest.lastSpawnTime >= 15000) {
            const nestRadius = 20;
            const spiderRadius = 7;
            const spawnDistance = nestRadius + spiderRadius + 5;
            let validPosition = false;
            let startX, startY, spawnAngle;
            let attempts = 0;
            const maxAttempts = 16;
            
            while (!validPosition && attempts < maxAttempts) {
                spawnAngle = Math.random() * Math.PI * 2;
                startX = nest.x + Math.cos(spawnAngle) * spawnDistance;
                startY = nest.y + Math.sin(spawnAngle) * spawnDistance;
                
                // Check if spawn position is clear of walls
                validPosition = !checkSpiderWallCollision(startX, startY, spiderRadius);
                attempts++;
            }

            // If we found a valid position or used max attempts, spawn the spider
            if (validPosition || attempts >= maxAttempts) {
                spiders.push({
                    x: startX,
                    y: startY,
                    speed: 1.0,
                    angle: spawnAngle,
                    state: SPIDER_STATES.PATROL,
                    nestX: nest.x,
                    nestY: nest.y,
                    patrolAngle: spawnAngle,
                    patrolDistance: spawnDistance,
                    lastStateChange: currentTime,
                    lastDirectionChange: currentTime + 3000,
                    forcedPatrolOutward: true,
                    forcePatrolTime: currentTime + 3000,
                    health: SPIDER_MAX_HEALTH,
                    healStartTime: 0,
                    opacity: 1.0,
                    deathStartTime: 0
                });
                
                nest.lastSpawnTime = currentTime;
                document.getElementById("spiderCount").textContent = spiders.length;
            }
        }
    });
}

function updateSpiders() {
    if (gameOver) return;
    const currentTime = performance.now();
    
    // Filter out dead spiders
    spiders = spiders.filter(spider => {
        if (spider.state === SPIDER_STATES.DYING) {
            return (currentTime - spider.deathStartTime) < SPIDER_DEATH_ANIMATION_TIME;
        }
        return true;
    });

    spiders.forEach((spider, index) => {
        if (spider.state === SPIDER_STATES.DYING) {
            spider.opacity = 1 - (currentTime - spider.deathStartTime) / SPIDER_DEATH_ANIMATION_TIME;
            return;
        }

        // Calculate distances to player and nest
        const dx = player.x - spider.x;
        const dy = player.y - spider.y;
        const distanceToPlayer = Math.hypot(dx, dy);
        
        const targetNest = findTargetNest(spider);
        const canHeal = targetNest !== null;
        
        // Calculate distance to nest
        const dxNest = targetNest ? targetNest.x - spider.x : 0;
        const dyNest = targetNest ? targetNest.y - spider.y : 0;
        const distanceToNest = targetNest ? Math.hypot(dxNest, dyNest) : Infinity;
        
        // Line of sight check
        const hasLineOfSight = !walls.some(wall => 
            lineIntersectsRect(
                {x: spider.x, y: spider.y}, 
                {x: player.x, y: player.y}, 
                wall
            )
        );

        // State machine logic
        switch(spider.state) {
            case SPIDER_STATES.PATROL:
                if (distanceToPlayer < SPIDER_DETECTION_RANGE && hasLineOfSight) {
                    spider.state = SPIDER_STATES.ATTACK;
                    spider.lastStateChange = currentTime;
                    spider.forcedPatrolOutward = false;
                } else {
                    // Check if initial forced outward movement period is over
                    if (spider.forcedPatrolOutward && currentTime > spider.forcePatrolTime) {
                        spider.forcedPatrolOutward = false;
                    }
                    
                    // Change direction occasionally or if getting too far from nest
                    const shouldChangeDirection = 
                        (!spider.forcedPatrolOutward && 
                         ((currentTime - spider.lastDirectionChange > 3000) || 
                          (distanceToNest > SPIDER_PATROL_RANGE)));
                          
                    if (shouldChangeDirection) {
                        if (distanceToNest > SPIDER_PATROL_RANGE * 0.8) {
                            // Head back toward nest with some randomness
                            const randomAngleOffset = (Math.random() - 0.5) * Math.PI;
                            spider.patrolAngle = Math.atan2(dyNest, dxNest) + randomAngleOffset;
                        } else {
                            // Pick a new random direction
                            spider.patrolAngle = Math.random() * 2 * Math.PI;
                        }
                        spider.lastDirectionChange = currentTime;
                    }
                    
                    // Set movement speed and angle
                    spider.angle = spider.patrolAngle;
                    spider.speed = spider.forcedPatrolOutward ? 1.0 : 0.6;
                }
                break;

            case SPIDER_STATES.ATTACK:
                if (distanceToPlayer > SPIDER_CHASE_RANGE || !hasLineOfSight) {
                    spider.state = SPIDER_STATES.PATROL;
                    spider.lastStateChange = currentTime;
                }
                spider.angle = Math.atan2(dy, dx);
                spider.speed = 1.17; // Increased chase speed
                break;

            case SPIDER_STATES.RETREAT:
                if (!canHeal) {
                    spider.state = SPIDER_STATES.ATTACK;
                    spider.lastStateChange = currentTime;
                    break;
                }
                
                // Check if reached nest
                if (distanceToNest < 10) {
                    spider.state = SPIDER_STATES.HEAL;
                    spider.healStartTime = currentTime;
                    spider.lastStateChange = currentTime;
                    spider.x = targetNest.x;
                    spider.y = targetNest.y;
                    break;
                }
                
                // Get path to nest using pathfinding
                spider.angle = getPathToNest(spider, targetNest);
                spider.speed = 1.25; // Faster retreat speed
                break;

            case SPIDER_STATES.HEAL:
                if (currentTime - spider.healStartTime >= SPIDER_HEAL_TIME) {
                    spider.health = SPIDER_MAX_HEALTH;
                    spider.state = SPIDER_STATES.PATROL;
                    spider.lastStateChange = currentTime;
                }
                spider.speed = 0;
                break;
        }

        // Apply movement if not healing/dying
        if (spider.state !== SPIDER_STATES.HEAL && spider.state !== SPIDER_STATES.DYING) {
            const moveX = Math.cos(spider.angle) * spider.speed;
            const moveY = Math.sin(spider.angle) * spider.speed;
            
            if (!checkSpiderWallCollision(spider.x + moveX, spider.y + moveY, 7)) {
                spider.x += moveX;
                spider.y += moveY;
            } else {
                trySpiderWallAvoidance(spider, moveX, moveY);
            }
        }
        
        // Check collision with player
        if (Math.hypot(player.x - spider.x, player.y - spider.y) < player.radius + 7) {
            // Add player damage effect
            visualEffects.push({
                type: EFFECT_TYPES.PLAYER_DAMAGE,
                startTime: performance.now(),
                duration: 400,
                intensity: 0.6
            });
            
            characterLives--;
            livesCountDisplay.textContent = characterLives;
            spiders.splice(index, 1);
            
            // Create hit effect at player position
            createHitEffect(EFFECT_TYPES.SPIDER_HIT, player.x, player.y, 8, 0.75);
            
            // Check game over condition
            if (characterLives <= 0) {
                gameOver = true;
                gameEndTime = performance.now();
                const finalTime = updateTimer();
                document.getElementById("timePlayedLoss").textContent = finalTime;
                document.getElementById("gameOverBanner").style.display = "block";
            }
        }
    });

    document.getElementById("spiderCount").textContent = spiders.length;
}

function findTargetNest(spider) {
    // First check if original nest exists
    for (let i = 0; i < nests.length; i++) {
        if (nests[i].x === spider.nestX && nests[i].y === spider.nestY) {
            return nests[i];
        }
    }
    
    // If no nests left, return null
    if (nests.length === 0) {
        return null;
    }
    
    // Find closest nest
    let closest = nests[0];
    let minDistance = Math.hypot(nests[0].x - spider.x, nests[0].y - spider.y);
    
    for (let i = 1; i < nests.length; i++) {
        const distance = Math.hypot(nests[i].x - spider.x, nests[i].y - spider.y);
        if (distance < minDistance) {
            minDistance = distance;
            closest = nests[i];
        }
    }
    
    return closest;
}

function getPathToNest(spider, targetNest) {
    const dxNest = targetNest.x - spider.x;
    const dyNest = targetNest.y - spider.y;
    const directAngle = Math.atan2(dyNest, dxNest);
    const distanceToNest = Math.hypot(dxNest, dyNest);
    const stepSize = Math.min(10, distanceToNest / 2);
    
    // Try direct path first
    const testX = spider.x + Math.cos(directAngle) * stepSize;
    const testY = spider.y + Math.sin(directAngle) * stepSize;
    
    if (!checkSpiderWallCollision(testX, testY, 7)) {
        return directAngle;
    }
    
    // Try alternative angles
    const testAngles = [
        directAngle - Math.PI / 8,
        directAngle + Math.PI / 8,
        directAngle - Math.PI / 4,
        directAngle + Math.PI / 4,
        directAngle - Math.PI / 3,
        directAngle + Math.PI / 3
    ];
    
    for (const angle of testAngles) {
        const testX = spider.x + Math.cos(angle) * stepSize;
        const testY = spider.y + Math.sin(angle) * stepSize;
        if (!checkSpiderWallCollision(testX, testY, 7)) {
            return angle;
        }
    }
    
    // If all else fails, return direct angle
    return directAngle;
}

function checkSpiderWallCollision(x, y, radius) {
    for (const wall of walls) {
        const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.height));
        const dx = x - closestX;
        const dy = y - closestY;
        if (dx * dx + dy * dy < radius * radius) {
            return true;
        }
    }
    return false;
}

function trySpiderWallAvoidance(spider, dx, dy) {
    if (spider.forcedPatrolOutward) {
        return; // Let updateSpiders handle forced movement
    }
    
    const moveAngle = spider.angle;
    const speed = spider.speed;
    const angles = [Math.PI/6, Math.PI/4, Math.PI/3, -Math.PI/6, -Math.PI/4, -Math.PI/3];
    let moved = false;
    
    // Try sliding
    if (!checkSpiderWallCollision(spider.x + dx, spider.y, 7)) {
        spider.x += dx;
        moved = true;
    }
    if (!checkSpiderWallCollision(spider.x, spider.y + dy, 7)) {
        spider.y += dy;
        moved = true;
    }
    
    // If sliding didn't work, try alternative angles
    if (!moved) {
        for (const angleOffset of angles) {
            const testAngle = moveAngle + angleOffset;
            const testDx = Math.cos(testAngle) * speed;
            const testDy = Math.sin(testAngle) * speed;
            
            if (!checkSpiderWallCollision(spider.x + testDx, spider.y + testDy, 7)) {
                spider.x += testDx;
                spider.y += testDy;
                spider.angle = testAngle;
                moved = true;
                break;
            }
        }
        
        // If still stuck, reverse direction
        if (!moved) {
            spider.angle = moveAngle + Math.PI;
        }
    }
}
