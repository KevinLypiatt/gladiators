function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply camera transform
    ctx.translate(-camera.x, -camera.y);
    
    // Draw walls that are in view
    ctx.fillStyle = 'black';
    walls.forEach(wall => {
        if (wall.x + wall.width >= camera.x && 
            wall.x <= camera.x + canvas.width &&
            wall.y + wall.height >= camera.y && 
            wall.y <= camera.y + canvas.height) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
    });

    // Draw maze boundary
    const mazeWidth = MAZE_COLS * ROOM_SIZES[2].width;
    const mazeHeight = MAZE_ROWS * ROOM_SIZES[2].height;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, mazeWidth, mazeHeight);
    
    // Draw arrows, baddies, and player
    drawArrows();
    drawBaddies();
    drawPlayer();
    
    // Draw effects
    drawVisualEffects();
    
    ctx.restore();
    
    // Update UI elements
    updateUI();
}

function drawBaddies() {
    // Draw nests as purple circles
    nests.forEach(nest => {
        // Draw the nest
        ctx.fillStyle = 'purple';
        ctx.beginPath();
        ctx.arc(nest.x, nest.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        
        // In debug mode, draw the spawn radius
        if (window.debugMode) {
            const spawnRadius = 20 + 7 + 2; // nestRadius + spiderRadius + clearance
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(nest.x, nest.y, spawnRadius, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Draw text indicating this is the spawn radius
            ctx.fillStyle = 'yellow';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('spawn zone', nest.x, nest.y - spawnRadius - 5);
        }
    });

    // Draw spiders with different colors based on state
    spiders.forEach(spider => {
        ctx.save();
        ctx.translate(spider.x, spider.y);
        
        // Set opacity for death animation
        if (spider.state === SPIDER_STATES.DYING) {
            ctx.globalAlpha = spider.opacity;
        }
        
        // Spider body - 30% smaller (7px radius instead of 10px)
        const spiderRadius = 7;
        ctx.beginPath();
        ctx.arc(0, 0, spiderRadius, 0, 2 * Math.PI);
        
        // Change color based on state
        switch(spider.state) {
            case SPIDER_STATES.PATROL:
                ctx.strokeStyle = 'orange'; // Orange for patrol
                break;
            case SPIDER_STATES.ATTACK:
                ctx.strokeStyle = 'red';    // Red for attack
                break;
            case SPIDER_STATES.RETREAT:
                ctx.strokeStyle = 'gray';   // Gray for retreat
                break;
            case SPIDER_STATES.HEAL:
                ctx.strokeStyle = 'green';  // Green for healing
                break;
            case SPIDER_STATES.DYING:
                ctx.strokeStyle = 'darkred'; // Darker red for dying
                break;
        }
        
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw health indicators (except for dying spiders)
        if (spider.state !== SPIDER_STATES.DYING) {
            for (let i = 0; i < SPIDER_MAX_HEALTH; i++) {
                const healthX = (i - 1) * 5 - 2;
                const healthY = -spiderRadius - 5;
                ctx.beginPath();
                ctx.rect(healthX, healthY, 4, 2);
                
                // Show filled or empty health bars
                if (i < spider.health) {
                    ctx.fillStyle = 'red';
                    ctx.fill();
                } else {
                    ctx.strokeStyle = 'darkred';
                    ctx.stroke();
                }
            }
        }
        
        // Draw 8 legs around the body - 30% shorter
        const legOuterLength = 11; // Reduced from 16
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * spiderRadius, Math.sin(angle) * spiderRadius);
            ctx.lineTo(Math.cos(angle) * legOuterLength, Math.sin(angle) * legOuterLength);
            
            // Legs match body color
            if (spider.state === SPIDER_STATES.DYING) {
                ctx.strokeStyle = 'darkred';
            } else {
                ctx.strokeStyle = 
                    spider.state === SPIDER_STATES.PATROL ? 'orange' : 
                    spider.state === SPIDER_STATES.ATTACK ? 'red' :
                    spider.state === SPIDER_STATES.RETREAT ? 'gray' : 'green';
            }
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Draw direction indicator (except for dying spiders)
        if (spider.state !== SPIDER_STATES.DYING) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(spider.angle) * (spiderRadius + 5), 
                      Math.sin(spider.angle) * (spiderRadius + 5));
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }
        
        // In debug mode, draw path to nest for retreating spiders
        if (window.debugMode && spider.state === SPIDER_STATES.RETREAT) {
            const targetNest = findTargetNest(spider);
            if (targetNest) {
                const pathAngle = getPathToNest(spider, targetNest);
                const pathLength = 40;
                
                // Draw the calculated path
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(pathAngle) * pathLength, Math.sin(pathAngle) * pathLength);
                ctx.strokeStyle = 'lime';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw direct path to nest for comparison
                const directAngle = Math.atan2(targetNest.y - spider.y, targetNest.x - spider.x);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(directAngle) * pathLength * 0.7, Math.sin(directAngle) * pathLength * 0.7);
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        
        ctx.restore();
    });
}

