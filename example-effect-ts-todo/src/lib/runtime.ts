import { ManagedRuntime } from 'effect';
import { TodoStorageLive } from './storage.js';

// ============================================================================
// ManagedRuntime — the Effect-to-Svelte bridge
// ============================================================================
//
// A ManagedRuntime is an Effect runtime pre-loaded with a specific set of
// Layers. Once created, you call runtime.runPromise(effect) to execute any
// Effect whose requirements are satisfied by those layers.
//
// For this app the only required layer is TodoStorageLive. In a larger app
// you would compose layers: Layer.merge(TodoStorageLive, AuthLive, ApiLive).
//
// ManagedRuntime vs Effect.runSync:
//   Effect.runSync works only for pure synchronous effects (no async, no
//   services). ManagedRuntime.runPromise works for everything and returns a
//   Promise the UI can await.
// ============================================================================

export const AppRuntime = ManagedRuntime.make(TodoStorageLive);
