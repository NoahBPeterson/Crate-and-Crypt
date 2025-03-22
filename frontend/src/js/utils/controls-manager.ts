/**
 * Controls Manager to handle input and pointer lock
 */
export class ControlsManager {
    private isPointerLocked: boolean = false;
    private mouseEnabled: boolean = false;
    private gameContainer: HTMLElement | null = null;
    
    constructor() {
        // Find the game container
        this.gameContainer = document.getElementById('game-container');
        
        // Setup pointer lock event listeners
        this.setupPointerLock();
        
        console.log('Controls Manager initialized');
    }
    
    /**
     * Setup pointer lock event handlers
     */
    private setupPointerLock(): void {
        if (!this.gameContainer) {
            console.error('Game container element not found');
            return;
        }
        
        // When the user clicks the container, request pointer lock
        this.gameContainer.addEventListener('click', () => {
            if (this.mouseEnabled && !this.isPointerLocked) {
                this.requestPointerLock();
            }
        });
        
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
        this.mouseEnabled = true;
        console.log('Mouse controls enabled - click on game to lock pointer');
    }
    
    /**
     * Disable mouse controls (call this when exiting the game)
     */
    public disableMouseControls(): void {
        this.mouseEnabled = false;
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