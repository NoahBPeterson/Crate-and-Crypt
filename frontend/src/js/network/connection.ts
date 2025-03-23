/**
 * Network connection module for WebSocket communication
 */

// Import THREE library for 3D operations
import * as THREE from 'three';

// WebSocket connection variables
let socket: WebSocket | null = null;
let connectionUrl: string = '';
let isConnected: boolean = false;
let reconnectAttempts: number = 0;
const maxReconnectAttempts: number = 5;

// Define message types
export enum MessageType {
    JOIN = 'Join',
    LEAVE = 'Leave',
    CHAT = 'Chat',
    PLAYER_UPDATE = 'PlayerUpdate',
    WORLD_UPDATE = 'WorldUpdate',
    ERROR = 'Error',
    PING = 'Ping',
    PONG = 'Pong'
}

// Message interface
export interface NetworkMessage {
    type: MessageType;
    payload: any;
    timestamp: number;
}

// Connection status
export enum ConnectionStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
}

// Singleton connection instance
let wsConnection: WebSocket | null = null;
let connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
const RECONNECT_DELAY: number = 2000;

// Event callbacks
const eventListeners: { [key: string]: Array<(data: any) => void> } = {
    connect: [],
    disconnect: [],
    message: [],
    error: []
};

/**
 * Initialize the network connection
 */
export function initNetwork() {
    console.log("Initializing network connection...");
    
    // Check URL for room ID
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get('roomId');
    
    // Generate a temporary player ID for this session
    const tempPlayerId = `player${Math.floor(Math.random() * 1000)}`;
    window.gameState.playerId = tempPlayerId;
    
    console.log(`Generated temporary player ID: ${tempPlayerId}`);
    
    // Do NOT create a player or connect to the server yet
    // Wait for user action instead
    
    // If room ID is in URL, store it but don't auto-join
    if (roomIdFromUrl) {
        console.log(`Found room ID in URL: ${roomIdFromUrl}`);
        window.gameState.roomId = roomIdFromUrl;
        
        // Update room ID display if it exists
        const roomIdElement = document.getElementById('room-id');
        if (roomIdElement) {
            roomIdElement.textContent = `Room: ${roomIdFromUrl}`;
        }
    }
}

/**
 * Start the game when the user clicks Play
 */
export function startGame(roomId?: string) {
    console.log("Starting game...");
    
    // Now create the player
    const playerManager = window.gameEngine.playerManager;
    const localPlayer = playerManager.createLocalPlayer(window.gameState.playerId || 'unknown-player');
    
    // Use the player's camera for rendering
    window.gameEngine.camera = localPlayer.camera;
    
    // Connect to the server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const connectionUrl = `${protocol}//${host}/ws`;
    
    // Connect with the appropriate player ID
    connectToServer(connectionUrl, window.gameState.playerId || 'unknown-player', roomId);
    
    // Don't try to use controls yet - it's undefined
    // window.gameEngine.controls.enableMouseControls();
}

/**
 * Connect to the server
 */
function connectToServer(url: string, playerId: string, roomId: string | null = null) {
    console.log(`Connecting to WebSocket server at ${url}`);
    console.log(`Player ID: ${playerId}, Room ID: ${roomId}`);
    
    // Initialize WebSocket connection
    const socket = new WebSocket(`${url}?playerId=${playerId}`);
    
    // Store reference to socket
    window.gameState.socket = socket;
    
    // Set up event handlers
    socket.onopen = () => {
        console.log('Connected to WebSocket server');
        
        // Send join message with the appropriate parameters
        if (roomId) {
            joinRoom(roomId);
        } else {
            createRoom();
        }
        
        // Start heartbeat
        startHeartbeat();
    };
    
    socket.onmessage = (event) => {
        handleMessage(event.data);
    };
    
    socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

/**
 * Connect to the WebSocket server
 * @param playerId Optional player ID for reconnecting
 * @param roomId Optional room ID for joining specific room
 * @returns Promise resolving when connected
 */
export function connect(playerId?: string, roomId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Build URL with query parameters if provided
        let url = connectionUrl;
        const params = new URLSearchParams();
        
        if (playerId) {
            params.append('playerId', playerId);
        }
        
        if (roomId) {
            params.append('roomId', roomId);
        }
        
        const queryString = params.toString();
        if (queryString) {
            url = `${url}?${queryString}`;
        }
        
        // Set status to connecting
        connectionStatus = ConnectionStatus.CONNECTING;
        triggerEvent('connect', { status: connectionStatus });
        
        // Create WebSocket connection
        wsConnection = new WebSocket(url);
        
        // Setup event handlers
        wsConnection.onopen = () => {
            console.log('WebSocket connection established');
            connectionStatus = ConnectionStatus.CONNECTED;
            reconnectAttempts = 0;
            window.gameState.connected = true;
            triggerEvent('connect', { status: connectionStatus });
            resolve();
        };
        
        wsConnection.onclose = (event) => {
            console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
            connectionStatus = ConnectionStatus.DISCONNECTED;
            window.gameState.connected = false;
            triggerEvent('disconnect', { code: event.code, reason: event.reason });
            
            // Attempt to reconnect if connection was previously established
            if (reconnectAttempts < maxReconnectAttempts) {
                console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
                reconnectAttempts++;
                setTimeout(() => {
                    connect(playerId, roomId).catch(console.error);
                }, RECONNECT_DELAY);
            }
        };
        
        wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
            connectionStatus = ConnectionStatus.ERROR;
            triggerEvent('error', { error });
            reject(error);
        };
        
        wsConnection.onmessage = (event) => {
            handleMessage(event.data);
        };
    });
}

