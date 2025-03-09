function updateCamera() {
    // Immediately position camera on player at start
    if (camera.x === 0 && camera.y === 0) {
        camera.x = player.x - canvas.width / 2;
        camera.y = player.y - canvas.height / 2;
    }

    // Calculate the ideal camera position (centered on player)
    const targetCameraX = player.x - canvas.width / 2;
    const targetCameraY = player.y - canvas.height / 2;
    
    // Calculate the buffer zone (50% of viewport)
    const bufferX = canvas.width * 0.25;
    const bufferY = canvas.height * 0.25;
    
    // Only move camera if player is outside the buffer zone
    if (player.x < camera.x + bufferX) {
        camera.x = player.x - bufferX;
    } else if (player.x > camera.x + canvas.width - bufferX) {
        camera.x = player.x - canvas.width + bufferX;
    }
    
    if (player.y < camera.y + bufferY) {
        camera.y = player.y - bufferY;
    } else if (player.y > camera.y + canvas.height - bufferY) {
        camera.y = player.y - canvas.height + bufferY;
    }
    
    // Add smooth camera movement
    camera.x += (targetCameraX - camera.x) * 0.05;
    camera.y += (targetCameraY - camera.y) * 0.05;
    
    // Ensure camera doesn't go out of bounds
    const mazeWidth = MAZE_COLS * ROOM_SIZES[2].width;
    const mazeHeight = MAZE_ROWS * ROOM_SIZES[2].height;
    
    camera.x = Math.max(0, Math.min(camera.x, mazeWidth - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, mazeHeight - canvas.height));
}

// Export or make updateCamera available to the game loop.
