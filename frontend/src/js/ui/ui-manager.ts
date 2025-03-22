/**
 * UI Manager for handling all user interface elements
 */

// UI screens/sections
interface UIComponents {
    loadingScreen: HTMLElement | null;
    mainMenu: HTMLElement | null;
    gameUI: HTMLElement | null;
    settingsPanel: HTMLElement | null;
    inventory: HTMLElement | null;
    chat: HTMLElement | null;
}

// Track UI elements
const ui: UIComponents = {
    loadingScreen: null,
    mainMenu: null,
    gameUI: null,
    settingsPanel: null,
    inventory: null,
    chat: null
};

/**
 * Initialize all UI components
 */
export function initUI(): void {
    console.log('Initializing UI system...');
    
    // Create UI container if it doesn't exist
    let uiContainer = document.getElementById('ui-container');
    if (!uiContainer) {
        uiContainer = document.createElement('div');
        uiContainer.id = 'ui-container';
        document.body.appendChild(uiContainer);
    }
    
    // Initialize loading screen
    createLoadingScreen(uiContainer);
    
    // Initialize main menu
    createMainMenu(uiContainer);
    
    // Initialize game UI (initially hidden)
    createGameUI(uiContainer);
    
    // Initialize settings panel (initially hidden)
    createSettingsPanel(uiContainer);
    
    // Initialize inventory (initially hidden)
    createInventory(uiContainer);
    
    // Initialize chat (initially hidden)
    createChat(uiContainer);
    
    // Setup UI event listeners
    setupEventListeners();
    
    console.log('UI initialization complete');
}

/**
 * Create loading screen
 * @param parent Parent element
 */
function createLoadingScreen(parent: HTMLElement): void {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.className = 'overlay';
    
    loadingScreen.innerHTML = `
        <div class="loading-content">
            <h1>Crate and Crypt</h1>
            <div class="loading-bar-container">
                <div class="loading-bar"></div>
            </div>
            <p>Loading...</p>
        </div>
    `;
    
    parent.appendChild(loadingScreen);
    ui.loadingScreen = loadingScreen;
}

/**
 * Create main menu
 * @param parent Parent element
 */
function createMainMenu(parent: HTMLElement): void {
    const mainMenu = document.createElement('div');
    mainMenu.id = 'main-menu';
    mainMenu.className = 'overlay hidden';
    
    mainMenu.innerHTML = `
        <div class="menu-content">
            <h1>Crate and Crypt</h1>
            <div class="menu-buttons">
                <button id="play-button">Play</button>
                <button id="join-button">Join Game</button>
                <button id="settings-button">Settings</button>
                <button id="credits-button">Credits</button>
            </div>
        </div>
    `;
    
    parent.appendChild(mainMenu);
    ui.mainMenu = mainMenu;
}

/**
 * Create game UI
 * @param parent Parent element
 */
function createGameUI(parent: HTMLElement): void {
    const gameUI = document.createElement('div');
    gameUI.id = 'game-ui';
    gameUI.className = 'hidden';
    
    gameUI.innerHTML = `
        <div class="hud">
            <div class="hud-top">
                <div class="player-info">
                    <span id="player-name">Player</span>
                    <div class="health-bar">
                        <div class="health-fill"></div>
                    </div>
                </div>
                <div class="room-info">
                    <span id="room-id">Room: N/A</span>
                    <span id="player-count">Players: 0</span>
                </div>
            </div>
            <div class="hud-bottom">
                <div class="inventory-bar">
                    <div class="inventory-slot selected"></div>
                    <div class="inventory-slot"></div>
                    <div class="inventory-slot"></div>
                    <div class="inventory-slot"></div>
                    <div class="inventory-slot"></div>
                </div>
                <div class="action-buttons">
                    <button id="inventory-button">Inventory</button>
                    <button id="chat-button">Chat</button>
                    <button id="menu-button">Menu</button>
                </div>
            </div>
        </div>
    `;
    
    parent.appendChild(gameUI);
    ui.gameUI = gameUI;
}

