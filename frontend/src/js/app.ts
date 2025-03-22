/**
 * Crate and Crypt - Application Entry Point
 * This file serves as the main entry point for Bun to import
 * without executing browser-specific code at module evaluation time.
 */

// Just re-export everything from main.ts
export * from '../main';

// When run directly via Bun, this file doesn't try to access browser APIs
