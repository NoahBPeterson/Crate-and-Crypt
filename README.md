# Crate and Crypt

A multiplayer browser-based dungeon crawler game with WebSocket-powered real-time gameplay.

## Project Structure

- `/frontend` - TypeScript-based frontend with Three.js
- `/backend` - Rust backend server with Actix for WebSocket communication

## Getting Started

### Frontend

```bash
cd frontend
bun install
bun run dev
```

### Backend

```bash
cd backend
cargo run
```

## Features

- Real-time multiplayer gameplay
- 3D graphics with Three.js
- WebSocket communication for low-latency gameplay
- Responsive UI for desktop and mobile

## Development

The project uses TypeScript for the frontend and Rust for the backend. The communication protocol is built on WebSockets to provide real-time gameplay. 