/**
 * Create settings panel
 * @param parent Parent element
 */
function createSettingsPanel(parent: HTMLElement): void {
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'settings-panel';
    settingsPanel.className = 'overlay hidden';
    
    settingsPanel.innerHTML = `
        <div class="panel-content">
            <h2>Settings</h2>
            <div class="settings-form">
                <div class="setting-item">
                    <label for="volume-slider">Volume</label>
                    <input type="range" id="volume-slider" min="0" max="100" value="80">
                </div>
                <div class="setting-item">
                    <label for="graphics-quality">Graphics Quality</label>
                    <select id="graphics-quality">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label for="fullscreen">Fullscreen</label>
                    <input type="checkbox" id="fullscreen">
                </div>
            </div>
            <div class="panel-buttons">
                <button id="settings-save">Save</button>
                <button id="settings-cancel">Cancel</button>
            </div>
        </div>
    `;
    
    parent.appendChild(settingsPanel);
    ui.settingsPanel = settingsPanel;
}

/**
 * Create inventory panel
 * @param parent Parent element
 */
function createInventory(parent: HTMLElement): void {
    const inventory = document.createElement('div');
    inventory.id = 'inventory';
    inventory.className = 'overlay hidden';
    
    inventory.innerHTML = `
        <div class="inventory-content">
            <h2>Inventory</h2>
            <div class="inventory-grid">
                <!-- Inventory slots will be dynamically generated -->
            </div>
            <button id="inventory-close">Close</button>
        </div>
    `;
    
    parent.appendChild(inventory);
    ui.inventory = inventory;
}

/**
 * Create chat panel
 * @param parent Parent element
 */
function createChat(parent: HTMLElement): void {
    const chat = document.createElement('div');
    chat.id = 'chat';
    chat.className = 'panel hidden';
    
    chat.innerHTML = `
        <div class="chat-content">
            <div class="chat-messages" id="chat-messages">
                <!-- Chat messages will appear here -->
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Type a message...">
                <button id="chat-send">Send</button>
            </div>
        </div>
    `;
    
    parent.appendChild(chat);
    ui.chat = chat;
}

/**
 * Setup UI event listeners
 */
function setupEventListeners(): void {
    // Main menu buttons
    document.getElementById('play-button')?.addEventListener('click', () => {
        hideScreen('main-menu');
        showGameUI();
    });
    
    document.getElementById('join-button')?.addEventListener('click', () => {
        // Show join game dialog
        promptForRoomID();
    });
    
    document.getElementById('settings-button')?.addEventListener('click', () => {
        toggleScreen('settings-panel');
    });
    
    // Game UI buttons
    document.getElementById('inventory-button')?.addEventListener('click', () => {
        toggleScreen('inventory');
    });
    
    document.getElementById('chat-button')?.addEventListener('click', () => {
        toggleScreen('chat');
    });
    
    document.getElementById('menu-button')?.addEventListener('click', () => {
        toggleScreen('main-menu');
    });
    
    // Settings panel buttons
    document.getElementById('settings-save')?.addEventListener('click', () => {
        saveSettings();
        hideScreen('settings-panel');
    });
    
    document.getElementById('settings-cancel')?.addEventListener('click', () => {
        hideScreen('settings-panel');
    });
    
    // Inventory close button
    document.getElementById('inventory-close')?.addEventListener('click', () => {
        hideScreen('inventory');
    });
    
    // Chat send button
    document.getElementById('chat-send')?.addEventListener('click', sendChatMessage);
    
    // Chat input enter key
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

/**
 * Show game UI and hide other screens
 */
function showGameUI(): void {
    hideScreen('main-menu');
    hideScreen('settings-panel');
    hideScreen('loading-screen');
    
    const gameUI = document.getElementById('game-ui');
    if (gameUI) {
        gameUI.classList.remove('hidden');
    }
}

/**
 * Toggle visibility of a screen
 * @param screenId ID of the screen to toggle
 */
function toggleScreen(screenId: string): void {
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.toggle('hidden');
    }
}

