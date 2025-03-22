use actix::{Actor, StreamHandler, AsyncContext, ActorContext};
use actix_web::{web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;
use log::{info, warn, error};
use std::time::{Duration, Instant};
use uuid::Uuid;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use serde_json;
use chrono;
use rand::Rng;

// Constants
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

// Message types for WebSocket communication
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type", content = "payload")]
enum GameMessage {
    Join { player_id: Option<String>, room_id: Option<String>, create_room: Option<bool> },
    Leave { player_id: String },
    Chat { player_id: String, text: String },
    PlayerUpdate { player_id: String, position: Position, action: Option<String> },
    WorldUpdate { entities: Vec<Entity> },
    Error { message: String },
    Ping { time: u64 },
    Pong { time: u64 },
}

// Position type for player and entity coordinates
#[derive(Serialize, Deserialize, Debug, Clone)]
struct Position {
    x: f32,
    y: f32,
    z: f32,
    rotation: Option<f32>,
}

// Entity type for world objects
#[derive(Serialize, Deserialize, Debug, Clone)]
struct Entity {
    id: String,
    entity_type: String,
    position: Position,
    state: Option<String>,
}

// Room to track connected players
struct GameRoom {
    id: String,
    players: Vec<String>,
    created_at: Instant,
    last_activity: Instant,
}

// Session storage
struct SessionState {
    rooms: HashMap<String, GameRoom>,
    player_to_room: HashMap<String, String>,
}

impl SessionState {
    fn new() -> Self {
        SessionState {
            rooms: HashMap::new(),
            player_to_room: HashMap::new(),
        }
    }
    
    fn create_room(&mut self) -> String {
        // Generate a shorter room ID (4-digit number) instead of UUID
        let room_id = format!("{:04}", rand::thread_rng().gen_range(1000..10000));
        
        // Ensure the room ID doesn't already exist
        if self.rooms.contains_key(&room_id) {
            // If collision, try again with a different ID
            return self.create_room();
        }
        
        let room = GameRoom {
            id: room_id.clone(),
            players: Vec::new(),
            created_at: Instant::now(),
            last_activity: Instant::now(),
        };
        
        self.rooms.insert(room_id.clone(), room);
        println!("Created new room: {}", room_id);
        room_id
    }
    
    fn join_room(&mut self, room_id: &str, player_id: &str) -> bool {
        if let Some(room) = self.rooms.get_mut(room_id) {
            if !room.players.contains(&player_id.to_string()) {
                room.players.push(player_id.to_string());
                room.last_activity = Instant::now();
                self.player_to_room.insert(player_id.to_string(), room_id.to_string());
                
                println!("Player {} joined room {} (Total players: {})", 
                         player_id, room_id, room.players.len());
                return true;
            }
        }
        false
    }
    
    fn leave_room(&mut self, player_id: &str) {
        if let Some(room_id) = self.player_to_room.remove(player_id) {
            if let Some(room) = self.rooms.get_mut(&room_id) {
                room.players.retain(|id| id != player_id);
                room.last_activity = Instant::now();
                
                println!("Player {} left room {} (Players remaining: {})", 
                         player_id, room_id, room.players.len());
                
                // Remove room if empty
                if room.players.is_empty() {
                    println!("Room {} is now empty, will be removed", room_id);
                }
            }
        }
    }
    
    fn get_player_room(&self, player_id: &str) -> Option<String> {
        self.player_to_room.get(player_id).cloned()
    }
}

// Shared state for the application
struct AppState {
    sessions: actix_web::web::Data<std::sync::Mutex<SessionState>>,
    connections: std::sync::Mutex<HashMap<String, actix::Addr<GameSession>>>,
}

/// WebSocket connection handler
struct GameSession {
    /// Unique session id
    id: String,
    /// Client must send ping at least once per 10 seconds (CLIENT_TIMEOUT)
    hb: Instant,
    /// Time of last game state update
    last_update: Instant,
    /// Reference to app state
    app_state: web::Data<AppState>,
}

/// Default implementation for GameSession
impl Default for GameSession {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            hb: Instant::now(),
            last_update: Instant::now(),
            app_state: web::Data::new(AppState {
                sessions: actix_web::web::Data::new(std::sync::Mutex::new(SessionState::new())),
                connections: std::sync::Mutex::new(HashMap::new()),
            }),
        }
    }
}

/// Actor implementation for GameSession
impl Actor for GameSession {
    type Context = ws::WebsocketContext<Self>;

