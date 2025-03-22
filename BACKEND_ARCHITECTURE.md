# Crate and Crypt Backend Architecture

This document outlines the architecture for the Rust-powered backend server that will handle multiplayer functionality for Crate and Crypt.

## 1. Technology Stack

- **Language:** Rust (stable channel)
- **Web Framework:** Actix Web
- **WebSocket:** actix-web-actors
- **Serialization:** serde + serde_json
- **Async Runtime:** tokio
- **Game Physics:** rapier3d (for server-side physics validation)
- **Logging:** tracing + tracing-subscriber
- **Configuration:** config

## 2. System Architecture

### 2.1 High-Level Architecture

```
                   ┌─────────────────────┐
                   │   Client (Browser)  │
                   │  HTML/JS + WASM     │
                   └──────────┬──────────┘
                              │
                              │ WebSocket
                              │
┌─────────────────────────────▼────────────────────────────┐
│                                                          │
│                     Rust WebSocket Server                │
│                                                          │
│  ┌─────────────────┐    ┌─────────────────┐              │
│  │                 │    │                 │              │
│  │  Game Instance  │    │   Game State    │              │
│  │                 │    │                 │              │
│  └─────────┬───────┘    └────────┬────────┘              │
│            │                     │                       │
│  ┌─────────▼───────┐    ┌────────▼────────┐              │
│  │                 │    │                 │              │
│  │  Player Manager │    │  Physics Engine │              │
│  │                 │    │                 │              │
│  └─────────────────┘    └─────────────────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Component Overview

1. **WebSocket Server:** Handles client connections, message routing, and session management
2. **Game Instance:** Manages active game rooms and their lifecycle
3. **Game State:** Maintains authoritative game state and handles state transitions
4. **Player Manager:** Tracks player connections, state, and actions
5. **Physics Engine:** Validates physics interactions and maintains collision detection

## 3. Directory Structure

```
/backend
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── main.rs                # Application entry point
│   ├── config.rs              # Configuration management
│   ├── server.rs              # WebSocket server implementation
│   ├── game/
│   │   ├── mod.rs             # Module exports
│   │   ├── instance.rs        # Game instance management
│   │   ├── room.rs            # Game room implementation
│   │   ├── state.rs           # Game state tracking
│   │   ├── physics.rs         # Physics implementation
│   │   ├── player.rs          # Player state and management
│   │   ├── monsters/
│   │   │   ├── mod.rs         # Monster module exports
│   │   │   ├── base.rs        # Base monster trait definitions
│   │   │   ├── thumper.rs     # Thumper monster implementation
│   │   │   ├── spore_lizard.rs # Spore Lizard implementation
│   │   │   └── jester.rs      # Jester monster implementation
│   │   └── items.rs           # Item state and interaction
│   ├── network/
│   │   ├── mod.rs             # Module exports
│   │   ├── session.rs         # WebSocket session handling
│   │   ├── protocol.rs        # Message protocol definitions
│   │   ├── messages.rs        # Message type definitions
│   │   └── handlers.rs        # Message handlers
│   └── utils/
│       ├── mod.rs             # Module exports
│       ├── logging.rs         # Logging setup
│       └── time.rs            # Time utilities
└── tests/
    ├── integration_tests.rs   # Integration tests
    └── test_utils.rs          # Test utilities
