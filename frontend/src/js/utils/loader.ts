import * as THREE from 'three';
import { showLoadingProgress } from '../ui/ui-manager';

// Asset types
export enum AssetType {
    TEXTURE = 'texture',
    MODEL = 'model',
    AUDIO = 'audio',
    JSON = 'json'
}

// Asset registry
interface AssetRegistry {
    textures: { [key: string]: THREE.Texture };
    models: { [key: string]: THREE.Object3D };
    audio: { [key: string]: AudioBuffer };
    json: { [key: string]: any };
}

// Asset definition
interface AssetDefinition {
    type: AssetType;
    id: string;
    url: string;
    options?: any;
}

// Registry to store loaded assets
const assets: AssetRegistry = {
    textures: {},
    models: {},
    audio: {},
    json: {}
};

// List of all assets to load
const assetManifest: AssetDefinition[] = [
    // Textures
    { type: AssetType.TEXTURE, id: 'crate_diffuse', url: './public/assets/textures/crate_diffuse.jpg' },
    { type: AssetType.TEXTURE, id: 'crate_normal', url: './public/assets/textures/crate_normal.jpg' },
    { type: AssetType.TEXTURE, id: 'floor_diffuse', url: './public/assets/textures/floor_diffuse.jpg' },
    { type: AssetType.TEXTURE, id: 'floor_normal', url: './public/assets/textures/floor_normal.jpg' },
    
    // Models
    { type: AssetType.MODEL, id: 'crate', url: './public/assets/models/crate.glb' },
    { type: AssetType.MODEL, id: 'player', url: './public/assets/models/player.glb' },
    
    // Audio
    { type: AssetType.AUDIO, id: 'footstep', url: './public/assets/audio/footstep.mp3' },
    { type: AssetType.AUDIO, id: 'music', url: './public/assets/audio/music.mp3' },
    
    // JSON data
    { type: AssetType.JSON, id: 'levels', url: './public/assets/data/levels.json' },
    { type: AssetType.JSON, id: 'items', url: './public/assets/data/items.json' }
];

// Loaders
const textureLoader = new THREE.TextureLoader();
const modelLoader = new THREE.ObjectLoader();
// Create audio context only when needed
let audioContext: AudioContext | null = null;
let audioLoader: THREE.AudioLoader | null = null;

// Initialize audio components
function initAudio() {
    if (!audioContext && !audioLoader && typeof window !== 'undefined') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioLoader = new THREE.AudioLoader();
    }
}

/**
 * Load all assets from the manifest
 * @returns Promise resolving when all assets are loaded
 */
export async function loadAssets(): Promise<void> {
    // Initialize audio components
    initAudio();
    
    const totalAssets = assetManifest.length;
    let loadedAssets = 0;
    let errors = 0;
    
    const updateProgress = () => {
        loadedAssets++;
        const progress = (loadedAssets / totalAssets) * 100;
        showLoadingProgress(progress);
    };
    
    // Create an array of promises for loading all assets
    const loadPromises = assetManifest.map(async (asset) => {
        try {
            await loadAsset(asset);
            updateProgress();
        } catch (error) {
            console.error(`Failed to load asset ${asset.id} (${asset.url}):`, error);
            errors++;
            updateProgress();
        }
    });
    
    // Wait for all assets to load
    await Promise.all(loadPromises);
    
    if (errors > 0) {
        console.warn(`${errors} assets failed to load. The game will continue but some assets may be missing.`);
    }
    
    console.log('Asset loading complete');
}

/**
 * Load a single asset based on its type
 * @param asset Asset definition
 * @returns Promise resolving when the asset is loaded
 */
async function loadAsset(asset: AssetDefinition): Promise<void> {
    switch (asset.type) {
        case AssetType.TEXTURE:
            await loadTexture(asset);
            break;
            
        case AssetType.MODEL:
            await loadModel(asset);
            break;
            
        case AssetType.AUDIO:
            await loadAudio(asset);
            break;
            
        case AssetType.JSON:
            await loadJSON(asset);
            break;
            
        default:
            throw new Error(`Unknown asset type: ${asset.type}`);
    }
}

/**
 * Load a texture asset
 * @param asset Texture asset definition
 * @returns Promise resolving when the texture is loaded
 */
function loadTexture(asset: AssetDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            asset.url,
            (texture) => {
                assets.textures[asset.id] = texture;
                resolve();
            },
            undefined,
            (error) => {
                reject(error);
            }
        );
    });
}

/**
 * Load a 3D model asset
 * @param asset Model asset definition
 * @returns Promise resolving when the model is loaded
 */
function loadModel(asset: AssetDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
        modelLoader.load(
            asset.url,
            (object) => {
                assets.models[asset.id] = object;
                resolve();
            },
            undefined,
            (error) => {
                reject(error);
            }
        );
    });
}

/**
 * Load an audio asset
 * @param asset Audio asset definition
 * @returns Promise resolving when the audio is loaded
 */
function loadAudio(asset: AssetDefinition): Promise<void> {
    if (!audioLoader) {
        initAudio();
        if (!audioLoader) {
            return Promise.reject(new Error("Audio loader couldn't be initialized"));
        }
    }
    
    return new Promise((resolve, reject) => {
        audioLoader!.load(
            asset.url,
            (buffer) => {
                assets.audio[asset.id] = buffer;
                resolve();
            },
            undefined,
            (error) => {
                reject(error);
            }
        );
    });
}

/**
 * Load a JSON asset
 * @param asset JSON asset definition
 * @returns Promise resolving when the JSON is loaded
 */
function loadJSON(asset: AssetDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
        fetch(asset.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                assets.json[asset.id] = data;
                resolve();
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Get a loaded texture by ID
 * @param id Texture ID
 * @returns Texture or undefined if not found
 */
export function getTexture(id: string): THREE.Texture | undefined {
    return assets.textures[id];
}

/**
 * Get a loaded model by ID
 * @param id Model ID
 * @returns Model or undefined if not found
 */
export function getModel(id: string): THREE.Object3D | undefined {
    return assets.models[id];
}

/**
 * Get a loaded audio buffer by ID
 * @param id Audio ID
 * @returns Audio buffer or undefined if not found
 */
export function getAudio(id: string): AudioBuffer | undefined {
    return assets.audio[id];
}

/**
 * Get loaded JSON data by ID
 * @param id JSON data ID
 * @returns JSON data or undefined if not found
 */
export function getJSON(id: string): any {
    return assets.json[id];
}

/**
 * Check if an asset is loaded
 * @param type Asset type
 * @param id Asset ID
 * @returns True if the asset is loaded
 */
export function isAssetLoaded(type: AssetType, id: string): boolean {
    switch (type) {
        case AssetType.TEXTURE:
            return !!assets.textures[id];
            
        case AssetType.MODEL:
            return !!assets.models[id];
            
        case AssetType.AUDIO:
            return !!assets.audio[id];
            
        case AssetType.JSON:
            return !!assets.json[id];
            
        default:
            return false;
    }
} 