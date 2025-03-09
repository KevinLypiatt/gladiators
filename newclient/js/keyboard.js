function setupControls() {
    // Clean up existing handlers
    if (window.handleKeyDown) {
        document.removeEventListener('keydown', window.handleKeyDown);
    }
    if (window.handleKeyUp) {
        document.removeEventListener('keyup', window.handleKeyUp);
    }
    
    window.handleKeyDown = function(e) {
        handleKey(e, true);
    };
    
    window.handleKeyUp = function(e) {
        handleKey(e, false);
    };
    
    function handleKey(e, isDown) {
        // Debug mode toggle
        if (isDown && (e.key === '`' || e.key === 'Backquote' || e.code === 'Backquote' || e.key === 'd' && e.altKey)) {
            window.debugMode = !window.debugMode;
            console.log("Debug mode:", window.debugMode ? "ON" : "OFF");
            e.preventDefault();
            return;
        }
        
        if (gameOver || gameWon) return;
        
        // Movement controls - make sure these set the global movement flags
        switch(e.key) {
            case 'w': 
            case 'ArrowUp':
                movingForward = isDown;
                break;
            case 's': 
            case 'ArrowDown':
                movingBackward = isDown;
                break;
            case 'a':
                strafingLeft = isDown;
                break;
            case 'd':
                strafingRight = isDown;
                break;
            case 'ArrowLeft':
                rotatingLeft = isDown;
                break;
            case 'ArrowRight':
                rotatingRight = isDown;
                break;
            case ' ':
            case 'f':
                if (isDown) fireArrow();
                break;
        }
        
        e.preventDefault();
        
        // Hide focus message on any keypress
        if (isDown) {
            document.getElementById("focusMessage").style.opacity = "0";
        }
    }
    
    // Add event listeners directly to document
    document.addEventListener('keydown', window.handleKeyDown);
    document.addEventListener('keyup', window.handleKeyUp);
    
    // Canvas focus handling
    canvas.addEventListener('click', function() {
        canvas.focus();
        document.getElementById("focusMessage").style.opacity = "0";
    });
    
    // Log setup completion
    console.log("Keyboard controls ready");
}
