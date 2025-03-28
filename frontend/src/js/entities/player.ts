import * as THREE from 'three';

/**
 * Player entity representing a space engineer/astronaut in the game
 */
export class Player {
    id: string;
    model: THREE.Group;
    camera: THREE.PerspectiveCamera;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    moveSpeed: number = 0.08;
    turnSpeed: number = 0.02;
    isFirstPerson: boolean = true;
    nameLabel: THREE.Sprite | null = null;
    
    // Animation properties
    isMoving: boolean = false;
    animationClock: THREE.Clock;
    previousPosition: THREE.Vector3;

    // Camera offsets
    firstPersonOffset: THREE.Vector3 = new THREE.Vector3(0, 1.6, 0); // Head height
    thirdPersonOffset: THREE.Vector3 = new THREE.Vector3(0, 2, 5); // Behind and above

    // Static member to track last position
    static lastPosition = new THREE.Vector3();

    constructor(id: string, startPosition?: THREE.Vector3) {
        this.id = id;
        this.position = startPosition || new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.model = this.createPlayerModel();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.animationClock = new THREE.Clock();
        this.previousPosition = this.position.clone();
        
        // Set initial position
        this.model.position.copy(this.position);
        
        // Always make the model visible if it's not the local player
        // The local player will have their model toggled by updateCameraPosition()
        const isLocalPlayer = (window.gameState.playerId === id);
        this.isFirstPerson = isLocalPlayer; // Only local player starts in first person
        this.model.visible = !isLocalPlayer; // Remote players are always visible
        
        // Create name label
        this.createNameLabel(isLocalPlayer ? "YOU" : this.formatPlayerId(id));
        
        this.updateCameraPosition();
        
        console.log(`Player ${id} created at position:`, this.position, isLocalPlayer ? '(local)' : '(remote)');
    }

    /**
     * Format player ID to a more readable form
     */
    formatPlayerId(id: string): string {
        // Remove the "temp-player-" prefix if present
        let displayName = id;
        if (displayName.startsWith('temp-player-')) {
            displayName = displayName.replace('temp-player-', 'P');
        }
        
        // If it's still a long ID, truncate it, but allow up to 10 chars
        if (displayName.length > 10) {
            return displayName.substring(0, 10);
        }
        return displayName;
    }
    
