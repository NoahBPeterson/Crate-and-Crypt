/**
 * Global declarations for TypeScript
 */

// Import types
import * as THREE from 'three';
import { ControlsManager } from './utils/controls-manager';

// Extend the Window interface to include our global game objects
declare global {
    interface Window {
        gameEngine: {
            renderer: THREE.WebGLRenderer;
            scene: THREE.Scene;
            camera: THREE.Camera;
            playerManager: any;
            controls: ControlsManager;
            onWindowResize(): void;
            animate(): void;
            render(): void;
        };
        
        gameState: {
            initialized: boolean;
            connected: boolean;
            currentScreen: string;
            playerId: string | null;
            roomId: string | null;
            socket?: WebSocket;
            requestedRoomId?: string | null;
        };
    }
} 