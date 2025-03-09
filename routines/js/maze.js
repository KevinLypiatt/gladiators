function generateMaze() {
    walls = [];
    // First, create the outer boundary
    const mazeWidth = MAZE_COLS * ROOM_SIZES[2].width;
    const mazeHeight = MAZE_ROWS * ROOM_SIZES[2].height;
    const outerWallThickness = 4; // thicker outer walls
    
    // Outer walls (top, right, bottom, left)
    walls.push({x: 0, y: 0, width: mazeWidth, height: outerWallThickness});
    walls.push({x: mazeWidth - outerWallThickness, y: 0, width: outerWallThickness, height: mazeHeight});
    walls.push({x: 0, y: mazeHeight - outerWallThickness, width: mazeWidth, height: outerWallThickness});
    walls.push({x: 0, y: 0, width: outerWallThickness, height: mazeHeight});
    
    // Create random rooms within the maze
    let currentX = 0;
    let currentY = 0;
    
    for (let row = 0; row < MAZE_ROWS; row++) {
        currentX = 0;
        for (let col = 0; col < MAZE_COLS; col++) {
            // Choose a random room size
            const sizeIndex = Math.floor(Math.random() * ROOM_SIZES.length);
            const roomSize = ROOM_SIZES[sizeIndex];
            
            // Create room walls with gaps
            createRoomWalls(currentX, currentY, roomSize.width, roomSize.height);
            
            currentX += roomSize.width;
        }
        
        // Force some walls on the right side to make it less empty
        if (Math.random() > 0.3) { // 70% chance for an extra wall
            const wallHeight = ROOM_SIZES[2].height * 0.6;
            const wallY = currentY + (ROOM_SIZES[2].height - wallHeight) * Math.random();
            walls.push({
                x: mazeWidth - ROOM_SIZES[0].width * (0.5 + Math.random()),
                y: wallY,
                width: WALL_THICKNESS * 2,
                height: wallHeight
            });
        }
        
        currentY += ROOM_SIZES[2].height; // Use large room height for consistent rows
    }
}
function createRoomWalls(x, y, width, height) {
    const gapSize = 30; // Size of gaps in walls
    const wallSegments = 3; // Number of potential wall segments per side
    
    // Top wall
    createWallWithGaps(x, y, width, WALL_THICKNESS, wallSegments, true);
    
    // Right wall
    createWallWithGaps(x + width, y, WALL_THICKNESS, height, wallSegments, false);
    
    // Bottom wall
    createWallWithGaps(x, y + height, width, WALL_THICKNESS, wallSegments, true);
    
    // Left wall
    createWallWithGaps(x, y, WALL_THICKNESS, height, wallSegments, false);
}
function createWallWithGaps(x, y, width, height, segments, isHorizontal) {
    const gapProbability = 0.4; // Probability of creating a gap in a segment
    const minGapSize = 30; // Minimum gap size for player to pass through (player diameter is 20)
    
    if (isHorizontal) {
        const segmentWidth = width / segments;
        // Ensure segments are wide enough for gaps
        if (segmentWidth < minGapSize * 2) {
            // If segments are too small, create fewer but larger segments
            const adjustedSegments = Math.max(1, Math.floor(width / (minGapSize * 2)));
            const adjustedSegmentWidth = width / adjustedSegments;
            
            for (let i = 0; i < adjustedSegments; i++) {
                if (Math.random() > gapProbability) {
                    walls.push({
                        x: x + i * adjustedSegmentWidth,
                        y: y,
                        width: adjustedSegmentWidth - minGapSize, // Ensure gap is at least minGapSize
                        height: height
                    });
                }
            }
        } else {
            // Original logic with guaranteed minimum gap size
            for (let i = 0; i < segments; i++) {
                if (Math.random() > gapProbability) {
                    walls.push({
                        x: x + i * segmentWidth,
                        y: y,
                        width: segmentWidth - minGapSize, // Ensure gap is at least minGapSize
                        height: height
                    });
                }
            }
        }
    } else {
        const segmentHeight = height / segments;
        // Ensure segments are tall enough for gaps
        if (segmentHeight < minGapSize * 2) {
            // If segments are too small, create fewer but larger segments
            const adjustedSegments = Math.max(1, Math.floor(height / (minGapSize * 2)));
            const adjustedSegmentHeight = height / adjustedSegments;
            
            for (let i = 0; i < adjustedSegments; i++) {
                if (Math.random() > gapProbability) {
                    walls.push({
                        x: x,
                        y: y + i * adjustedSegmentHeight,
                        width: width,
                        height: adjustedSegmentHeight - minGapSize // Ensure gap is at least minGapSize
                    });
                }
            }
        } else {
            // Original logic with guaranteed minimum gap size
            for (let i = 0; i < segments; i++) {
                if (Math.random() > gapProbability) {
                    walls.push({
                        x: x,
                        y: y + i * segmentHeight,
                        width: width,
                        height: segmentHeight - minGapSize // Ensure gap is at least minGapSize
                    });
                }
            }
        }
    }
}
function setFocus() {
    const canvas = document.getElementById("gameCanvas");
    if (canvas) {
        canvas.focus();
        document.getElementById("focusMessage").style.opacity = "0";
    }
}