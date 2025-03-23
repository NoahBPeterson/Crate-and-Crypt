/**
 * Controls Manager to handle input and pointer lock
 */
export class ControlsManager {
    private isPointerLocked: boolean = false;
    private mouseEnabled: boolean = false;
    private gameContainer: HTMLElement | null = null;
    private clickHandler: ((event: MouseEvent) => void) | null = null;
    
    constructor() {
        // Find the game container
        this.gameContainer = document.getElementById('game-container');
        
        // Setup other pointer lock related events
        this.setupPointerLockEvents();
        
        // Listen for game start event
        this.setupGameEvents();
        
        console.log('Controls Manager initialized');
    }
    
    /**
     * Setup event listeners for game-related events
     */
    private setupGameEvents(): void {
        // Listen for the game:started event
        document.addEventListener('game:started', (event) => {
            console.log('Game started event received, enabling mouse controls');
            this.enableMouseControls();
            
            // Attempt to request pointer lock immediately as this is triggered by user interaction
            if (this.gameContainer && !this.isPointerLocked) {
                console.log('Auto-requesting pointer lock on game start');
                this.requestPointerLock();
            }
        });
    }
    
    /**
     * Setup pointer lock event handlers
     */
    private setupPointerLockEvents(): void {
        if (!this.gameContainer) {
            console.error('Game container element not found');
            return;
        }
        
        // Create the click handler function
        this.clickHandler = (event: MouseEvent) => {
            // Only request pointer lock if we're not already locked
            if (!this.isPointerLocked) {
                this.requestPointerLock();
            }
        };
        
        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.gameContainer;
            console.log(`Pointer lock state changed: ${this.isPointerLocked ? 'locked' : 'unlocked'}`);
        });
        
        // Handle pointer lock errors
        document.addEventListener('pointerlockerror', () => {
            console.error('Pointer lock error');
        });
        
        // Handle Escape key to exit pointer lock
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isPointerLocked) {
                this.exitPointerLock();
            }
        });
    }
    
    /**
     * Request pointer lock on the game container
     */
    private requestPointerLock(): void {
        if (!this.gameContainer) return;
        
        // Check game state to ensure we're in gameplay mode (not main menu)
        if (!this.mouseEnabled || 
            !window.gameState || 
            window.gameState.currentScreen !== 'gameui') {
            console.log('Pointer lock prevented - not in gameplay or mouse controls disabled');
            return;
        }
        
        // Also check if we're interacting with a UI element
        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'SELECT' ||
            activeElement.tagName === 'BUTTON'
        )) {
            console.log('Pointer lock prevented - UI element has focus');
            return;
        }
        
        try {
            this.gameContainer.requestPointerLock();
        } catch (error) {
            console.error('Failed to request pointer lock:', error);
        }
    }
    
    /**
     * Exit pointer lock
     */
    private exitPointerLock(): void {
        document.exitPointerLock();
    }
    
    /**
     * Enable mouse controls (call this when entering the game)
     */
    public enableMouseControls(): void {
        if (this.mouseEnabled) return; // Already enabled
        
        this.mouseEnabled = true;
        
        // Add the click event listener to the game container ONLY when mouse controls are enabled
        if (this.gameContainer && this.clickHandler) {
            this.gameContainer.addEventListener('click', this.clickHandler);
        }
        
        console.log('Mouse controls enabled - click on game to lock pointer');
    }
    
    /**
     * Disable mouse controls (call this when exiting the game)
     */
    public disableMouseControls(): void {
        if (!this.mouseEnabled) return; // Already disabled
        
        this.mouseEnabled = false;
        
        // Remove the click event listener from the game container
        if (this.gameContainer && this.clickHandler) {
            this.gameContainer.removeEventListener('click', this.clickHandler);
        }
        
        // Also exit pointer lock if currently locked
        if (this.isPointerLocked) {
            this.exitPointerLock();
        }
        
        console.log('Mouse controls disabled');
    }
    
    /**
     * Check if pointer is currently locked
     */
    public isLocked(): boolean {
        return this.isPointerLocked;
    }
} 