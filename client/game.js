// Game initialization
document.addEventListener('DOMContentLoaded', function() {
    // Get canvas and context
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    
    // Cell size in pixels
    const cellSize = 50;
    
    // Maze structure: 1 = wall, 0 = path
    const maze = [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ];
    
    // Player positions (row, col)
    const players = [
        { x: 1, y: 1, color: '#ff4d4d' }, // Player 1 (red) at (1,1)
        { x: 3, y: 3, color: '#4d79ff' }  // Player 2 (blue) at (3,3)
    ];
    
    // Render the maze
    function renderMaze() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the maze
        for (let row = 0; row < maze.length; row++) {
            for (let col = 0; col < maze[row].length; col++) {
                // Calculate the position on canvas
                const x = col * cellSize;
                const y = row * cellSize;
                
                // Set the color based on maze value
                ctx.fillStyle = maze[row][col] === 1 ? 'black' : 'white';
                
                // Draw the cell
                ctx.fillRect(x, y, cellSize, cellSize);
                
                // Draw cell border
                ctx.strokeStyle = '#ccc';
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }
    }
    
    // Draw players on the maze
    function drawPlayers() {
        players.forEach((player, index) => {
            // Calculate center position for the player
            const centerX = player.y * cellSize + cellSize / 2;
            const centerY = player.x * cellSize + cellSize / 2;
            const radius = cellSize / 3; // Player size
            
            // Draw the player as a circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = player.color;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add player number
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(index + 1, centerX, centerY);
        });
    }
    
    // Initial render
    function render() {
        renderMaze();
        drawPlayers();
    }
    
    // Start the game
    render();
});