    /// Start the heartbeat process when the session starts
    fn started(&mut self, ctx: &mut Self::Context) {
        println!("WebSocket connection established for player: {}", self.id);
        // Start the heartbeat process
        self.heartbeat(ctx);
    }
    
    fn stopped(&mut self, _ctx: &mut Self::Context) {
        println!("WebSocket connection closed for player: {}", self.id);
        // Handle cleanup on disconnect - we'll add session management later
    }
}

/// Handler for WebSocket messages
impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for GameSession {
    /// Handle incoming WebSocket messages
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                println!("Ping received from player: {}", self.id);
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                println!("Pong received from player: {}", self.id);
                self.hb = Instant::now();
            }
            Ok(ws::Message::Text(text)) => {
                println!("Text message received from player {}: {}", self.id, text);
                
                // Parse the message as JSON
                match serde_json::from_str::<GameMessage>(&text) {
                    Ok(message) => {
                        self.handle_game_message(message, ctx);
                    }
                    Err(err) => {
                        println!("Error parsing message from player {}: {}", self.id, err);
                        // Send error back to client
                        let error_msg = GameMessage::Error { 
                            message: format!("Invalid message format: {}", err) 
                        };
                        if let Ok(json) = serde_json::to_string(&error_msg) {
                            ctx.text(json);
                        }
                    }
                }
            }
            Ok(ws::Message::Binary(bin)) => {
                println!("Binary message received from player: {}", self.id);
                ctx.binary(bin);
            }
            Ok(ws::Message::Close(reason)) => {
                println!("Close message received from player: {}", self.id);
                ctx.close(reason);
                ctx.stop();
            }
            _ => {}
        }
    }
}

impl GameSession {
    /// Handle a game-specific message
    fn handle_game_message(&self, message: GameMessage, ctx: &mut ws::WebsocketContext<Self>) {
        match message {
            GameMessage::Join { player_id, room_id, create_room } => {
                println!("Join request from player {} (create_room: {:?}, room_id: {:?})",
                         self.id, create_room, room_id);
                
                // Get session state
                let mut session_state = self.app_state.sessions.lock().unwrap();
                
                // Create or join room
                let final_room_id = if create_room.unwrap_or(false) {
                    // Create a new room
                    let new_room_id = session_state.create_room();
                    
                    // Join the new room
                    session_state.join_room(&new_room_id, &self.id);
                    
                    println!("Created new room for player {}: {}", self.id, new_room_id);
                    new_room_id
                } else if let Some(requested_room_id) = room_id.clone() {
                    // Try to join existing room by ID
                    if session_state.join_room(&requested_room_id, &self.id) {
                        println!("Player {} joined existing room: {}", self.id, requested_room_id);
                        requested_room_id
                    } else {
                        // Room doesn't exist, create a new one
                        println!("Room {} not found, creating new room for player {}", requested_room_id, self.id);
                        let new_room_id = session_state.create_room();
                        session_state.join_room(&new_room_id, &self.id);
                        new_room_id
                    }
                } else {
                    // No room specified, use default behavior - create a new room
                    let new_room_id = session_state.create_room();
                    session_state.join_room(&new_room_id, &self.id);
                    println!("No room specified, created new room for player {}: {}", self.id, new_room_id);
                    new_room_id
                };
                
                // Send join response with room ID
                let response = GameMessage::Join { 
                    player_id: Some(self.id.clone()),
                    room_id: Some(final_room_id.clone()), 
                    create_room: None 
                };
                
                // Convert response to string
                if let Ok(json) = serde_json::to_string(&response) {
                    // Parse back to Value to add the player count
                    if let Ok(mut json_value) = serde_json::from_str::<serde_json::Value>(&json) {
                        // Get the player count for the room
                        let player_count = match session_state.rooms.get(&final_room_id) {
                            Some(room) => room.players.len(),
                            None => 1, // Fallback to 1 if room data is missing
                        };
                        
                        // Add player count to payload
                        if let Some(payload) = json_value.get_mut("payload") {
                            if let Some(obj) = payload.as_object_mut() {
                                obj.insert("players_count".to_string(), serde_json::json!(player_count));
                            }
                        }
                        
                        // Send the modified response
                        ctx.text(json_value.to_string());
                    } else {
                        // Fallback to original response
                        ctx.text(json);
                    }
                }
            }
            GameMessage::Leave { player_id } => {
                println!("Leave request from player {}", player_id);
            }
            GameMessage::Chat { ref player_id, ref text } => {
                println!("Chat message from player {}: {}", player_id, text);
                // Echo chat message back
                if let Ok(json) = serde_json::to_string(&message) {
                    ctx.text(json);
                }
            }
            GameMessage::Ping { time } => {
                println!("Game ping from player {}: {}", self.id, time);
                let pong = GameMessage::Pong { time };
                if let Ok(json) = serde_json::to_string(&pong) {
                    ctx.text(json);
                }
            }
            GameMessage::PlayerUpdate { player_id, position, action } => {
                // Get the room for this player
                let room_id = {
                    let session_state = self.app_state.sessions.lock().unwrap();
                    session_state.get_player_room(&self.id).clone()
                };
                
                if let Some(room_id) = room_id {
                    println!("Received PlayerUpdate from {} in room {}: {:?}", 
                        self.id, room_id, position);
                    
                    // Create a new player update message with the correct player ID
                    let update_msg = GameMessage::PlayerUpdate {
                        player_id: self.id.clone(),
                        position,
                        action,
                    };
                    
                    // Broadcast to all players in the room except self
                    self.broadcast_to_room(&room_id, &update_msg);
                } else {
                    println!("Warning: Player {} sent position update but is not in any room", self.id);
                }
            }
            _ => {
                println!("Unhandled game message type from player {}: {:?}", self.id, message);
            }
        }
    }

