# Crate and Crypt Project Plan

## 1. Project Overview

**Working Title:** Crate and Crypt

**Game Concept:** A cooperative survival-horror looter game inspired by Lethal Company and R.E.P.O., where players explore derelict facilities to gather valuable salvage while avoiding monsters and hazards.

**Technical Approach:**
- Frontend: JavaScript/TypeScript with Three.js
- Backend: Rust WebSocket server for high performance multiplayer
- Deployment: Browser-based with instant access, no sign-up required

## 2. Implementation Roadmap

### Phase 1: Technical Foundation (Days 1-3)

#### Day 1
- [x] Initialize project repository
- [x] Setup basic project structure
- [x] Configure Bun for frontend development
- [x] Create initial Three.js scene
- [x] Begin Rust server implementation with WebSocket support

#### Day 2
- [x] Implement basic room/lobby management in Rust backend
- [x] Create player session handling
- [x] Setup WebSocket communication between client and server
- [x] Develop message protocol for game state synchronization
- [x] Implement basic player connection/disconnection handling

#### Day 3
- [x] Complete initial client-server communication
- [x] Test multiple connections
- [x] Refine connection stability
- [x] Add error handling for network operations
- [x] Create initial player representation

### Phase 2: Minimal Playable Experience (Days 4-7)

#### Day 4
- [x] Implement first-person camera and controls
- [x] Create basic movement mechanics (WASD + mouse look)
- [ ] Add player collision with environment
- [x] Synchronize player movements across the network
- [x] Test movement with multiple clients

#### Day 5
- [x] Create a simple test environment
- [x] Implement basic lighting system
- [ ] Add environment collision detection
- [ ] Create simple object/prop placement
- [x] Design initial UI elements

#### Day 6-7
- [x] Implement player character rendering
- [x] Add player name display
- [x] Create lobby UI for game creation/joining
- [x] Implement session management UI
- [x] Test and optimize multiplayer experience

### Phase 3: Core Gameplay Loop (Days 8-14)

#### Days 8-9
- [ ] Implement physics-based item interactions
- [ ] Create drag/pickup mechanics
- [ ] Add item collision physics
- [ ] Synchronize item states across the network
- [ ] Test item interactions with multiple players

#### Days 10-11
- [ ] Implement mission timer/day-night cycle
- [ ] Create extraction zone mechanics
- [ ] Add mission success/failure conditions
- [ ] Implement profit calculation system
- [ ] Create basic UI for game state display

#### Days 12-14
- [ ] Implement basic enemy AI (first monster type)
- [ ] Create pathfinding system
- [ ] Add enemy attack mechanics
- [ ] Synchronize enemy positions across network
- [ ] Test enemy interactions with players and environment

### Phase 4: Environment & Content (Days 15-21)

#### Days 15-17
- [ ] Design modular environment pieces
- [ ] Implement basic procedural generation
- [ ] Create algorithm for room connections
- [ ] Add random item placement
- [ ] Implement spawn point placement logic

#### Days 18-19
- [ ] Add 2-3 additional monster types
- [ ] Implement unique behaviors for each monster
- [ ] Create monster spawning system
- [ ] Add difficulty scaling
- [ ] Implement sound effects for monsters

#### Days 20-21
- [ ] Add environmental hazards (fog, lighting changes)
- [ ] Implement triggered events
- [ ] Create danger zones
- [ ] Synchronize hazard states across network
- [ ] Test and balance hazard difficulty

### Phase 5: Polish & Deployment (Days 22-25)

#### Days 22-23
- [ ] Implement ambient sound system
- [ ] Add positional audio for monsters and hazards
- [ ] Create interaction sound effects
- [ ] Implement text chat with proximity features
- [ ] Add simple emote system

#### Days 24-25
- [ ] Optimize client rendering performance
- [ ] Reduce network payload size
- [ ] Implement asset loading optimizations
- [ ] Setup production server infrastructure
- [ ] Deploy and test on target domain

## 3. Technical Architecture

### Backend Architecture (Rust)