/**
 * Disconnect from the WebSocket server
 */
export function disconnect(): void {
    if (wsConnection && connectionStatus === ConnectionStatus.CONNECTED) {
        wsConnection.close(1000, 'Client initiated disconnect');
    }
}

/**
 * Send a message to the server
 * @param type Message type
 * @param payload Message payload
 * @returns True if the message was sent
 */
export function sendMessage(type: MessageType, payload: any): boolean {
    if (!window.gameState.socket || window.gameState.socket.readyState !== WebSocket.OPEN) {
        // Don't show these warnings in the console to reduce spam
        return false;
    }
    
    const message = {
        type,
        payload,
        timestamp: Date.now()
    };
    
    try {
        window.gameState.socket.send(JSON.stringify(message));
        return true;
    } catch (error) {
        console.error('Failed to send message:', error);
        return false;
    }
}

/**
 * Handle incoming messages
 * @param data Raw message data
 */
function handleMessage(data: string): void {
    try {
        const message: NetworkMessage = JSON.parse(data);
        console.log('Received message from server:', message);
        
        // Handle special message types
        switch (message.type) {
            case MessageType.PING:
                // Respond to ping with pong
                sendMessage(MessageType.PONG, { time: message.payload.time });
                break;
                
            case MessageType.JOIN:
                // Update player info if server assigned a new ID
                if (message.payload.player_id) {
                    window.gameState.playerId = message.payload.player_id;
                    console.log('Server assigned player ID:', message.payload.player_id);
                    
                    // Create player in the scene
                    handleJoinResponse(message);
                }
                
                // Update room info - Debug the payload to see the room ID
                console.log("JOIN payload received:", message.payload);
                if (message.payload.room_id) {
                    window.gameState.roomId = message.payload.room_id;
                    console.log('Joined room:', message.payload.room_id);
                    
                    // Update room info in UI
                    updateRoomInfo(message.payload.room_id);
                    
                    // Update player count if we have room data
                    if (message.payload.players_count) {
                        updatePlayerCount(message.payload.players_count);
                    }
                } else {
                    console.warn('No room ID in JOIN response');
                }
                break;
                
            case MessageType.PLAYER_UPDATE:
                // Handle player position/rotation updates for remote players
                if (message.payload.player_id && message.payload.player_id !== window.gameState.playerId) {
                    console.log(`Received position update for player: ${message.payload.player_id}`, message.payload);
                    
                    const position = new THREE.Vector3(
                        message.payload.position.x,
                        message.payload.position.y,
                        message.payload.position.z
                    );
                    
                    // Extract rotation from the position object's rotation field
                    const rotation = new THREE.Euler(
                        0, // No rotation in X axis
                        message.payload.position.rotation || 0, // Y axis rotation
                        0, // No rotation in Z axis
                        'YXZ'
                    );
                    
                    window.gameEngine.playerManager.updateRemotePlayer(
                        message.payload.player_id,
                        position,
                        rotation
                    );
                }
                break;
                
            case MessageType.LEAVE:
                // Remove player who has left
                if (message.payload.playerId) {
                    window.gameEngine.playerManager.removeRemotePlayer(message.payload.playerId);
                }
                break;
                
            case MessageType.ERROR:
                console.error('Server error:', message.payload.message);
                break;
        }
        
        // Trigger message event for all message types
        triggerEvent('message', message);
        
    } catch (error) {
        console.error('Error parsing message:', error);
    }
}

