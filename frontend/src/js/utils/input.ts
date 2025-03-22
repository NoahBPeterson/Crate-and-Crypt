import * as THREE from 'three';

// Input state management
interface InputState {
    keyboard: {
        [key: string]: boolean;
    };
    mouse: {
        x: number;
        y: number;
        isDown: boolean;
        movementX: number;
        movementY: number;
        locked: boolean;
    };
    touch: {
        x: number;
        y: number;
        isDown: boolean;
    };
    drag: {
        isActive: boolean;
        lastX: number;
        lastY: number;
        sensitivity: number;
    };
}

// Current input state
const inputState: InputState = {
    keyboard: {},
    mouse: {
        x: 0,
        y: 0,
        isDown: false,
        movementX: 0,
        movementY: 0,
        locked: false
    },
    touch: {
        x: 0,
        y: 0,
        isDown: false
    },
    drag: {
        isActive: false,
        lastX: 0,
        lastY: 0,
        sensitivity: 0.5
    }
};

/**
 * Setup all input event handlers
 */
export function setupInputHandlers(): void {
    // Keyboard events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Mouse events
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    
    // Touch events
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove);
    
    // Pointer lock for mouse look
    document.addEventListener('click', () => {
        if (!inputState.mouse.locked) {
            requestPointerLock();
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        inputState.mouse.locked = document.pointerLockElement !== null;
    });
    
    // Setup game loop for input processing
    setupInputProcessing();
    
    // Display control instructions
    displayControlHelp();
    
    console.log('Input handlers initialized');
}

/**
 * Request pointer lock for mouse control
 */
function requestPointerLock(): void {
    document.body.requestPointerLock();
}

/**
 * Handle keydown events
 * @param event Keyboard event
 */
function handleKeyDown(event: KeyboardEvent): void {
    inputState.keyboard[event.key] = true;
    
    // Prevent default for game control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.key)) {
        event.preventDefault();
    }
    
    // Handle special key presses that don't need to be held down
    switch (event.key) {
        case 'v':
        case 'V':
            // Toggle first/third person view
            if (window.gameEngine?.playerManager?.localPlayer) {
                window.gameEngine.playerManager.localPlayer.toggleView();
            }
            break;
    }
}

/**
 * Handle keyup events
 * @param event Keyboard event
 */
function handleKeyUp(event: KeyboardEvent): void {
    inputState.keyboard[event.key] = false;
}

/**
 * Handle mouse down events
 * @param event Mouse event
 */
function handleMouseDown(event: MouseEvent): void {
    inputState.mouse.isDown = true;
    inputState.mouse.x = event.clientX;
    inputState.mouse.y = event.clientY;
    
    // Start drag rotation if not in pointer lock mode
    if (!inputState.mouse.locked) {
        inputState.drag.isActive = true;
        inputState.drag.lastX = event.clientX;
        inputState.drag.lastY = event.clientY;
    }
}

/**
 * Handle mouse up events
 * @param event Mouse event
 */
function handleMouseUp(event: MouseEvent): void {
    inputState.mouse.isDown = false;
    
    // End drag rotation
    inputState.drag.isActive = false;
}

/**
 * Handle mouse move events with pointer lock support
 * @param event Mouse event
 */
function handleMouseMove(event: MouseEvent): void {
    inputState.mouse.x = event.clientX;
    inputState.mouse.y = event.clientY;
    
    // For mouse look (first-person camera)
    if (inputState.mouse.locked) {
        inputState.mouse.movementX = event.movementX || 0;
        inputState.mouse.movementY = event.movementY || 0;
    }
    
    // Handle drag rotation for trackpad users
    if (inputState.drag.isActive && !inputState.mouse.locked) {
        const deltaX = event.clientX - inputState.drag.lastX;
        const deltaY = event.clientY - inputState.drag.lastY;
        
        // Update drag rotation if player exists
        if (window.gameEngine?.playerManager?.localPlayer) {
            window.gameEngine.playerManager.localPlayer.rotate(
                -deltaX * inputState.drag.sensitivity * 0.01,
                -deltaY * inputState.drag.sensitivity * 0.01
            );
        }
        
        // Update last position
        inputState.drag.lastX = event.clientX;
        inputState.drag.lastY = event.clientY;
    }
}

