# Crate and Crypt Network Protocol

This document defines the WebSocket message protocol for communication between the Crate and Crypt client and server.

## 1. Protocol Overview

The Crate and Crypt network protocol uses JSON messages over WebSockets with a standard message structure consisting of a `type` field identifying the message type and a `data` field containing the payload specific to that message type.

The protocol is designed with the following principles:
- Clear message categorization by type
- Consistent structure across message types
- Extensibility for future features
- Efficient representation of game state
- Binary format options for performance-critical data

## 2. Connection Lifecycle

### 2.1 Connection Establishment

1. Client connects to WebSocket endpoint (`wss://server.domain/game`)
2. Server accepts connection
3. Client sends `join` message
4. Server responds with `welcome` message

### 2.2 Connection Termination

1. Client sends `leave` message (optional)
2. WebSocket connection is closed
3. Server cleans up player resources

## 3. Client → Server Messages

### 3.1 Session Management

Client-to-server session management messages include:

#### Join Game
Request to join a game session, providing player name and optional room ID.

#### Leave Game
Request to leave the current game session.

#### Ready
Player indicates they are ready to start the game.

### 3.2 Player Actions

Client-to-server player action messages include:

#### Move
Update player movement direction, rotation, and include a timestamp for synchronization.

#### Interact
Interact with an object or environment element, specifying target ID and interaction type.

#### Pickup Item
Pick up an item by ID.

#### Drop Item
Drop a held item, specifying ID and optional force vector.

#### Chat
Send a chat message with scope (team, proximity, or all).

## 4. Server → Client Messages

### 4.1 Session Management

Server-to-client session management messages include:

#### Welcome
Sent when player successfully joins a game, including player ID, room ID, and game settings.

#### Room Update
Updates on room status including player list, room state, and mission information.

#### Game Start
Notification that the game is starting, with countdown and mission info.

#### Game End
Notification that the game has ended, including reason, success status, and player statistics.

### 4.2 Game State Updates

Server-to-client game state update messages include:

#### State Update
Regular update of game state including player positions, items, and monsters.

#### Player Joined
Notification that a new player has joined.

#### Player Left
Notification that a player has left.

#### Environment Update
Updates about the environment and hazards.

### 4.3 Event Notifications

Server-to-client event notification messages include:

#### Game Event
Notification of significant game events such as monster appearances, item breaks, or player deaths.

#### Chat Message
Received chat message from another player.

#### Error
Error notification with code, message, and context.

## 5. Data Structures

### 5.1 Common Types

The protocol uses several standard data structures:

#### Vector3
Represents a 3D position or direction with x, y, z components.

#### Vector2
Represents a 2D value (often used for rotation) with x, y components.

#### Quaternion
Represents 3D rotation with x, y, z, w components.

#### UUID
String representation of a UUID used for entity IDs.

## 6. Protocol Formats

### 6.1 JSON Protocol

The default protocol format uses JSON for human readability and easy debugging:

```json
{
  "type": "message_type",
  "data": {
    // Message-specific payload
  }
}
```

### 6.2 Binary Protocol

For performance-critical messages, a binary protocol option is available:

- Uses MessagePack or a custom binary format
- Compact representation of common data types
- Reduced parsing overhead
- Optimized for WebAssembly processing
- Type identifiers as single bytes
- Fixed schema for common message types

The binary protocol is especially useful for high-frequency updates like player positions and physics states.

## 7. Message Frequency

To optimize network usage, different types of messages are sent at different frequencies:

- Player position updates: 10-20 Hz
- Monster updates: 5-10 Hz
- Item physics updates: 5-10 Hz
- Environment updates: As needed, typically 1-2 Hz
- Game events: As they occur

## 8. Bandwidth Optimization

For production, several optimization strategies should be considered:

### 8.1 Delta Compression
- Only send values that have changed
- Use relative values where possible
- Maintain baseline state for reference

### 8.2 Quantization
- Reduce float precision where appropriate
- Use fixed-point numbers for positions
- Compress quaternions using smallest-three technique

### 8.3 Binary Protocol
- Use binary format for high-frequency updates
- Implement custom binary format for WebAssembly compatibility
- Specialized encoders/decoders in both JavaScript and WASM

### 8.4 Mixed Protocol Approach
- JSON for infrequent/complex messages
- Binary for frequent/simple messages
- Protocol negotiation during connection

## 9. Error Handling

### 9.1 Error Codes

Standard error codes include:

| Code        | Description                        | Action                                    |
|-------------|------------------------------------|-------------------------------------------|
| `auth_fail` | Authentication failure             | Reconnect with valid credentials          |
| `room_full` | Room is at capacity               | Try another room                          |
| `rate_limit`| Message rate limit exceeded       | Reduce message frequency                  |
| `invalid_msg`| Malformed message                | Check client message format               |
| `server_err`| Server-side error                 | Retry or report issue                     |

### 9.2 Reconnection Strategy

1. Attempt immediate reconnection
2. If failed, use exponential backoff (starting at 1s, max 30s)
3. After 5 failed attempts, prompt user for manual reconnection

## 10. WASM Considerations

When working with WebAssembly on the client:

### 10.1 Memory Management
- Use shared memory between JS and WASM where possible
- Avoid unnecessary copying between JS and WASM
- Pre-allocate buffers for frequent message types

### 10.2 Binary Parsing
- Implement efficient binary parsing in WASM
- Use typed arrays for direct memory access
- Consider SIMD instructions for batch processing

### 10.3 Protocol Versioning
- Include protocol version in handshake
- Support backward compatibility
- Allow negotiation of optimal format

## 11. Future Extensions

- WebRTC for voice chat integration
- Improved binary protocol with better compression
- Server-side replay capabilities
- Spectator mode support
- Partial updates for large state objects

---

Document Version: 1.1  
Last Updated: March 22nd, 2025