```
src/
├── main.rs                 # Application entry point
├── server.rs               # WebSocket server implementation
├── game/
│   ├── room.rs             # Game room/session management
│   ├── player.rs           # Player state handling
│   ├── state.rs            # Game state management
│   ├── physics.rs          # Server-side physics validation
│   ├── monsters/
│   │   ├── mod.rs          # Monster module exports
│   │   ├── base.rs         # Base monster traits
│   │   ├── thumper.rs      # Thumper monster implementation
│   │   ├── spore_lizard.rs # Spore Lizard monster implementation
│   │   └── jester.rs       # Jester monster implementation
│   └── items.rs            # Item state and interactions
└── network/
    ├── protocol.rs         # Message protocol definitions
    ├── sync.rs             # State synchronization
    └── handlers.rs         # Message handlers
```

### Frontend Architecture (JavaScript/Three.js)

```
src/
├── index.html              # Entry HTML
├── main.js                 # Application entry point
├── assets/                 # Game assets (models, textures, sounds)
├── network/
│   ├── connection.js       # WebSocket client
│   └── sync.js             # State synchronization
├── game/
│   ├── player.js           # Player controls and rendering
│   ├── items.js            # Item interactions and physics
│   ├── monsters.js         # Monster rendering and animations
│   ├── environment.js      # Level rendering and effects
│   └── physics.js          # Physics implementation
├── ui/
│   ├── hud.js              # In-game HUD
│   ├── lobby.js            # Lobby and session management
│   └── menus.js            # Game menus
└── utils/
    ├── audio.js            # Audio management
    ├── input.js            # Input handling
    └── loader.js           # Asset loading and management
```

## 4. Feature Details

### 4.1 Multiplayer System

- **WebSocket Communication:** Real-time bidirectional communication
- **State Synchronization:** Optimized network updates (10-20 Hz)
- **Room Management:** Lobby system for game creation and joining
- **Session Handling:** Player connection, disconnection, and reconnection
- **Authority Model:** Server authoritative with client prediction

### 4.2 Game Mechanics

- **Player Movement:** First-person WASD + mouse look
- **Physics Interaction:** Drag, carry, and throw items
- **Item Values:** Different tiers of salvage with varying values
- **Mission Structure:** Time-limited extraction missions
- **Profit System:** Track item values and quota fulfillment

### 4.3 Enemy AI

- **Thumper:** Fast movement, triggered by player noise
- **Spore Lizard:** Slow but relentless, leaves hazardous trails
- **Hoarding Bug:** Steals unattended items
- **Jester:** Initially harmless, becomes dangerous when observed
- **AI Behaviors:** Pathfinding, player detection, attack patterns

### 4.4 Environmental Systems

- **Procedural Generation:** Randomized facility layouts
- **Hazards:** Fog, electrical storms, flooding
- **Day-Night Cycle:** Time pressure and visibility changes
- **Environmental Props:** Interactive objects and obstacles

## 5. Asset Requirements

### 5.1 3D Models
- Player character
- Monster types (4-5 variations)
- Environment modules (rooms, corridors, props)
- Salvageable items (10-15 variations)
- Extraction point elements

### 5.2 Textures
- Environment textures (walls, floors, ceilings)
- Item textures
- Character and monster textures
- Effect textures (fog, electrical, etc.)

### 5.3 Audio
- Ambient background sounds
- Monster sounds (movement, attack, idle)
- Player movement and interaction sounds
- Item handling sounds
- Environmental hazard sounds

## 6. Target Milestones

### Milestone 1: Technical Prototype (Day 7)
[x] Players can connect to a shared environment and move around

### Milestone 2: Gameplay Prototype (Day 14)
Core gameplay loop implemented with one monster type and basic item interactions

### Milestone 3: Content Complete (Day 21)
All planned monsters, hazards, and environment types implemented

### Milestone 4: Release Candidate (Day 25)
Polished experience with optimized performance ready for deployment

## 7. Risks and Mitigation

### Technical Risks
- **WebSocket Performance:** Implement compression and optimize message frequency
- **Physics Sync Issues:** Use server validation with client prediction
- **Loading Times:** Optimize asset loading and implement progressive enhancement

### Gameplay Risks
- **Difficulty Balance:** Regular playtesting and adaptive difficulty
- **Player Engagement:** Focus on core tension and cooperation mechanics
- **Technical Limitations:** Graceful degradation for lower-end devices

## 8. Post-Release Considerations

- Performance monitoring and optimization
- Community feedback collection
- Potential feature expansions:
  - Additional monsters and hazards
  - New environment types
  - Advanced progression systems
  - Voice chat implementation

---

**Version:** 1.1  
**Last Updated:** May 9, 2024
**Author:** Crate and Crypt Team 