/**
 * Handle touch start events
 * @param event Touch event
 */
function handleTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
        inputState.touch.isDown = true;
        inputState.touch.x = event.touches[0].clientX;
        inputState.touch.y = event.touches[0].clientY;
    }
    
    // Prevent default to avoid scrolling
    event.preventDefault();
}

/**
 * Handle touch end events
 * @param event Touch event
 */
function handleTouchEnd(event: TouchEvent): void {
    inputState.touch.isDown = false;
}

/**
 * Handle touch move events
 * @param event Touch event
 */
function handleTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
        inputState.touch.x = event.touches[0].clientX;
        inputState.touch.y = event.touches[0].clientY;
    }
    
    // Prevent default to avoid scrolling
    event.preventDefault();
}

/**
 * Setup input processing in the game loop
 */
function setupInputProcessing(): void {
    // Process inputs each frame
    function processInput(): void {
        // Skip if game is not initialized
        if (!window.gameState?.initialized || !window.gameEngine?.playerManager?.localPlayer) {
            requestAnimationFrame(processInput);
            return;
        }
        
        const player = window.gameEngine.playerManager.localPlayer;
        // console.log("Processing input for player:", player.id);
        
        // Mouse look (rotation)
        if (inputState.mouse.locked) {
            player.rotate(
                inputState.mouse.movementX * 0.08,
                inputState.mouse.movementY * 0.08
            );
            
            // Reset movement for next frame
            inputState.mouse.movementX = 0;
            inputState.mouse.movementY = 0;
        }
        
        // Also respond to arrow keys for rotation if not using mouse
        if (!inputState.mouse.locked) {
            // Left/right arrow keys for horizontal rotation
            if (isKeyPressed('ArrowLeft')) {
                player.rotate(0.05, 0);
            } else if (isKeyPressed('ArrowRight')) {
                player.rotate(-0.05, 0);
            }
            
            // Up/down arrow keys for vertical rotation
            if (isKeyPressed('ArrowUp') && !isKeyPressed('w') && !isKeyPressed('W')) {
                player.rotate(0, 0.05);
            } else if (isKeyPressed('ArrowDown') && !isKeyPressed('s') && !isKeyPressed('S')) {
                player.rotate(0, -0.05);
            }
        }
        
        // Movement direction in player's local space
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        // Forward/backward
        if (isKeyPressed('w') || isKeyPressed('W') || isKeyPressed('ArrowUp')) {
            moveDirection.z = -1;
            //console.log("Moving forward");
        } else if (isKeyPressed('s') || isKeyPressed('S') || isKeyPressed('ArrowDown')) {
            moveDirection.z = 1;
            //console.log("Moving backward");
        }
        
        // Left/right
        if (isKeyPressed('a') || isKeyPressed('A') || isKeyPressed('ArrowLeft')) {
            moveDirection.x = -1;
            //console.log("Moving left");
        } else if (isKeyPressed('d') || isKeyPressed('D') || isKeyPressed('ArrowRight')) {
            moveDirection.x = 1;
            //console.log("Moving right");
        }
        
        // Normalize the direction vector to ensure consistent speed in all directions
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Apply player's rotation to the movement direction
            const rotationY = new THREE.Matrix4().makeRotationY(player.rotation.y);
            moveDirection.applyMatrix4(rotationY);
            
            // Apply movement
            player.move(moveDirection);
        }
        
        requestAnimationFrame(processInput);
    }
    
    // Start the input processing loop
    processInput();
    console.log("Input processing loop started");
}