function drawVisualEffects() {
    const currentTime = performance.now();
    
    visualEffects.forEach(effect => {
        ctx.save();
        
        if (effect.type === EFFECT_TYPES.MUZZLE_FLASH) {
            // Draw muzzle flash as a colored circle with smaller glow
            ctx.translate(effect.x, effect.y);
            ctx.rotate(effect.angle);
            
            // Add glow effect with reduced size
            const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, effect.size * 1.5); // Was *2, reduced by 25%
            gradient.addColorStop(0, `rgba(255, 200, 50, ${effect.opacity})`);
            gradient.addColorStop(0.4, `rgba(255, 120, 20, ${effect.opacity * 0.7})`); // Was 0.8, reduced opacity
            gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, effect.size * 1.5, 0, Math.PI * 2); // Was *2, reduced by 25%
            ctx.fill();
            
            // Draw smaller brighter center
            ctx.fillStyle = `rgba(255, 255, 200, ${effect.opacity})`;
            ctx.beginPath();
            ctx.arc(0, 0, effect.size * 0.4, 0, Math.PI * 2); // Was 0.6, reduced by 33%
            ctx.fill();
        }
        else if (effect.type === EFFECT_TYPES.SPIDER_HIT || effect.type === EFFECT_TYPES.NEST_HIT) {
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
    const damageEffect = visualEffects.find(effect => effect.type === EFFECT_TYPES.PLAYER_DAMAGE);
    if (damageEffect) {
        const progress = (currentTime - damageEffect.startTime) / damageEffect.duration;
        // Reduced intensity flash effect 
        const intensity = (1 - progress) * damageEffect.intensity * (Math.sin(progress * Math.PI * 3) * 0.2 + 0.6); // Reduced multipliers
        
        // Draw more subtle red overlay on the whole screen
        ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.2})`; // Was 0.3, reduced by 33%
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw thinner red border around player
        ctx.save();
        ctx.translate(player.x - camera.x, player.y - camera.y);
        ctx.strokeStyle = `rgba(255, 0, 0, ${intensity * 0.8})`; // Added 0.8 multiplier
        ctx.lineWidth = 2; // Was 3, reduced by 33%
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 3, 0, Math.PI * 2); // Was +5, reduced by 40%
        ctx.stroke();
        ctx.restore();
    }
}

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

function drawArrows() {
    arrows.forEach(arrow => {
        ctx.save();
        if (arrow.isStuck) {
            ctx.translate(arrow.stuckX, arrow.stuckY);
        } else {
            ctx.translate(arrow.x, arrow.y);
        }
        ctx.rotate(arrow.angle);
        
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
    });
}

function updateUI() {
    arrowCountDisplay.textContent = arrowCount;
    livesCountDisplay.textContent = characterLives;
    document.getElementById("spiderCount").textContent = spiders.length;
}