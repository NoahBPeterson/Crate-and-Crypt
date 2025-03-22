/**
 * Network connection module for WebSocket communication
 */

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
let connectionUrl: string = '';
let reconnectAttempts: number = 0;
const MAX_RECONNECT_ATTEMPTS: number = 5;
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
export function initNetwork(): void {
    console.log('Initializing network connection...');
    
    // Set the WebSocket URL based on environment
    // Safe check for process.env access that might not be available in all environments
    const isProduction = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
    
    // Use secure WebSocket (wss) in production, plain WebSocket (ws) in development
    const protocol = isProduction ? 'wss' : 'ws';
    const host = (typeof window !== 'undefined' && isProduction) ? window.location.host : 'localhost:8080';
    connectionUrl = `${protocol}://${host}/ws`;
    
    // For testing purposes, connect automatically
    connect().then(() => {
        console.log('Connected to WebSocket server automatically for testing');
        // For testing, automatically join a room
        sendMessage(MessageType.JOIN, {
            createRoom: true
        });
    }).catch(error => {
        console.error('Failed to connect to WebSocket server:', error);
    });
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
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
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
export function sendMessage(type: MessageType, payload: any = {}): boolean {
    if (!wsConnection || connectionStatus !== ConnectionStatus.CONNECTED) {
        console.error('Cannot send message: Not connected');
        return false;
    }
    
    const message: NetworkMessage = {
        type,
        payload,
        timestamp: Date.now()
    };
    
    try {
        wsConnection.send(JSON.stringify(message));
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
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
                if (message.payload.playerId) {
                    window.gameState.playerId = message.payload.playerId;
                    console.log('Server assigned player ID:', message.payload.playerId);
                }
                
                // Update room info
                if (message.payload.roomId) {
                    window.gameState.roomId = message.payload.roomId;
                    console.log('Joined room:', message.payload.roomId);
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
 * @returns Promise resolving with room ID
 */
export async function createRoom(): Promise<string> {
    // Connect if not already connected
    if (connectionStatus !== ConnectionStatus.CONNECTED) {
        await connect();
    }
    
    return new Promise((resolve, reject) => {
        // Register a one-time listener for the join response
        const joinHandler = (message: NetworkMessage) => {
            if (message.type === MessageType.JOIN && message.payload.roomId) {
                // Remove the one-time listener
                const index = eventListeners.message.indexOf(joinHandler);
                if (index !== -1) {
                    eventListeners.message.splice(index, 1);
                }
                
                // Resolve with the room ID
                resolve(message.payload.roomId);
            }
        };
        
        // Add the one-time listener
        on('message', joinHandler);
        
        // Send the create room request
        const success = sendMessage(MessageType.JOIN, { createRoom: true });
        
        if (!success) {
            reject(new Error('Failed to send create room request'));
        }
    });
}

/**
 * Join an existing game room
 * @param roomId Room ID to join
 * @returns Promise resolving when joined
 */
export async function joinRoom(roomId: string): Promise<void> {
    // Connect if not already connected
    if (connectionStatus !== ConnectionStatus.CONNECTED) {
        await connect(undefined, roomId);
    } else {
        // Already connected, just send join message
        sendMessage(MessageType.JOIN, { roomId });
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