// Input state management
interface InputState {
    keyboard: {
        [key: string]: boolean;
    };
    mouse: {
        x: number;
        y: number;
        isDown: boolean;
    };
    touch: {
        x: number;
        y: number;
        isDown: boolean;
    };
}

// Current input state
const inputState: InputState = {
    keyboard: {},
    mouse: {
        x: 0,
        y: 0,
        isDown: false
    },
    touch: {
        x: 0,
        y: 0,
        isDown: false
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
    
    console.log('Input handlers initialized');
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
}

/**
 * Handle mouse up events
 * @param event Mouse event
 */
function handleMouseUp(event: MouseEvent): void {
    inputState.mouse.isDown = false;
}

/**
 * Handle mouse move events
 * @param event Mouse event
 */
function handleMouseMove(event: MouseEvent): void {
    inputState.mouse.x = event.clientX;
    inputState.mouse.y = event.clientY;
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