    /**
     * Create a name label above the player
     */
    createNameLabel(name: string): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) return;
        
        // Measure text to create appropriately sized label
        context.font = 'Bold 50px Arial';
        const textMetrics = context.measureText(name);
        const textWidth = textMetrics.width;
        
        // Add padding around text
        const padding = 40;
        const labelWidth = textWidth + padding * 2;
        
        // Set canvas dimensions based on text size
        canvas.width = labelWidth;
        canvas.height = 100;
        
        // Semi-transparent black background
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(context, 0, 0, canvas.width, canvas.height, 20);
        
        // Draw text
        context.font = 'Bold 50px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'rgba(200, 200, 200, 0.5)'; // Off-white with some transparency
        context.fillText(name, canvas.width / 2, canvas.height / 2);
        
        // Create sprite material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        // Create sprite - scale based on text width
        const sprite = new THREE.Sprite(material);
        const scaleX = labelWidth / 250; // Scale based on width
        sprite.scale.set(scaleX, 0.4, 1);
        sprite.position.set(0, 2.1, 0); // Positioned above player
        
        // Add to model
        this.model.add(sprite);
        this.nameLabel = sprite;
        
        // Helper function for rounded rectangles
        function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * Create sci-fi space engineer/astronaut model
     */
    createPlayerModel(): THREE.Group {
        // Create a group to hold all player model parts
        const playerGroup = new THREE.Group();
        
        // Create materials
        const suitMaterial = new THREE.MeshStandardMaterial({
            color: 0x2277cc, // Blue space suit
            roughness: 0.7,
            metalness: 0.2
        });
        
        const helmetMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222, // Dark helmet
            roughness: 0.1,
            metalness: 0.8
        });
        
        const visorMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ddff, // Light blue visor
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xff5500, // Orange accents
            roughness: 0.3,
            metalness: 0.5
        });
        
        // Body (torso) - increased height
        const bodyGeometry = new THREE.CapsuleGeometry(0.25, 0.9, 4, 8);
        const body = new THREE.Mesh(bodyGeometry, suitMaterial);
        body.position.y = 0.7; // Positioned higher
        body.castShadow = true;
        playerGroup.add(body);
        
        // Helmet - positioned higher
        const helmetGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 1.6; // Matches exactly with firstPersonOffset height (1.6)
        helmet.castShadow = true;
        playerGroup.add(helmet);
        
        // Visor - positioned higher
        const visorGeometry = new THREE.SphereGeometry(0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.rotation.x = Math.PI * 0.5;
        visor.position.set(0, 1.6, 0.12); // Match helmet height
        playerGroup.add(visor);
        
        // Backpack
        const backpackGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.2);
        const backpack = new THREE.Mesh(backpackGeometry, accentMaterial);
        backpack.position.set(0, 0.7, -0.25); // Match body height
        backpack.castShadow = true;
        playerGroup.add(backpack);
        
        // Arms - lengthened
        const armGeometry = new THREE.CapsuleGeometry(0.08, 0.85, 4, 8);
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, suitMaterial);
        leftArm.position.set(-0.35, 0.7, 0); // Match body height
        leftArm.rotation.z = -Math.PI / 8;
        leftArm.castShadow = true;
        playerGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, suitMaterial);
        rightArm.position.set(0.35, 0.7, 0); // Match body height
        rightArm.rotation.z = Math.PI / 8;
        rightArm.castShadow = true;
        playerGroup.add(rightArm);
        
        // Legs - lengthened but still prevent clipping
        const legGeometry = new THREE.CapsuleGeometry(0.08, 0.8, 4, 8);
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, suitMaterial);
        leftLeg.position.set(-0.15, 0, 0); // Adjusted to prevent clipping
        leftLeg.castShadow = true;
        playerGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, suitMaterial);
        rightLeg.position.set(0.15, 0, 0); // Adjusted to prevent clipping
        rightLeg.castShadow = true;
        playerGroup.add(rightLeg);
        
        // Add lights to the suit (glowing accents)
        const leftLightGeometry = new THREE.SphereGeometry(0.05);
        const leftLight = new THREE.Mesh(leftLightGeometry, accentMaterial);
        leftLight.position.set(-0.2, 1.0, 0.2); // Positioned higher
        playerGroup.add(leftLight);
        
        const rightLightGeometry = new THREE.SphereGeometry(0.05);
        const rightLight = new THREE.Mesh(rightLightGeometry, accentMaterial);
        rightLight.position.set(0.2, 1.0, 0.2); // Positioned higher
        playerGroup.add(rightLight);
        
        return playerGroup;
    }
    
    /**
     * Toggle between first and third-person view
     */
    toggleView(): void {
        this.isFirstPerson = !this.isFirstPerson;
        this.updateCameraPosition();
        console.log(`Switched to ${this.isFirstPerson ? 'first' : 'third'} person view`);
    }

    /**
     * Update the camera position based on player position
     */
    updateCameraPosition(): void {
        if (this.isFirstPerson) {
            // First-person: camera at head position
            this.camera.position.copy(this.position).add(this.firstPersonOffset);
            this.camera.rotation.copy(this.rotation);
            
            // Hide player model in first-person view
            this.model.visible = false;
        } else {
            // Third-person: camera behind player
            const offset = this.thirdPersonOffset.clone();
            
            // Rotate the offset based on player rotation
            const rotationMatrix = new THREE.Matrix4().makeRotationY(this.rotation.y);
            offset.applyMatrix4(rotationMatrix);
            
            // Position camera behind player
            this.camera.position.copy(this.position).add(offset);
            
            // Point camera at player's head
            const target = this.position.clone().add(this.firstPersonOffset);
            this.camera.lookAt(target);
            
            // Show player model in third-person view
            this.model.visible = true;
        }
    }
    
    /**
     * Move the player
     */
    move(direction: THREE.Vector3): void {
        // Store previous position for animation checks
        this.previousPosition.copy(this.position);
        
        // Apply movement
        this.position.add(direction.multiplyScalar(this.moveSpeed));
        this.model.position.copy(this.position);
        this.updateCameraPosition();
        
        // Set moving flag for animations
        this.isMoving = true;
        
        // After a short delay, set moving to false if not called again
        setTimeout(() => {
            this.isMoving = false;
        }, 100);
    }
    
    /**
     * Rotate the player
     */
    rotate(x: number, y: number): void {
        this.rotation.y -= x * this.turnSpeed;
        this.rotation.x -= y * this.turnSpeed;
        
        // Limit vertical rotation
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        
        this.model.rotation.y = this.rotation.y;
        this.updateCameraPosition();
    }
    
    /**
     * Add player to scene
     */
    addToScene(scene: THREE.Scene): void {
        scene.add(this.model);
    }
    
    /**
     * Update player (called each frame)
     */
    update(deltaTime: number): void {
        // Check if position has changed meaningfully since last move
        const positionChanged = this.position.distanceTo(this.previousPosition) > 0.01;
        
        // Only apply walking animation if the player has actually moved position
        if (this.isMoving && positionChanged && !this.isFirstPerson) {
            const time = this.animationClock.getElapsedTime();
            const bounce = Math.sin(time * 10) * 0.05;
            
            // Apply bounce to player model
            this.model.position.y = this.position.y + bounce;
            
            // Also apply slight rotation to model for walking effect
            const twist = Math.sin(time * 5) * 0.05;
            this.model.rotation.z = twist;
        } else {
            // Reset position and rotation when not moving
            this.model.position.y = this.position.y;
            this.model.rotation.z = 0;
        }
    }
}

/**
 * Export a function to help with debugging
 */
export function debugPlayerMovement(): void {
    if (!window.gameEngine?.playerManager?.localPlayer) {
        console.error("No local player found!");
        return;
    }
    
    const player = window.gameEngine.playerManager.localPlayer;
    console.log("Player position:", player.position);
    console.log("Player rotation:", player.rotation);
    console.log("Camera position:", player.camera.position);
    
    // Move player forward as a test
    const forwardVector = new THREE.Vector3(0, 0, -1);
    const rotationMatrix = new THREE.Matrix4().makeRotationY(player.rotation.y);
    forwardVector.applyMatrix4(rotationMatrix);
    forwardVector.normalize().multiplyScalar(player.moveSpeed);
    
    player.move(forwardVector);
    console.log("Moved player forward, new position:", player.position);
} 