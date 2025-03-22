/**
 * Input handling module for keyboard, mouse, and gamepad
 */

// Input state tracking
const keys = {};
const mouse = {
    x: 0,
    y: 0,
    movementX: 0,
    movementY: 0,
    buttons: {
        left: false,
        right: false,
        middle: false
    },
    locked: false
};

// Movement state
export const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false
};

/**
 * Initialize input event listeners
 */
export function setupInputHandlers() {
    // Keyboard events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Mouse events
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Pointer lock for mouse look
    document.getElementById('game-canvas').addEventListener('click', requestPointerLock);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    console.log('Input handlers initialized');
}

// === Keyboard Handling ===

function handleKeyDown(event) {
    keys[event.code] = true;
    updateMovementState();
    
    // Prevent default behavior for game controls
    if (isGameControl(event.code)) {
        event.preventDefault();
    }
}

function handleKeyUp(event) {
    keys[event.code] = false;
    updateMovementState();
}

function updateMovementState() {
    // WASD movement
    movement.forward = !!keys['KeyW'];
    movement.backward = !!keys['KeyS'];
    movement.left = !!keys['KeyA'];
    movement.right = !!keys['KeyD'];
    
    // Other actions
    movement.jump = !!keys['Space'];
    movement.sprint = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
    movement.crouch = !!keys['ControlLeft'] || !!keys['ControlRight'];
    
    // Emit event for game systems
    if (window.gameState && window.gameState.initialized) {
        const event = new CustomEvent('movementUpdated', { detail: movement });
        window.dispatchEvent(event);
    }
}

function isGameControl(code) {
    const gameControls = [
        'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'Space', 'ShiftLeft', 'ShiftRight',
        'ControlLeft', 'ControlRight'
    ];
    return gameControls.includes(code);
}

// === Mouse Handling ===

function handleMouseMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    
    if (mouse.locked) {
        mouse.movementX = event.movementX;
        mouse.movementY = event.movementY;
        
        // Emit event for camera system
        if (window.gameState && window.gameState.initialized) {
            const event = new CustomEvent('mouseLook', { 
                detail: { 
                    movementX: mouse.movementX, 
                    movementY: mouse.movementY 
                } 
            });
            window.dispatchEvent(event);
        }
    }
}

function handleMouseDown(event) {
    switch (event.button) {
        case 0: mouse.buttons.left = true; break;
        case 1: mouse.buttons.middle = true; break;
        case 2: mouse.buttons.right = true; break;
    }
    
    // Emit event for game systems
    if (window.gameState && window.gameState.initialized) {
        const detail = { button: event.button, x: mouse.x, y: mouse.y };
        const clickEvent = new CustomEvent('gameMouseDown', { detail });
        window.dispatchEvent(clickEvent);
    }
}

function handleMouseUp(event) {
    switch (event.button) {
        case 0: mouse.buttons.left = false; break;
        case 1: mouse.buttons.middle = false; break;
        case 2: mouse.buttons.right = false; break;
    }
    
    // Emit event for game systems
    if (window.gameState && window.gameState.initialized) {
        const detail = { button: event.button, x: mouse.x, y: mouse.y };
        const clickEvent = new CustomEvent('gameMouseUp', { detail });
        window.dispatchEvent(clickEvent);
    }
}

// === Pointer Lock (Mouse Look) ===

function requestPointerLock() {
    // Only request pointer lock if we're in the game screen
    if (window.gameState && (window.gameState.currentScreen === 'game')) {
        const canvas = document.getElementById('game-canvas');
        canvas.requestPointerLock = canvas.requestPointerLock || 
                                   canvas.mozRequestPointerLock || 
                                   canvas.webkitRequestPointerLock;
        canvas.requestPointerLock();
    }
}

function handlePointerLockChange() {
    mouse.locked = document.pointerLockElement === document.getElementById('game-canvas');
    
    // Emit event for game systems
    if (window.gameState && window.gameState.initialized) {
        const event = new CustomEvent('pointerLockChange', { detail: { locked: mouse.locked } });
        window.dispatchEvent(event);
    }
}

/**
 * Get the current input state
 * @returns {Object} The current input state
 */
export function getInputState() {
    return {
        keys: { ...keys },
        mouse: { ...mouse },
        movement: { ...movement }
    };
} 