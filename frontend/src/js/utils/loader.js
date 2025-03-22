/**
 * Asset loading module for managing and loading game assets
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Asset storage
const assets = {
    models: {},
    textures: {},
    audio: {}
};

// Loaders
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const audioLoader = new THREE.AudioLoader();

// Asset manifests
const modelManifest = {
    // Will be populated as we create assets
};

const textureManifest = {
    // Will be populated as we create assets
    'grid': '/assets/textures/grid.png',
    'noise': '/assets/textures/noise.png'
};

const audioManifest = {
    // Will be populated as we create assets
};

/**
 * Load all required assets
 * @returns {Promise} Promise that resolves when all assets are loaded
 */
export async function loadAssets() {
    console.log('Loading assets...');
    
    // Show loading UI
    updateLoadingProgress(0, 'Initializing asset loader...');
    
    try {
        // Start with textures, they're usually smallest and quickest
        await loadTextures();
        
        // Then load models, which tend to be larger
        await loadModels();
        
        // Audio last, since it's not critical for initial display
        await loadAudio();
        
        console.log('All assets loaded successfully');
        return assets;
    } catch (error) {
        console.error('Error loading assets:', error);
        throw error;
    }
}

/**
 * Load all textures in the manifest
 */
async function loadTextures() {
    const texturePromises = [];
    const textureKeys = Object.keys(textureManifest);
    
    // Skip if no textures to load
    if (textureKeys.length === 0) {
        console.log('No textures to load.');
        return;
    }
    
    updateLoadingProgress(0, 'Loading textures...');
    
    // Create a promise for each texture
    textureKeys.forEach(key => {
        const path = textureManifest[key];
        const promise = new Promise((resolve, reject) => {
            textureLoader.load(
                path,
                // Success handler
                texture => {
                    texture.name = key;
                    assets.textures[key] = texture;
                    resolve(texture);
                },
                // Progress handler
                undefined,
                // Error handler
                error => {
                    console.error(`Error loading texture ${key}:`, error);
                    reject(error);
                }
            );
        });
        texturePromises.push(promise);
    });
    
    // Wait for all textures to load
    let loaded = 0;
    for (const promise of texturePromises) {
        await promise;
        loaded++;
        updateLoadingProgress(loaded / texturePromises.length * 30, `Loaded ${loaded}/${texturePromises.length} textures`);
    }
    
    console.log(`Loaded ${texturePromises.length} textures.`);
}

/**
 * Load all models in the manifest
 */
async function loadModels() {
    const modelPromises = [];
    const modelKeys = Object.keys(modelManifest);
    
    // Skip if no models to load
    if (modelKeys.length === 0) {
        console.log('No models to load.');
        return;
    }
    
    updateLoadingProgress(30, 'Loading models...');
    
    // Create a promise for each model
    modelKeys.forEach(key => {
        const path = modelManifest[key];
        const promise = new Promise((resolve, reject) => {
            gltfLoader.load(
                path,
                // Success handler
                gltf => {
                    assets.models[key] = gltf;
                    resolve(gltf);
                },
                // Progress handler
                undefined,
                // Error handler
                error => {
                    console.error(`Error loading model ${key}:`, error);
                    reject(error);
                }
            );
        });
        modelPromises.push(promise);
    });
    
    // Wait for all models to load
    let loaded = 0;
    for (const promise of modelPromises) {
        await promise;
        loaded++;
        updateLoadingProgress(30 + (loaded / modelPromises.length * 40), `Loaded ${loaded}/${modelPromises.length} models`);
    }
    
    console.log(`Loaded ${modelPromises.length} models.`);
}

/**
 * Load all audio files in the manifest
 */
async function loadAudio() {
    const audioPromises = [];
    const audioKeys = Object.keys(audioManifest);
    
    // Skip if no audio to load
    if (audioKeys.length === 0) {
        console.log('No audio to load.');
        return;
    }
    
    updateLoadingProgress(70, 'Loading audio...');
    
    // Create a promise for each audio file
    audioKeys.forEach(key => {
        const path = audioManifest[key];
        const promise = new Promise((resolve, reject) => {
            audioLoader.load(
                path,
                // Success handler
                buffer => {
                    assets.audio[key] = buffer;
                    resolve(buffer);
                },
                // Progress handler
                undefined,
                // Error handler
                error => {
                    console.error(`Error loading audio ${key}:`, error);
                    reject(error);
                }
            );
        });
        audioPromises.push(promise);
    });
    
    // Wait for all audio files to load
    let loaded = 0;
    for (const promise of audioPromises) {
        await promise;
        loaded++;
        updateLoadingProgress(70 + (loaded / audioPromises.length * 30), `Loaded ${loaded}/${audioPromises.length} audio files`);
    }
    
    console.log(`Loaded ${audioPromises.length} audio files.`);
}

/**
 * Update the loading progress in the UI
 * @param {number} percent - Loading progress (0-100)
 * @param {string} message - Status message to display
 */
function updateLoadingProgress(percent, message) {
    // Fire an event for the UI to display progress
    const event = new CustomEvent('loadingProgress', {
        detail: { percent, message }
    });
    window.dispatchEvent(event);
    
    // Also update directly if the loading-text element exists
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = `${message} (${Math.round(percent)}%)`;
    }
}

/**
 * Get an asset by its key
 * @param {string} type - Asset type: 'model', 'texture', or 'audio'
 * @param {string} key - Asset key
 * @returns {Object} The requested asset
 */
export function getAsset(type, key) {
    switch (type) {
        case 'model':
            return assets.models[key];
        case 'texture':
            return assets.textures[key];
        case 'audio':
            return assets.audio[key];
        default:
            console.error(`Unknown asset type: ${type}`);
            return null;
    }
}

/**
 * Create a new instance of a model
 * @param {string} key - Model key
 * @returns {Object} New instance of the model
 */
export function createModelInstance(key) {
    const model = assets.models[key];
    if (!model) {
        console.error(`Model not found: ${key}`);
        return null;
    }
    
    // Clone the model
    return model.scene.clone();
} 