import * as THREE from 'three';

// Renderer configuration defaults
const defaultConfig = {
    backgroundColor: 0x111111,
    antialias: true,
    shadowMap: true,
    nearPlane: 0.1,
    farPlane: 1000,
    fieldOfView: 75
};

/**
 * Initialize the Three.js rendering engine
 * @returns Object containing the renderer, scene, and camera
 */
export function initializeEngine(): { 
    renderer: THREE.WebGLRenderer; 
    scene: THREE.Scene; 
    camera: THREE.PerspectiveCamera;
} {
    // Get runtime window values
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const aspectRatio = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16/9;
    
    // Create config with runtime values
    const config = {
        ...defaultConfig,
        pixelRatio,
        aspectRatio
    };
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
        antialias: config.antialias,
        alpha: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(config.pixelRatio);
    renderer.setClearColor(config.backgroundColor);
    
    if (config.shadowMap) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    document.getElementById('game-container')?.appendChild(renderer.domElement);
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
        config.fieldOfView,
        config.aspectRatio,
        config.nearPlane,
        config.farPlane
    );
    camera.position.z = 5;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
    });
    
    return { renderer, scene, camera };
}

/**
 * Add a test cube to the scene
 * @param scene Three.js scene
 */
export function addTestCube(scene: THREE.Scene): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        roughness: 0.7,
        metalness: 0.2
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    
    scene.add(cube);
    
    // Animate cube
    const animate = () => {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    };
    
    animate();
} 