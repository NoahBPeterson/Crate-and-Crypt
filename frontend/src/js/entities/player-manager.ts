import * as THREE from 'three';
import { Player } from './player';

/**
 * Manages all players in the game, including the local player and remote players
 */
export class PlayerManager {
    localPlayer: Player | null = null;
    remotePlayers: Map<string, Player> = new Map();
    scene: THREE.Scene;
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }
    
    /**
     * Create the local player
     */
    createLocalPlayer(playerId: string): Player {
        console.log(`Creating local player with ID: ${playerId}`);
        
        // Create player instance
        this.localPlayer = new Player(playerId);
        
        // Add player model to scene
        this.localPlayer.addToScene(this.scene);
        
        // For testing, create a second player
        this.createTestRemotePlayer();
        
        // Return the camera for the renderer to use
        return this.localPlayer;
    }
    
    /**
     * Create a test remote player for debugging
     */
    createTestRemotePlayer(): void {
        const testPlayerId = "test-player-" + Math.floor(Math.random() * 1000);
        
        // Create test player at a position in front of the local player
        const testPosition = new THREE.Vector3(3, 0, -5);
        const testPlayer = new Player(testPlayerId, testPosition);
        
        // Add to scene and save in remote players map
        testPlayer.addToScene(this.scene);
        this.remotePlayers.set(testPlayerId, testPlayer);
        
        console.log(`Created test remote player: ${testPlayerId}`);
        
        // Make test player move in a circle
        this.animateTestPlayer(testPlayer);
    }
    
    /**
     * Animate test player in a circle
     */
    animateTestPlayer(player: Player): void {
        let angle = 0;
        const radius = 5;
        const center = player.position.clone();
        
        const moveInCircle = () => {
            // Increment angle
            angle += 0.01;
            
            // Calculate new position in circle
            const x = center.x + Math.cos(angle) * radius;
            const z = center.z + Math.sin(angle) * radius;
            
            // Update position
            player.position.set(x, center.y, z);
            player.model.position.copy(player.position);
            
            // Make player face center of circle
            player.model.rotation.y = angle + Math.PI / 2;
            
            // Call update to apply animations
            player.isMoving = true;
            player.update(0.016); // Assume 60fps
            
            // Continue animation
            requestAnimationFrame(moveInCircle);
        };
        
        moveInCircle();
    }
    
    /**
     * Update or create a remote player
     */
    updateRemotePlayer(playerId: string, position: THREE.Vector3, rotation: THREE.Euler): void {
        // Skip if this is the local player
        if (this.localPlayer && this.localPlayer.id === playerId) {
            return;
        }
        
        console.log(`Updating remote player: ${playerId}`, position);
        
        // Create new player if it doesn't exist
        if (!this.remotePlayers.has(playerId)) {
            console.log(`Adding remote player: ${playerId} at position:`, position);
            const player = new Player(playerId, position);
            player.addToScene(this.scene);
            
            // Make sure it's always visible (not in first person)
            player.isFirstPerson = false;
            player.model.visible = true;
            
            // Add to remote players map
            this.remotePlayers.set(playerId, player);
            
            console.log(`Current remote players: ${this.remotePlayers.size}`, 
                        Array.from(this.remotePlayers.keys()));
        }
        
        // Update existing player
        const player = this.remotePlayers.get(playerId)!;
        player.position.copy(position);
        player.model.position.copy(position);
        player.rotation.y = rotation.y;
        player.model.rotation.y = rotation.y;
        
        // Make sure remote player is visible
        player.model.visible = true;
        
        // Set player as moving for animations
        player.isMoving = true;
        
        // Reset after a short delay if no more updates
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
    }
    
    /**
     * Remove a remote player
     */
    removeRemotePlayer(playerId: string): void {
        if (this.remotePlayers.has(playerId)) {
            console.log(`Removing remote player: ${playerId}`);
            const player = this.remotePlayers.get(playerId)!;
            this.scene.remove(player.model);
            this.remotePlayers.delete(playerId);
        }
    }
    
    /**
     * Update all players
     */
    update(): void {
        // Local player updates are handled by input system
        // We could add animations or effects here
    }
    
    /**
     * Get local player position for network updates
     */
    getLocalPlayerState(): { position: THREE.Vector3, rotation: THREE.Euler } | null {
        if (!this.localPlayer) return null;
        
        return {
            position: this.localPlayer.position.clone(),
            rotation: this.localPlayer.rotation.clone()
        };
    }
} 