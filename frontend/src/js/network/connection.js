/**
 * Network connection module for WebSocket communication with the server
 */

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // Start with 1 second

// Development server URL - will be replaced with production URL later
const SERVER_URL = 'ws://localhost:8080';

/**
 * Initialize the network system
 */
export function initNetwork() {
    // Set up event listeners for UI events
    window.addEventListener('joinGameRequest', handleJoinGameRequest);
    window.addEventListener('createGameRequest', handleCreateGameRequest);
    window.addEventListener('leaveGameRequest', handleLeaveGameRequest);
    
    // Also listen for game-related events that need to be sent to the server
    window.addEventListener('movementUpdated', handleMovementUpdated);
    window.addEventListener('playerAction', handlePlayerAction);
    
    console.log('Network system initialized');
}

/**
 * Connect to the WebSocket server
 */
export function connect() {
    if (socket) {
        console.log('Already connected or connecting...');
        return;
    }
    
    try {
        console.log(`Connecting to server at ${SERVER_URL}...`);
        socket = new WebSocket(SERVER_URL);
        
        socket.onopen = handleSocketOpen;
        socket.onmessage = handleSocketMessage;
        socket.onclose = handleSocketClose;
        socket.onerror = handleSocketError;
    } catch (error) {
        console.error('Error connecting to server:', error);
        notifyNetworkStatus(false, error.message);
    }
}

/**
 * Send a message to the server
 * @param {string} type - Message type
 * @param {object} data - Message data
 */
export function sendMessage(type, data = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('Cannot send message: Socket not connected');
        return false;
    }
    
    try {
        const message = JSON.stringify({ type, data });
        socket.send(message);
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
}

// === WebSocket Event Handlers ===

function handleSocketOpen(event) {
    console.log('Connected to server');
    reconnectAttempts = 0;
    notifyNetworkStatus(true);
}

function handleSocketMessage(event) {
    try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        
        if (message && message.type) {
            dispatchMessageEvent(message.type, message.data);
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
}

function handleSocketClose(event) {
    const wasClean = event.wasClean;
    const code = event.code;
    const reason = event.reason;
    
    console.log(`Socket closed: ${wasClean ? 'clean' : 'unclean'} close, code ${code}, reason: ${reason}`);
    
    socket = null;
    notifyNetworkStatus(false, reason);
    
    // Attempt to reconnect unless this was a clean close
    if (!wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect();
    }
}

function handleSocketError(event) {
    console.error('WebSocket error:', event);
}

// === Message Handling ===

function dispatchMessageEvent(type, data) {
    // Convert server message types to client event types
    const eventMap = {
        'welcome': 'playerJoined',
        'room_update': 'roomUpdated',
        'game_start': 'gameStarted',
        'game_end': 'gameEnded',
        'state_update': 'gameStateUpdated',
        'player_joined': 'playerJoined',
        'player_left': 'playerLeft',
        'game_event': 'gameEvent',
        'chat_message': 'chatMessageReceived',
        'error': 'serverError'
    };
    
    const eventType = eventMap[type] || type;
    const event = new CustomEvent(eventType, { detail: data });
    window.dispatchEvent(event);
    
    // Also update game state based on message type
    updateGameState(type, data);
}

function updateGameState(type, data) {
    switch (type) {
        case 'welcome':
            window.gameState.playerId = data.player_id;
            window.gameState.roomId = data.room_id;
            break;
        case 'room_update':
            // Update room state
            break;
        case 'game_start':
            // Switch to game screen
            const gameStartEvent = new CustomEvent('gameStateChanged', { 
                detail: { type: 'ENTER_GAME', data: {} }
            });
            window.dispatchEvent(gameStartEvent);
            break;
        case 'game_end':
            // Switch back to lobby
            const gameEndEvent = new CustomEvent('gameStateChanged', { 
                detail: { type: 'EXIT_GAME', data: {} }
            });
            window.dispatchEvent(gameEndEvent);
            break;
    }
}

// === UI Event Handlers ===

function handleJoinGameRequest(event) {
    const { roomId } = event.detail;
    
    // Connect if not already connected
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        connect();
        // The join message will be sent once connected
        const joinCallback = () => {
            sendMessage('join', { 
                player_name: 'Player_' + Math.floor(Math.random() * 1000),
                room_id: roomId
            });
            window.removeEventListener('networkConnected', joinCallback);
        };
        window.addEventListener('networkConnected', joinCallback);
    } else {
        // Already connected, send join message directly
        sendMessage('join', { 
            player_name: 'Player_' + Math.floor(Math.random() * 1000),
            room_id: roomId
        });
    }
}

function handleCreateGameRequest(event) {
    const { settings } = event.detail;
    
    // Connect if not already connected
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        connect();
        // The create message will be sent once connected
        const createCallback = () => {
            sendMessage('create_room', { settings });
            window.removeEventListener('networkConnected', createCallback);
        };
        window.addEventListener('networkConnected', createCallback);
    } else {
        // Already connected, send create message directly
        sendMessage('create_room', { settings });
    }
}

function handleLeaveGameRequest(event) {
    sendMessage('leave', {});
}

function handleMovementUpdated(event) {
    const movement = event.detail;
    
    // Only send movement updates if we're in a game
    if (window.gameState.currentScreen === 'game') {
        sendMessage('move', {
            direction: {
                x: movement.right ? 1 : (movement.left ? -1 : 0),
                y: 0,
                z: movement.backward ? 1 : (movement.forward ? -1 : 0)
            },
            timestamp: Date.now()
        });
    }
}

function handlePlayerAction(event) {
    const { action, target, data } = event.detail;
    
    // Only send actions if we're in a game
    if (window.gameState.currentScreen === 'game') {
        sendMessage(action, { target, ...data });
    }
}

// === Reconnection Logic ===

function scheduleReconnect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }
    
    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
    console.log(`Scheduling reconnect attempt ${reconnectAttempts + 1} in ${delay}ms`);
    
    reconnectTimer = setTimeout(() => {
        reconnectAttempts++;
        connect();
    }, delay);
}

// === Utility Functions ===

function notifyNetworkStatus(connected, error = null) {
    const event = new CustomEvent('networkStatusChanged', { 
        detail: { connected, error }
    });
    window.dispatchEvent(event);
    
    if (connected) {
        // Also dispatch a specific connected event for waiting callbacks
        window.dispatchEvent(new Event('networkConnected'));
    }
} 