/**
 * Hide a screen
 * @param screenId ID of the screen to hide
 */
function hideScreen(screenId: string): void {
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('hidden');
    }
}

/**
 * Show a screen
 * @param screenId ID of the screen to show
 */
function showScreen(screenId: string): void {
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
    }
}

/**
 * Prompt for room ID to join
 */
function promptForRoomID(): void {
    const roomId = prompt('Enter Room ID to join:');
    if (roomId) {
        // TODO: Connect to room
        console.log(`Joining room ${roomId}`);
        window.gameState.roomId = roomId;
        hideScreen('main-menu');
        showGameUI();
    }
}

/**
 * Save settings
 */
function saveSettings(): void {
    const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
    const graphicsQuality = document.getElementById('graphics-quality') as HTMLSelectElement;
    const fullscreen = document.getElementById('fullscreen') as HTMLInputElement;
    
    // Save settings to local storage
    if (volumeSlider && graphicsQuality && fullscreen) {
        const settings = {
            volume: volumeSlider.value,
            graphicsQuality: graphicsQuality.value,
            fullscreen: fullscreen.checked
        };
        
        localStorage.setItem('gameSettings', JSON.stringify(settings));
        
        // Apply settings
        applySettings(settings);
    }
}

/**
 * Apply saved settings
 * @param settings Settings object
 */
function applySettings(settings: { volume: string; graphicsQuality: string; fullscreen: boolean }): void {
    // TODO: Apply volume
    console.log(`Setting volume to ${settings.volume}`);
    
    // TODO: Apply graphics quality
    console.log(`Setting graphics quality to ${settings.graphicsQuality}`);
    
    // Apply fullscreen
    if (settings.fullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (!settings.fullscreen && document.fullscreenElement) {
        document.exitFullscreen();
    }
}

/**
 * Send chat message
 */
function sendChatMessage(): void {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput && chatInput.value.trim()) {
        const message = chatInput.value.trim();
        
        // Add message to chat
        addChatMessage('You', message);
        
        // Send to other players
        // TODO: Implement network send
        
        // Clear input
        chatInput.value = '';
    }
}

/**
 * Add chat message to chat window
 * @param sender Sender name
 * @param message Message text
 */
export function addChatMessage(sender: string, message: string): void {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `<span class="chat-sender">${sender}:</span> ${message}`;
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Show loading screen with progress
 * @param progress Progress value (0-100)
 */
export function showLoadingProgress(progress: number): void {
    const loadingBar = document.querySelector('.loading-bar') as HTMLElement;
    const loadingText = document.querySelector('#loading-screen p') as HTMLElement;
    
    if (loadingBar && loadingText) {
        loadingBar.style.width = `${progress}%`;
        loadingText.textContent = `Loading... ${Math.floor(progress)}%`;
    }
}

/**
 * Update player health display
 * @param health Health value (0-100)
 */
export function updateHealthDisplay(health: number): void {
    const healthFill = document.querySelector('.health-fill') as HTMLElement;
    if (healthFill) {
        healthFill.style.width = `${health}%`;
        
        // Change color based on health level
        if (health < 25) {
            healthFill.style.backgroundColor = '#ff3333';
        } else if (health < 50) {
            healthFill.style.backgroundColor = '#ff9933';
        } else {
            healthFill.style.backgroundColor = '#66cc33';
        }
    }
}

/**
 * Update room information display
 * @param roomId Room ID
 * @param playerCount Number of players
 */
export function updateRoomInfo(roomId: string, playerCount: number): void {
    const roomIdElement = document.getElementById('room-id');
    const playerCountElement = document.getElementById('player-count');
    
    if (roomIdElement) {
        roomIdElement.textContent = `Room: ${roomId}`;
    }
    
    if (playerCountElement) {
        playerCountElement.textContent = `Players: ${playerCount}`;
    }
} 