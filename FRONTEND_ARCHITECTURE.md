# Crate and Crypt Frontend Architecture

This document outlines the architecture for the plain TypeScript/Three.js-powered frontend for Crate and Crypt, a multiplayer horror roguelike game.

## 1. Technology Stack

### Core Technologies
- **TypeScript**: For game logic and UI
- **Three.js**: For 3D rendering and game visualization
- **HTML5/CSS3**: For UI structure and styling
- **WebSockets**: For real-time communication with the game server
- **WebAssembly**: For performance-critical components
- **Physics Engine:** @dimforge/rapier3d-wasm

### Development Tools
- **Vite**: For fast development and optimized builds
- **ESLint/Prettier**: For code style and quality
- **Jest**: For unit testing
- **TypeScript**: For type checking during development

## 2. System Architecture

The frontend architecture follows a modular design with clear separation between game logic, rendering, and UI concerns:

### Architectural Layers

1. **Presentation Layer**: HTML5 Canvas and DOM elements for UI
2. **Game Engine Layer**: Three.js and WASM modules for game rendering
3. **Application Layer**: Game logic and state management
4. **Communication Layer**: WebSocket client for server communication
5. **Core Services**: Shared utilities and cross-cutting concerns

## 3. Directory Structure

The project follows a feature-based directory structure:

```
src/
├── assets/         # Static assets (models, textures, sounds)
├── css/            # Stylesheet files
├── js/
│   ├── engine/     # Game engine components
│   ├── ui/         # UI-related TypeScript
│   ├── network/    # Network communication
│   ├── entities/   # Game entity definitions
│   ├── utils/      # Utility functions
│   └── wasm/       # WebAssembly modules and bindings
├── lib/            # Third-party libraries
├── wasm/           # WebAssembly source and build files
├── index.html      # Main HTML entry point
└── main.js         # Application entry point
```

## 4. Core Components

### 4.1 Game Engine Components

#### GameCanvas
The main component that handles the Three.js scene setup and rendering on an HTML canvas.

#### EntityManager
Manages game entities (players, monsters, items) and their lifecycle within the 3D scene.

#### Physics System
Handles collision detection and physics, potentially using WebAssembly for performance.

#### AudioManager
Controls spatial audio, sound effects, and ambient sounds based on game state.

#### InputController
Manages user input from keyboard, mouse, and gamepad.

### 4.2 UI Components

#### HUD
TypeScript modules that manipulate DOM elements to display player status and game information.

#### InventorySystem
HTML/CSS/JS implementation of the inventory interface.

#### DialogSystem
TypeScript-based system for displaying messages and notifications.

#### MainMenu
HTML-based game entry point with TypeScript event handlers.

#### Settings Panel
Configuration interface built with HTML/CSS and TypeScript.

## 5. State Management

### 5.1 State Architecture

Without React and Zustand, the application will use a custom state management approach:

#### GameState
A central TypeScript module managing core game state:
- Player information and status
- Game session data
- Mission information
- Game phase (lobby, active, results)

#### EntityManager
Tracks all entities in the game world using standard TypeScript patterns.

#### EventBus
A publish/subscribe system for communication between modules:
- Custom event dispatching
- Component communication
- State change notifications

## 6. Rendering Pipeline

### 6.1 Three.js Integration

The 3D rendering system uses vanilla Three.js:

1. **Canvas Setup**: Initializing the WebGL context and Three.js renderer
2. **Scene Management**: Loading and organizing 3D objects
3. **Asset Loading**: Loading models, textures, and materials
4. **Render Loop**: Maintaining a consistent frame rate
5. **Effects**: Post-processing and visual effects

### 6.2 WebAssembly Integration

Performance-critical components compiled to WebAssembly:

1. **Physics**: Collision detection and response
2. **Pathfinding**: Enemy AI movement calculations
3. **Procedural Generation**: Level generation algorithms
4. **Particle Systems**: High-performance particle effects

## 7. Networking

### 7.1 WebSocket Client

A plain TypeScript WebSocket implementation:
- Connection establishment and maintenance
- Message serialization and deserialization
- Game state synchronization
- Handling of network latency and disconnections

### 7.2 State Synchronization

- Client-side prediction for responsive movement
- Server reconciliation to correct prediction errors
- Entity interpolation for smooth movement
- Binary message formats for efficient data transfer

## 8. Performance Considerations

### 8.1 WebAssembly Compilation Strategy

To compile performance-critical parts to WebAssembly:

1. **Mixed Approach**:
   - Keep Three.js and UI in TypeScript
   - Write performance-critical code in Rust or C++
   - Compile to WASM with Emscripten (C++) or wasm-pack (Rust)
   - Create TypeScript bindings to interact with WASM modules

2. **Key Components for WASM**:
   - Physics engine
   - Collision detection
   - Pathfinding algorithms
   - Math-heavy calculations
   - Procedural generation

3. **Implementation Options**:
   - **Rust + wasm-bindgen**: For new code, using Rust's strong type system
   - **AssemblyScript**: TypeScript-like syntax that compiles to WASM
   - **Emscripten**: For C/C++ code or existing libraries

4. **Integration Strategy**:
   - TypeScript modules import and initialize WASM modules
   - WASM exports functions called from TypeScript
   - Shared memory for high-performance data transfer
   - TypeScript definitions for type safety

### 8.2 Optimization Techniques

- Asset preloading and caching
- Instanced rendering for similar objects
- Texture atlasing for reduced draw calls
- Level-of-detail management
- WebWorkers for multi-threading
- Memory management for textures and geometry

### 8.3 Target Performance

- 60+ FPS on desktop
- 30+ FPS on high-end mobile devices
- Adaptive quality settings
- Progressive loading for slower connections

## 9. Accessibility

- Configurable controls
- High-contrast UI mode
- Screen reader support for menus
- Closed captions for audio cues
- Configurable visual effects

## 10. Implementation Plan

### Phase 1: Core Framework
- Set up HTML/JS/CSS project structure
- Implement Three.js rendering pipeline
- Create basic UI components
- Establish WebSocket communication

### Phase 2: WebAssembly Integration
- Create initial WASM modules for physics
- Develop TypeScript bindings
- Benchmark and optimize performance
- Integrate with main rendering loop

### Phase 3: Game Systems
- Implement entity management
- Add player movement and interaction
- Create inventory and item systems
- Develop basic monster AI visualization

### Phase 4: Polish and Optimization
- Add visual effects
- Implement audio systems
- Optimize for performance
- Refine UI and user experience

## 11. Future Extensions

- Further WASM optimization
- Mobile-specific UI adaptations
- WebXR support for VR
- Localization
- Spectator mode

---

Document Version: 1.1  
Last Updated: [Current Date] 