/**
 * Handle join response
 * @param message Join message from server
 */
function handleJoinResponse(message: any): void {
    // Handle the join response
    const payload = message.payload;
    
    if (payload.player_id) {
        console.log(`Successfully joined room as player ${payload.player_id}`);
        window.gameState.playerId = payload.player_id;
        
        // If we already created a temp player, just update the ID
        if (window.gameEngine.playerManager.localPlayer) {
            window.gameEngine.playerManager.localPlayer.id = payload.player_id;
        } else {
            // Create player in the scene if not already created
            const playerManager = window.gameEngine.playerManager;
            const localPlayer = playerManager.createLocalPlayer(payload.player_id);
            
            // Use the player's camera for rendering
            window.gameEngine.camera = localPlayer.camera;
        }
    }
    
    // Show room ID if available (using either room_id from the backend or roomId format)
    if (payload.room_id) {
        window.gameState.roomId = payload.room_id;
        console.log(`Room ID: ${payload.room_id} - Share this with friends to join!`);
        
        // Update the UI
        updateRoomInfo(payload.room_id);
    } else if (payload.roomId) {
        window.gameState.roomId = payload.roomId;
        console.log(`Room ID: ${payload.roomId} - Share this with friends to join!`);
        
        // Update the UI
        updateRoomInfo(payload.roomId);
    }
    
    // Start position updates
    startPlayerUpdates();
}

/**
 * Update the room info in the UI
 */
function updateRoomInfo(roomId: string): void {
    // Update room ID display in game UI
    const roomIdElement = document.getElementById('room-id');
    if (roomIdElement) {
        roomIdElement.textContent = `Room: ${roomId}`;
    }
    
    // Create a floating room ID display
    displayRoomId(roomId);
}

/**
 * Start sending periodic player position updates
 */
function startPlayerUpdates(): void {
    // Variables to track the last sent position and rotation
    let lastSentPosition = new THREE.Vector3();
    let lastSentRotation = 0;
    
    // Send player position updates every 100ms (10 updates per second)
    setInterval(() => {
        // Make sure player exists and we're in a room
        if (!window.gameEngine.playerManager.localPlayer || !window.gameState.roomId) {
            return;
        }
        
        // Don't try to send updates if not connected
        if (!window.gameState.socket || window.gameState.socket.readyState !== WebSocket.OPEN) {
            return;
        }
        
        const player = window.gameEngine.playerManager.localPlayer;
        
        // Check if position or rotation has changed enough to warrant an update
        const positionChanged = player.position.distanceTo(lastSentPosition) > 0.01;
        const rotationChanged = Math.abs(player.rotation.y - lastSentRotation) > 0.01;
        
        // Only send update if position or rotation has changed
        if (positionChanged || rotationChanged) {
            // Update the last sent values
            lastSentPosition.copy(player.position);
            lastSentRotation = player.rotation.y;
            
            // Send position update - use the exact field names expected by the backend
            sendMessage(MessageType.PLAYER_UPDATE, {
                player_id: player.id, // changed from 'playerId' to 'player_id' to match backend
                position: {
                    x: player.position.x,
                    y: player.position.y,
                    z: player.position.z,
                    rotation: player.rotation.y
                },
                action: "move" // Add the action field that backend expects
            });
        }
    }, 100);
}

/**
 * Add an event listener
 * @param event Event name
 * @param callback Callback function
 */
export function on(event: string, callback: (data: any) => void): void {
    if (!eventListeners[event]) {
        eventListeners[event] = [];
    }
    
    eventListeners[event].push(callback);
}

/**
 * Remove an event listener
 * @param event Event name
 * @param callback Callback function
 */
export function off(event: string, callback: (data: any) => void): void {
    if (!eventListeners[event]) {
        return;
    }
    
    const index = eventListeners[event].indexOf(callback);
    if (index !== -1) {
        eventListeners[event].splice(index, 1);
    }
}

/**
 * Trigger an event
 * @param event Event name
 * @param data Event data
 */
function triggerEvent(event: string, data: any): void {
    if (!eventListeners[event]) {
        return;
    }
    
    for (const callback of eventListeners[event]) {
        try {
            callback(data);
        } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
        }
    }
}

/**
 * Create a new game room
 */
