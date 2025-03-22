// Crate and Crypt - Main Entry Point
import * as THREE from 'three';
import { initializeEngine } from './js/engine/renderer';
import { setupInputHandlers } from './js/utils/input';
import { initUI } from './js/ui/ui-manager';
import { initNetwork } from './js/network/connection';
import { loadAssets } from './js/utils/loader';

// Define global types
declare global {
    interface Window {
        gameState: {
            initialized: boolean;
            connected: boolean;
            currentScreen: string;
            playerId: string | null;
            roomId: string | null;
        };
        gameEngine: {
            renderer: THREE.WebGLRenderer;
            scene: THREE.Scene;
            camera: THREE.Camera;
        };
    }
}

// Initialize game state only in browser environment
if (typeof window !== 'undefined') {
    // Global game state
    window.gameState = {
        initialized: false,
        connected: false,
        currentScreen: 'loading',
        playerId: null,
        roomId: null,
    };
}

// Application entry point
export async function init(): Promise<void> {
    console.log('Crate and Crypt - Initializing...');
    
    try {
        // Load essential assets first
        await loadAssets();
        
        // Initialize the 3D engine
        const engineComponents = initializeEngine();
        if (typeof window !== 'undefined') {
            window.gameEngine = {
                renderer: engineComponents.renderer as THREE.WebGLRenderer,
                scene: engineComponents.scene as THREE.Scene,
                camera: engineComponents.camera as THREE.Camera
            };
        }
        
        // Setup input handlers
        setupInputHandlers();
        
        // Initialize UI
        initUI();
        
        // Initialize network once engine is ready
        initNetwork();
        
        // Start render loop
        startRenderLoop();
        
        // Show main menu when everything is loaded
        showMainMenu();
        
        if (typeof window !== 'undefined') {
            window.gameState.initialized = true;
        }
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization failed:', error);
        showErrorScreen('Failed to initialize the game. Please refresh the page and try again.');
    }
}

function startRenderLoop(): void {
    if (typeof window === 'undefined') return;
    
    function animate(): void {
        requestAnimationFrame(animate);
        
        // Update game systems
        updateGameSystems();
        
        // Render the scene
        window.gameEngine.renderer.render(window.gameEngine.scene, window.gameEngine.camera);
    }
    
    animate();
}

function updateGameSystems(): void {
    // Update systems each frame
    // This will be expanded as we implement more systems
}

function showMainMenu(): void {
    if (typeof window === 'undefined') return;
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
    
    // Show main menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) mainMenu.classList.remove('hidden');
    
    window.gameState.currentScreen = 'mainMenu';
}

function showErrorScreen(message: string): void {
    if (typeof window === 'undefined') return;
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
    
    // Create and show error screen
    const errorScreen = document.createElement('div');
    errorScreen.className = 'overlay';
    errorScreen.id = 'error-screen';
    errorScreen.innerHTML = `
        <div class="error-icon">⚠️</div>
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()">Reload</button>
    `;
    
    const uiContainer = document.getElementById('ui-container');
    if (uiContainer) uiContainer.appendChild(errorScreen);
    window.gameState.currentScreen = 'error';
}

// Initialize the application when the DOM is fully loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
} 