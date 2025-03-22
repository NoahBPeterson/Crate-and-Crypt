/**
 * UI Manager - Handles all UI elements and interactions
 */

/**
 * Initialize the UI system
 */
export function initUI() {
    setupEventListeners();
    setupButtonHandlers();
    
    console.log('UI system initialized');
}

/**
 * Setup UI-related event listeners
 */
function setupEventListeners() {
    // Listen for game state changes
    window.addEventListener('gameStateChanged', handleGameStateChange);
    
    // Listen for network status changes
    window.addEventListener('networkStatusChanged', handleNetworkStatusChange);
}

/**
 * Setup button click handlers
 */
function setupButtonHandlers() {
    // Main menu buttons
    document.getElementById('join-game').addEventListener('click', handleJoinGame);
    document.getElementById('create-game').addEventListener('click', handleCreateGame);
    document.getElementById('settings').addEventListener('click', handleSettings);
    
    console.log('Button handlers initialized');
}

/**
 * Handle game state changes
 */
function handleGameStateChange(event) {
    const { type, data } = event.detail;
    
    console.log('Game state changed:', type, data);
    
    switch (type) {
        case 'ENTER_GAME':
            showGameUI();
            break;
        case 'EXIT_GAME':
            showMainMenu();
            break;
        case 'UPDATE_PLAYER_STATUS':
            updatePlayerStatus(data);
            break;
        case 'UPDATE_MISSION_INFO':
            updateMissionInfo(data);
            break;
        case 'UPDATE_TEAM_STATUS':
            updateTeamStatus(data);
            break;
    }
}

/**
 * Handle network status changes
 */
function handleNetworkStatusChange(event) {
    const { connected, error } = event.detail;
    
    if (connected) {
        console.log('Connected to server');
    } else {
        console.log('Disconnected from server:', error);
        if (error) {
            showErrorMessage('Connection lost: ' + error);
        }
    }
}

/**
 * Show the in-game UI
 */
function showGameUI() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    window.gameState.currentScreen = 'game';
}

/**
 * Show the main menu
 */
function showMainMenu() {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    window.gameState.currentScreen = 'mainMenu';
}

/**
 * Update player status display
 */
function updatePlayerStatus(data) {
    const playerStatus = document.getElementById('player-status');
    playerStatus.innerHTML = `
        <div class="player-health">Health: ${data.health}%</div>
        <div class="player-stamina">Stamina: ${data.stamina}%</div>
    `;
}

/**
 * Update mission information display
 */
function updateMissionInfo(data) {
    const missionInfo = document.getElementById('mission-info');
    missionInfo.innerHTML = `
        <div class="mission-time">Time: ${formatTime(data.timeRemaining)}</div>
        <div class="mission-profit">Profit: $${data.profit}/$${data.quota}</div>
    `;
}

/**
 * Update team status display
 */
function updateTeamStatus(data) {
    const teamStatus = document.getElementById('team-status');
    teamStatus.innerHTML = '<div class="team-list">Team:</div>';
    
    data.players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'team-player';
        playerElement.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-health">${player.health}%</span>
        `;
        teamStatus.appendChild(playerElement);
    });
}

/**
 * Show an error message to the user
 */
function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    document.body.appendChild(errorElement);
    
    // Remove the message after 5 seconds
    setTimeout(() => {
        document.body.removeChild(errorElement);
    }, 5000);
}

// === Button Handlers ===

/**
 * Handle join game button click
 */
function handleJoinGame() {
    console.log('Join game clicked');
    showJoinGameDialog();
}

/**
 * Handle create game button click
 */
function handleCreateGame() {
    console.log('Create game clicked');
    showCreateGameDialog();
}

/**
 * Handle settings button click
 */
function handleSettings() {
    console.log('Settings clicked');
    showSettingsDialog();
}

/**
 * Show the join game dialog
 */
function showJoinGameDialog() {
    // Implementation will be added later
    // For now, we'll just emit an event for the network system
    const event = new CustomEvent('joinGameRequest', { detail: { roomId: 'test-room' } });
    window.dispatchEvent(event);
}

/**
 * Show the create game dialog
 */
function showCreateGameDialog() {
    // Implementation will be added later
    // For now, we'll just emit an event for the network system
    const event = new CustomEvent('createGameRequest', { detail: { settings: { difficulty: 'normal' } } });
    window.dispatchEvent(event);
}

/**
 * Show the settings dialog
 */
function showSettingsDialog() {
    // Implementation will be added later
}

/**
 * Format time in mm:ss format
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} 