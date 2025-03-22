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
        let room_id = Uuid::new_v4().to_string();
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
}

/// WebSocket connection handler
struct GameSession {
    /// Unique session id
    id: String,
    /// Client must send ping at least once per 10 seconds (CLIENT_TIMEOUT)
    hb: Instant,
    /// Time of last game state update
    last_update: Instant,
}

/// Default implementation for GameSession
impl Default for GameSession {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            hb: Instant::now(),
            last_update: Instant::now(),
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
                
                // This will be expanded to properly handle room joining
                let response = GameMessage::Join { 
                    player_id: Some(self.id.clone()),
                    room_id: room_id.or_else(|| Some("test-room".to_string())), 
                    create_room: None 
                };
                
                if let Ok(json) = serde_json::to_string(&response) {
                    ctx.text(json);
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
    
    println!("New WebSocket connection: player_id={}", player_id);
    
    // Handle WebSocket connection
    let resp = ws::start(
        GameSession {
            id: player_id,
            hb: Instant::now(),
            last_update: Instant::now(),
        },
        &req,
        stream,
    );
    
    resp
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