/**
 * Check if a key is currently pressed
 * @param key Key to check
 * @returns True if the key is pressed
 */
export function isKeyPressed(key: string): boolean {
    return inputState.keyboard[key] === true;
}

/**
 * Get the current mouse position
 * @returns Object with x and y coordinates
 */
export function getMousePosition(): { x: number; y: number } {
    return { x: inputState.mouse.x, y: inputState.mouse.y };
}

/**
 * Get the current touch position
 * @returns Object with x and y coordinates
 */
export function getTouchPosition(): { x: number; y: number } {
    return { x: inputState.touch.x, y: inputState.touch.y };
}

/**
 * Check if mouse button is currently down
 * @returns True if mouse button is down
 */
export function isMouseDown(): boolean {
    return inputState.mouse.isDown;
}

/**
 * Check if touch is currently active
 * @returns True if touch is active
 */
export function isTouchActive(): boolean {
    return inputState.touch.isDown;
}

/**
 * Display help text for controls
 */
function displayControlHelp(): void {
    if (typeof document === 'undefined') return;
    
    // Create help panel
    const helpPanel = document.createElement('div');
    helpPanel.style.position = 'absolute';
    helpPanel.style.bottom = '10px';
    helpPanel.style.left = '10px';
    helpPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    helpPanel.style.color = 'white';
    helpPanel.style.padding = '10px';
    helpPanel.style.borderRadius = '5px';
    helpPanel.style.fontFamily = 'monospace';
    helpPanel.style.fontSize = '12px';
    helpPanel.style.zIndex = '1000';
    
    helpPanel.innerHTML = `
        <h3>Controls:</h3>
        <ul>
            <li>W,A,S,D or Arrows: Move</li>
            <li>Mouse/Trackpad: Look around</li>
            <li>V: Toggle first/third person view</li>
            <li>Click: Lock/unlock mouse pointer</li>
        </ul>
    `;
    
    // Add to document
    document.body.appendChild(helpPanel);
}

/**
 * Process player input
 */
export function processInput(player: any): void {
    // Skip if player not available 
    if (!player) return;
    
    // Process keyboard input
    processKeyboardInput(player);
    
    // Process mouse input
    processMouseInput(player);
}

/**
 * Process keyboard input for player movement
 */
function processKeyboardInput(player: any): void {
    // Only process input if player is defined
    if (!player) return;
    
    // Get key states
    const isForwardPressed = keyStates['KeyW'] || keyStates['ArrowUp'];
    const isBackwardPressed = keyStates['KeyS'] || keyStates['ArrowDown'];
    const isLeftPressed = keyStates['KeyA'] || keyStates['ArrowLeft'];
    const isRightPressed = keyStates['KeyD'] || keyStates['ArrowRight'];
    const isJumpPressed = keyStates['Space'];
    const isRunPressed = keyStates['ShiftLeft'] || keyStates['ShiftRight'];
    
    // Set movement direction based on key presses
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    if (isForwardPressed) {
        moveDirection.z = -1;
    }
    
    if (isBackwardPressed) {
        moveDirection.z = 1;
    }
    
    if (isLeftPressed) {
        moveDirection.x = -1;
    }
    
    if (isRightPressed) {
        moveDirection.x = 1;
    }
    
    // Normalize movement vector
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        
        // Apply movement speed
        const movementSpeed = isRunPressed ? 0.15 : 0.08;
        moveDirection.multiplyScalar(movementSpeed);
        
        // Update player is moving state
        player.isMoving = true;
    } else {
        // Player is not moving
        player.isMoving = false;
    }
    
    // Move player in direction they're facing
    if (moveDirection.length() > 0) {
        // Create a matrix from the player's rotation
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(player.rotation.y);
        
        // Apply rotation to movement vector
        moveDirection.applyMatrix4(rotationMatrix);
        
        // Update player position
        player.position.add(moveDirection);
        player.model.position.copy(player.position);
    }
} 