function createRoom(): void {
    if (!window.gameState.socket || window.gameState.socket.readyState !== WebSocket.OPEN) {
        console.error('Cannot create room: WebSocket not connected');
        return;
    }
    
    console.log('Creating new game room...');
    
    // Create a join message with create_room flag
    const joinMessage = {
        type: MessageType.JOIN,
        payload: {
            player_id: window.gameState.playerId,
            create_room: true
        },
        timestamp: Date.now()
    };
    
    try {
        // Send the message to the server
        window.gameState.socket.send(JSON.stringify(joinMessage));
        console.log('Sent create room request');
    } catch (error) {
        console.error('Failed to send create room request:', error);
    }
}

/**
 * Join an existing game room
 */
function joinRoom(roomId: string): void {
    if (!window.gameState.socket || window.gameState.socket.readyState !== WebSocket.OPEN) {
        console.error('Cannot join room: WebSocket not connected');
        return;
    }
    
    if (!roomId) {
        console.error('Cannot join room: No room ID provided');
        return;
    }
    
    console.log(`Joining room: ${roomId}`);
    
    // Store the intended room ID so we can check it later
    window.gameState.requestedRoomId = roomId;
    
    // Create a join message with the room ID
    const joinMessage = {
        type: MessageType.JOIN,
        payload: {
            player_id: window.gameState.playerId,
            room_id: roomId
        },
        timestamp: Date.now()
    };
    
    try {
        // Send the message to the server
        window.gameState.socket.send(JSON.stringify(joinMessage));
        console.log(`Sent join request for room ${roomId}`);
    } catch (error) {
        console.error('Failed to send join request:', error);
    }
}

/**
 * Send a chat message
 * @param text Message text
 */
export function sendChatMessage(text: string): void {
    sendMessage(MessageType.CHAT, { text });
}

/**
 * Get the current connection status
 * @returns Connection status
 */
export function getConnectionStatus(): ConnectionStatus {
    return connectionStatus;
}

/**
 * Send a join request to the server
 */
function sendJoinRequest(): void {
    sendMessage(MessageType.JOIN, {
        createRoom: true
    });
}

/**
 * Start heartbeat to keep connection alive
 */
function startHeartbeat(): void {
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds
    
    setInterval(() => {
        if (window.gameState.socket?.readyState === WebSocket.OPEN) {
            // Send ping message to keep connection alive
            const pingMessage = {
                type: MessageType.PING,
                payload: { time: Date.now() },
                timestamp: Date.now()
            };
            
            window.gameState.socket.send(JSON.stringify(pingMessage));
        }
    }, HEARTBEAT_INTERVAL);
}

/**
 * Display the room ID on screen for easy sharing
 */
function displayRoomId(roomId: string): void {
    if (typeof document === 'undefined') return;
    
    // Create room ID display
    const roomIdDisplay = document.createElement('div');
    roomIdDisplay.id = 'room-id-display';
    roomIdDisplay.style.position = 'absolute';
    roomIdDisplay.style.top = '10px';
    roomIdDisplay.style.right = '10px';
    roomIdDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    roomIdDisplay.style.color = 'white';
    roomIdDisplay.style.padding = '10px';
    roomIdDisplay.style.borderRadius = '5px';
    roomIdDisplay.style.fontFamily = 'monospace';
    roomIdDisplay.style.fontSize = '14px';
    roomIdDisplay.style.zIndex = '1000';
    
    roomIdDisplay.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 5px;">Room ID</h3>
        <p style="font-size: 24px; margin-top: 0; margin-bottom: 5px; text-align: center;">${roomId}</p>
        <p style="margin-top: 0; margin-bottom: 0;"><small>Share with friends to join</small></p>
    `;
    
    // Remove any existing display
    const existingDisplay = document.getElementById('room-id-display');
    if (existingDisplay && existingDisplay.parentNode) {
        existingDisplay.parentNode.removeChild(existingDisplay);
    }
    
    // Add to document
    document.body.appendChild(roomIdDisplay);
    
    // Update URL with room ID for easy sharing
    const url = new URL(window.location.href);
    url.searchParams.set('roomId', roomId);
    window.history.replaceState({}, '', url.toString());
}

/**
 * Update the player count in the UI
 */
function updatePlayerCount(count: number): void {
    // Update player count display
    const playerCountElement = document.getElementById('player-count');
    if (playerCountElement) {
        playerCountElement.textContent = `Players: ${count}`;
    }
} 