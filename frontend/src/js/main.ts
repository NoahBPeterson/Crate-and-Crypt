/**
 * Initialize the game engine and global state
 */
function initGame() {
    console.log("Initializing game...");
    
    // Initialize game state
    window.gameState = {
        initialized: false,
        connected: false,
        currentScreen: 'loading',
        playerId: null,
        roomId: null,
        socket: null,
        requestedRoomId: null
    };
    
    // Create game engine
    window.gameEngine = new GameEngine();
    
    // Initialize player manager and add to game engine
    const playerManager = new PlayerManager(window.gameEngine.scene);
    window.gameEngine.playerManager = playerManager;

    // Initialize UI system
    initUI();
    
    // Initialize network
    initNetwork();
    
    // Initialize controls manager if not already created
    if (!window.gameEngine.controls) {
        window.gameEngine.controls = new ControlsManager();
    }
    
    // Mark game as initialized
    window.gameState.initialized = true;
    
    // Show the main menu
    showScreen('main-menu');
    hideScreen('loading-screen');
} 