import * as THREE from 'three';

// Renderer configuration defaults
const defaultConfig = {
    backgroundColor: 0x000011, // Deep space blue
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
    
    // Add fog for atmosphere
    scene.fog = new THREE.FogExp2(0x000022, 0.02);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
        config.fieldOfView,
        config.aspectRatio,
        config.nearPlane,
        config.farPlane
    );
    camera.position.z = 5;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x334455, 0.3);
    scene.add(ambientLight);
    
    // Add directional light (main light)
    const directionalLight = new THREE.DirectionalLight(0xaaccff, 1.0);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add neon point lights for sci-fi atmosphere
    const neonLight1 = new THREE.PointLight(0x00ffff, 2.0, 30);
    neonLight1.position.set(5, 3, 5);
    scene.add(neonLight1);
    
    const neonLight2 = new THREE.PointLight(0xff00ff, 2.0, 30);
    neonLight2.position.set(-5, 3, 5);
    scene.add(neonLight2);
    
    const neonLight3 = new THREE.PointLight(0xffff00, 2.0, 30);
    neonLight3.position.set(0, 3, -5);
    scene.add(neonLight3);
    
    // Add spot lights for dramatic effect
    const spotLight1 = new THREE.SpotLight(0x00ffff, 1.5, 30, Math.PI / 4, 0.5);
    spotLight1.position.set(10, 5, 10);
    spotLight1.castShadow = true;
    scene.add(spotLight1);
    
    const spotLight2 = new THREE.SpotLight(0xff00ff, 1.5, 30, Math.PI / 4, 0.5);
    spotLight2.position.set(-10, 5, -10);
    spotLight2.castShadow = true;
    scene.add(spotLight2);
    
    // Create a basic environment
    createSciFiEnvironment(scene);
    
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
 * Create a sci-fi themed test environment
 * @param scene Three.js scene
 */
function createSciFiEnvironment(scene: THREE.Scene): void {
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50, 20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111122,
        roughness: 0.9,
        metalness: 0.3,
        wireframe: false,
        emissive: 0x000033,
        emissiveIntensity: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Add grid lines to the floor for sci-fi look
    const gridHelper = new THREE.GridHelper(50, 50, 0x0044ff, 0x002233);
    gridHelper.position.y = -0.49;
    scene.add(gridHelper);
    
    // Add some walls
    // Wall material
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x222233,
        roughness: 0.8,
        metalness: 0.4,
        emissive: 0x000044,
        emissiveIntensity: 0.1
    });
    
    // North wall
    const northWallGeometry = new THREE.BoxGeometry(50, 5, 0.5);
    const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, 2, -25);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    
    // East wall
    const eastWallGeometry = new THREE.BoxGeometry(0.5, 5, 50);
    const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(25, 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    
    // South wall
    const southWallGeometry = new THREE.BoxGeometry(50, 5, 0.5);
    const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, 2, 25);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    
    // West wall
    const westWallGeometry = new THREE.BoxGeometry(0.5, 5, 50);
    const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
    westWall.position.set(-25, 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    
    // Add some sci-fi crates/props
    addSciFiProps(scene);
}

/**
 * Add sci-fi props to the scene
 * @param scene Three.js scene
 */
function addSciFiProps(scene: THREE.Scene): void {
    // Create pulsing glow shader
    const pulsingGlowShader = {
        uniforms: {
            time: { value: 0 },
            baseColor: { value: new THREE.Color(0x445566) },
            glowColor: { value: new THREE.Color(0x00ffff) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 baseColor;
            uniform vec3 glowColor;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                // Create pulsing effect
                float pulse = sin(time * 2.0) * 0.5 + 0.5;
                
                // Create edge glow
                float edgeGlow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
                
                // Mix base color with glow color based on pulse and edge glow
                vec3 finalColor = mix(baseColor, glowColor, pulse * 0.5 + edgeGlow * 0.3);
                
                // Add some variation based on position
                float positionEffect = sin(vPosition.x * 2.0 + time) * 0.1 + 
                                     cos(vPosition.y * 2.0 + time) * 0.1;
                
                finalColor += glowColor * positionEffect * pulse;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    };

    // Create the pulsing material
    const crateMaterial = new THREE.ShaderMaterial({
        uniforms: pulsingGlowShader.uniforms,
        vertexShader: pulsingGlowShader.vertexShader,
        fragmentShader: pulsingGlowShader.fragmentShader,
        side: THREE.DoubleSide
    });
    
    // Add some crates
    for (let i = 0; i < 15; i++) {
        const size = 0.5 + Math.random() * 0.5;
        const crateGeometry = new THREE.BoxGeometry(size, size, size);
        const crate = new THREE.Mesh(crateGeometry, crateMaterial);
        
        // Random position
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        crate.position.set(x, size/2, z);
        
        // Random rotation
        crate.rotation.y = Math.random() * Math.PI * 2;
        
        crate.castShadow = true;
        crate.receiveShadow = true;
        scene.add(crate);
    }

    // Add some terminals/consoles
    for (let i = 0; i < 5; i++) {
        // Console base
        const baseGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.8);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x445566,
            roughness: 0.7,
            metalness: 0.5,
            emissive: 0x000066,
            emissiveIntensity: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        
        // Random position along walls
        let x = 0;
        let z = 0;
        const side = Math.floor(Math.random() * 4);
        
        switch(side) {
            case 0: // North wall
                x = (Math.random() - 0.5) * 40;
                z = -24.1; // Slightly in front of wall
                base.rotation.y = 0;
                break;
            case 1: // East wall
                x = 24.1; // Slightly in front of wall
                z = (Math.random() - 0.5) * 40;
                base.rotation.y = -Math.PI / 2;
                break;
            case 2: // South wall
                x = (Math.random() - 0.5) * 40;
                z = 24.1; // Slightly in front of wall
                base.rotation.y = Math.PI;
                break;
            case 3: // West wall
                x = -24.1; // Slightly in front of wall
                z = (Math.random() - 0.5) * 40;
                base.rotation.y = Math.PI / 2;
                break;
        }
        
        base.position.set(x, 0.75, z);
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        
        // Add screen with pulsing glow
        const screenGeometry = new THREE.BoxGeometry(1, 0.7, 0.1);
        const screenMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0x225588) },
                glowColor: { value: new THREE.Color(0x00ffff) }
            },
            vertexShader: pulsingGlowShader.vertexShader,
            fragmentShader: pulsingGlowShader.fragmentShader,
            side: THREE.DoubleSide
        });
        
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.y = 0.3999;
        screen.position.z = 0.3513;
        base.add(screen);
    }

    // Update the shader time uniform in the animation loop
    const animate = () => {
        requestAnimationFrame(animate);
        crateMaterial.uniforms.time.value += 0.016; // Approximately 60fps
        // Update screen materials time uniform
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) {
                object.material.uniforms.time.value = crateMaterial.uniforms.time.value;
            }
        });
    };
    animate();
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