function checkCollision(x, y) {
    for (const wall of walls) {
        // Simple circle vs rectangle collision
        const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.height));
        
        const distanceX = x - closestX;
        const distanceY = y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        
        if (distanceSquared < player.radius * player.radius) {
            return true; // Collision detected
        }
    }
    return false;
}

function getCollidingWall(x, y) {
    for (const wall of walls) {
        const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.height));
        const dx = x - closestX;
        const dy = y - closestY;
        if ((dx * dx + dy * dy) < player.radius * player.radius) {
            return wall;
        }
    }
    return null;
}

function lineIntersectsRect(lineStart, lineEnd, rect) {
    // Check intersection with each edge of the rectangle
    const rectLines = [
        { start: {x: rect.x, y: rect.y}, end: {x: rect.x + rect.width, y: rect.y} },
        { start: {x: rect.x + rect.width, y: rect.y}, end: {x: rect.x + rect.width, y: rect.y + rect.height} },
        { start: {x: rect.x + rect.width, y: rect.y + rect.height}, end: {x: rect.x, y: rect.y + rect.height} },
        { start: {x: rect.x, y: rect.y + rect.height}, end: {x: rect.x, y: rect.y} }
    ];
    
    for (const line of rectLines) {
        if (linesIntersect(lineStart, lineEnd, line.start, line.end)) {
            return true;
        }
    }
    return false;
}

function linesIntersect(a, b, c, d) {
    const denominator = ((b.y - a.y) * (d.x - c.x)) - ((b.x - a.x) * (d.y - c.y));
    
    if (denominator === 0) {
        return false;
    }
    
    const ua = (((b.x - a.x) * (c.y - a.y)) - ((b.y - a.y) * (c.x - a.x))) / denominator;
    const ub = (((d.x - c.x) * (c.y - a.y)) - ((d.y - c.y) * (c.x - a.x))) / denominator;
    
    return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
}

function findIntersection(lineStart, lineEnd, rect) {
    // This is a simplified version - just returns a point near the wall
    // In a full implementation, you'd calculate the exact intersection point
    return {
        x: lineEnd.x,
        y: lineEnd.y
    };
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

// Add spider-specific collision check
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

// Add spider wall avoidance helper
function trySpiderWallAvoidance(spider, dx, dy) {
    if (spider.forcedPatrolOutward) {
        // Handle forced outward movement
        const nestDX = spider.x - spider.nestX;
        const nestDY = spider.y - spider.nestY;
        const awayAngle = Math.atan2(nestDY, nestDX);
        
        // Force move away from nest
        const forceMoveX = Math.cos(awayAngle) * spider.speed;
        const forceMoveY = Math.sin(awayAngle) * spider.speed;
        
        if (!checkSpiderWallCollision(spider.x + forceMoveX, spider.y + forceMoveY, 7)) {
            spider.x += forceMoveX;
            spider.y += forceMoveY;
            spider.angle = awayAngle;
        } else {
            // Try sliding if direct movement fails
            if (!checkSpiderWallCollision(spider.x + forceMoveX, spider.y, 7)) {
                spider.x += forceMoveX;
            } else if (!checkSpiderWallCollision(spider.x, spider.y + forceMoveY, 7)) {
                spider.y += forceMoveY;
            }
        }
        return;
    }
    
    // Regular wall avoidance for non-forced movement
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