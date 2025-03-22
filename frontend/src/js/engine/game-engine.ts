// Add imports
import * as THREE from 'three';
import { ControlsManager } from '../utils/controls-manager';

export class GameEngine {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    playerManager: any; // Will be set later
    controls: ControlsManager;
    
    constructor() {
        console.log('Initializing game engine');
        
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Skyblue background
        
        // Create a temporary camera (will be replaced by player camera)
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);
        
        // Initialize input controls manager
        this.controls = new ControlsManager();
        
        // Add the renderer to the DOM
        document.getElementById('game-container')?.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        
        // Start the render loop
        this.animate();
        
        console.log('Game engine initialized');
    }
    
    /**
     * Handle window resize
     */
    onWindowResize(): void {
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Animation loop
     */
    animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
    }
    
    /**
     * Render the scene
     */
    render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 