    /// Send a ping message to keep the connection alive
    fn heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                println!("Client timeout for player {}, disconnecting!", act.id);
                ctx.stop();
                return;
            }
            
            ctx.ping(b"");
        });
    }

    /// Broadcast a message to all players in a room except the sender
    fn broadcast_to_room(&self, room_id: &str, message: &GameMessage) {
        if let Ok(json) = serde_json::to_string(message) {
            // Get session state
            let session_state = self.app_state.sessions.lock().unwrap();
            
            // Get room players
            if let Some(room) = session_state.rooms.get(room_id) {
                // Get connections
                let connections = self.app_state.connections.lock().unwrap();
                
                // Send to all players in room except self
                for player_id in &room.players {
                    if player_id != &self.id {
                        if let Some(addr) = connections.get(player_id) {
                            let _ = addr.do_send(SendMessage(json.clone()));
                        }
                    }
                }
            }
        }
    }
}

// Message type for sending WebSocket text messages
struct SendMessage(String);

impl actix::Message for SendMessage {
    type Result = ();
}

impl actix::Handler<SendMessage> for GameSession {
    type Result = ();

    fn handle(&mut self, msg: SendMessage, ctx: &mut Self::Context) -> Self::Result {
        println!("Forwarding message to player {}", self.id);
        // Forward the message to the WebSocket
        ctx.text(msg.0);
    }
}

/// WebSocket route handler
async fn ws_route(
    req: HttpRequest,
    stream: web::Payload,
    app_state: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    let query = req.query_string();
    let mut player_id = None;
    let mut room_id = None;
    
    // Parse query parameters
    for pair in query.split('&') {
        let mut split = pair.split('=');
        if let (Some(key), Some(value)) = (split.next(), split.next()) {
            if key == "playerId" {
                player_id = Some(value.to_string());
            } else if key == "roomId" {
                room_id = Some(value.to_string());
            }
        }
    }

    // Generate player ID if not provided
    let player_id = player_id.unwrap_or_else(|| Uuid::new_v4().to_string());
    
    println!("New WebSocket connection: player_id={}, room_id={:?}", player_id, room_id);
    
    // Create session
    let session = GameSession {
        id: player_id.clone(),
        hb: Instant::now(),
        last_update: Instant::now(),
        app_state: app_state.clone(),
    };
    
    // Start WebSocket session
    let (addr, resp) = ws::start_with_addr(session, &req, stream)?;
    
    // Store connection
    {
        let mut connections = app_state.connections.lock().unwrap();
        connections.insert(player_id.clone(), addr);
        println!("Stored connection for player {}, total connections: {}", player_id, connections.len());
    }
    
    Ok(resp)
}

/// Health check route
async fn health_check() -> impl actix_web::Responder {
    println!("Health check requested");
    web::Json(serde_json::json!({
        "status": "ok",
        "server_time": chrono::Utc::now().to_rfc3339(),
    }))
}

/// Main function
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "info");
    env_logger::init();
    
    println!("Starting Crate and Crypt game server on port 8080...");
    
    // Create and share the session state
    let session_state = web::Data::new(std::sync::Mutex::new(SessionState::new()));
    let app_state = web::Data::new(AppState {
        sessions: session_state.clone(),
        connections: std::sync::Mutex::new(HashMap::new()),
    });
    
    // Start the server
    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/health", web::get().to(health_check))
            .route("/ws", web::get().to(ws_route))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