```

## 4. Core Components

### 4.1 WebSocket Server

The WebSocket server is responsible for managing all client connections. Built on Actix Web's actor system, it handles:

- Connection establishment and termination
- Session management and tracking
- Message routing between clients and game instances
- Rate limiting and connection validation
- Secure WebSocket communication (WSS)

The server maintains a registry of active sessions and their associated game rooms, providing an entry point for all client communications.

### 4.2 Game Instance

Each game instance (room) is implemented as an actor in the Actix system, managing its own lifecycle including:

- Player joining and leaving
- Game setup and initialization
- Game tick updates at fixed intervals
- State synchronization to connected clients
- Game termination and cleanup

Game instances operate independently, allowing multiple games to run concurrently without interfering with each other.

### 4.3 Game State

The game state component is the authoritative source of truth for the game world, managing:

- Player positions, rotations, and states
- Item locations, properties, and ownership
- Monster positions, behaviors, and targets
- Environment configuration and hazards
- Mission state and objectives
- Game timing and events

All client actions are validated against this authoritative state before being accepted, ensuring fair gameplay and preventing cheating.

### 4.4 Network Protocol

The network protocol defines the message types and formats exchanged between client and server. It uses:

- JSON serialization for human-readable messages
- Type-tagged message format for easy routing
- Clear separation between client→server and server→client messages
- Efficient state representation to minimize bandwidth usage
- Optional binary format for performance-critical messages

The protocol is designed with extensibility in mind, allowing for future message types while maintaining backwards compatibility.

## 5. Key Subsystems

### 5.1 Physics System

The physics system uses Rapier3D to provide efficient physics simulation for the game world:

- Rigid body dynamics for movable objects
- Static colliders for environment boundaries
- Collision detection and resolution
- Server-side validation of client physics
- Simplified physics for performance optimization
- Spatial partitioning for efficient collision checking

While the client also runs physics simulation for responsive gameplay, the server's physics system is authoritative and prevents physics-based cheating.

### 5.2 Monster AI

The monster AI system controls the behavior of all non-player entities in the game:

- Trait-based architecture for different monster types
- State machines for behavior control
- Pathfinding for navigation through the environment
- Target selection and tracking
- Sensory systems (sight, hearing)
- Difficulty scaling based on player count and progress

Each monster type implements a common interface but has unique behaviors, creating varied gameplay experiences.

### 5.3 Procedural Environment Generation

The procedural generation system creates unique game environments for each mission:

- Modular room and corridor templates
- Algorithm for connecting spaces into coherent layouts
- Placement rules for items, monsters, and hazards
- Difficulty-appropriate generation parameters
- Seed-based generation for reproducible environments
- Validation to ensure playable spaces

The generation system balances randomness with designed elements to create environments that are both unique and engaging.

## 6. Performance Considerations

### 6.1 Optimization Strategies

#### State Synchronization

- Delta updates instead of full state
- Binary serialization for efficient network usage
- Proximity-based update frequency
- Update batching for efficient packet usage

#### Physics Optimization

- Simplified collision shapes
- Limited precision for distant entities
- Spatial partitioning for collision detection
- Sleeping rigid bodies when inactive

#### AI Computation

- Reduced update frequency for distant monsters
- Behavior simplification based on distance
- Batched AI updates across multiple game ticks
- Progressive complexity based on player proximity

### 6.2 Scalability Considerations

#### Horizontal Scaling

- Stateless server design for easy scaling
- Load balancer distribution of connections
- Room migration between server instances
- Shared nothing architecture

#### Resource Management

- Room hibernation for inactive sessions
- Graceful shutdown with state preservation
- Dynamic resource allocation based on player count
- Monitoring and adaptive scaling

### 6.3 WASM Integration Support

To support the frontend's WASM approach, the backend includes:

- Shared physics constants and configuration with the frontend
- Deterministic algorithm implementations that can be mirrored in WASM
- Optimized message formats compatible with WASM processing
- Common schema definitions for state objects

## 7. Security Considerations

### 7.1 Input Validation

- Server-side validation of all client messages
- Rate limiting for action frequency
- Physics validation for movement and interactions
- Anti-teleport and anti-speedhack checks

### 7.2 Anti-Cheat Measures

- Server-authoritative game state
- Consistency checks for player actions
- Timeout mechanisms for suspicious activity
- Server-side fog of war for information hiding

### 7.3 Connection Security

- TLS encryption for all WebSocket traffic
- Simple token-based authentication
- Protection against connection flooding
- Session management with invalidation

## 8. Implementation Plan

### Phase 1: Core Infrastructure
- Basic WebSocket server setup
- Session management
- Game room creation

### Phase 2: Game Mechanics
- Player movement and physics
- Item interaction
- Basic monster AI

### Phase 3: Full Gameplay
- Complete monster behaviors
- Environment generation
- Game loop and mission mechanics

### Phase 4: Optimization and Polish
- Network optimization
- Performance tuning
- Security hardening

## 9. Future Extensions

- Cross-server game session migration
- Persistent player statistics
- Advanced matchmaking
- Spectator mode
- Recording and replay systems
- WebRTC integration for voice chat

---

Document Version: 1.1  
Last Updated: March 22nd, 2025
