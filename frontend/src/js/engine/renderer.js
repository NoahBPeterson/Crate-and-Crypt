import * as THREE from 'three';

let renderer, scene, camera;
let initialized = false;

/**
 * Initialize the Three.js rendering engine
 * @returns {Object} An object containing the renderer, scene, and camera
 */
export function initializeEngine() {
    if (initialized) {
        return { renderer, scene, camera };
    }
    
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.03);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        75, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near plane
        1000 // Far plane
    );
    camera.position.set(0, 1.6, 5); // Default position (eye height is ~1.6m)
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Add directional light (like sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Add axes helper for development
    if (process.env.NODE_ENV === 'development') {
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
    }
    
    // Add a simple ground plane
    addTemporaryGround();
    
    initialized = true;
    return { renderer, scene, camera };
}

/**
 * Handle window resize event
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Add a temporary ground plane for initial testing
 */
function addTemporaryGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
}

/**
 * Get the current rendering objects
 */
export function getRenderingObjects() {
    return { renderer, scene, camera };
} 