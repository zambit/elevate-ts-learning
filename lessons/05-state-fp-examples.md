# Lesson 5: State Monads in Practice - Undo/Redo and Beyond

## What We Built

We implemented a full **undo/redo system** for the todo app using functional programming principles. This wasn't a simple "keep track of versions" approach—we built it using the **State monad pattern**, which gives us powerful guarantees about how state changes work.

### The Core Implementation

The key insight: instead of mutating state in place, every operation returns a tuple: `[result, newState]`.

```typescript
// Basic operation - mutates nothing
export const addTodo = (title: string): State<Todos, Todo> =>
  State((todos) => {
    const newTodo = { id: nextId, title, done: false }
    return [newTodo, [...todos, newTodo]]  // [what caller gets, new state]
  })

// With history tracking
export const addWithHistory = (title: string): State<AppState, Todo> =>
  State((state) => {
    const [newTodo, newTodos] = addTodo(title).run(state.todos)
    return [
      newTodo,
      {
        ...state,
        todos: newTodos,
        history: [...state.history, state.todos],  // Save old state
        future: []                                   // Clear redo chain
      }
    ]
  })

// Undo pops from history, pushes to future
export const undo = (): State<AppState, void> =>
  State((state) => {
    if (state.history.length === 0) return [undefined, state]
    
    const previousTodos = state.history[state.history.length - 1]
    const newHistory = state.history.slice(0, -1)
    const newFuture = [...state.future, state.todos]  // Save current state
    
    return [undefined, {
      todos: previousTodos,
      filter: state.filter,
      history: newHistory,
      future: newFuture
    }]
  })

// Redo pops from future, pushes to history
export const redo = (): State<AppState, void> =>
  State((state) => {
    if (state.future.length === 0) return [undefined, state]
    
    const redoTodos = state.future[state.future.length - 1]
    const newFuture = state.future.slice(0, -1)
    const newHistory = [...state.history, state.todos]  // Save current state
    
    return [undefined, {
      todos: redoTodos,
      filter: state.filter,
      history: newHistory,
      future: newFuture
    }]
  })
```

## Why This Approach?

### 1. **Immutability**

No mutation means no surprises. Every operation is traceable:

```typescript
// ❌ What NOT to do
function addTodoImperative(todos, title) {
  const newTodo = { id: getNextId(todos), title, done: false }
  todos.push(newTodo)  // MUTATED!
  return newTodo
}

// ✅ What we do
const [newTodo, todos] = addTodo(title).run(oldTodos)
// oldTodos is NEVER changed
```

### 2. **Composability**

Small operations compose into bigger ones naturally:

```typescript
// Build complex operations from simpler ones
export const addWithHistory = (title: string) => State((state) => {
  const [newTodo, newTodos] = addTodo(title).run(state.todos)  // Reuse addTodo
  return [newTodo, { ...state, todos: newTodos, history: [...state.history, state.todos] }]
})

// Now addWithHistory itself can be composed further
```

### 3. **Testability**

Pure functions are trivial to test:

```typescript
it('undo restores previous state', () => {
  const state1 = addWithHistory('First').run(initialState)[1]
  const state2 = addWithHistory('Second').run(state1)[1]
  const state3 = undo().run(state2)[1]
  
  expect(state3.todos).toEqual(state1.todos)
  expect(state3.future).toHaveLength(1)  // Can redo
})

// No mocks, no setup, no side effects to manage
```

### 4. **Time Travel**

Because we save old states, we can jump to any point:

```typescript
// After 5 operations:
let state = initialState
state = addWithHistory('Task 1').run(state)[1]
state = addWithHistory('Task 2').run(state)[1]
state = toggleWithHistory(1).run(state)[1]
state = addWithHistory('Task 3').run(state)[1]
state = removeWithHistory(2).run(state)[1]

// Jump back 3 steps
state.history.length  // 5
let jumpedState = state
for (let i = 0; i < 3; i++) {
  jumpedState = undo().run(jumpedState)[1]
}

// Or directly access a past state:
const stateAfterSecondOperation = state.history[1]
```

## How This Generalizes

The State monad pattern isn't just for undo/redo. It's a general solution for **managing state transitions** in a predictable, functional way.

### Pattern: Stack-Based State Management

Anywhere you need to track "history" or "previous states," this pattern applies:

```typescript
// Generic pattern
type State<S, A> = (s: S) => [A, S]

// Apply it to:
interface HistoryState<T> {
  current: T
  history: T[]      // Past states
  future: T[]       // Undone states
}
```

### Real-World Applications

#### 1. **Form State with Change History**

```typescript
interface FormState {
  values: Record<string, unknown>
  history: Record<string, unknown>[]
  future: Record<string, unknown>[]
  isDirty: boolean
  errors: Record<string, string>
}

// Every field change is tracked, with full undo/redo
const updateField = (key: string, value: unknown): State<FormState, void> =>
  State((state) => {
    const newValues = { ...state.values, [key]: value }
    return [undefined, {
      ...state,
      values: newValues,
      history: [...state.history, state.values],
      future: [],
      isDirty: true
    }]
  })
```

#### 2. **Game State with Replayability**

```typescript
interface GameState {
  board: Cell[][]
  moves: Move[]
  future: Move[]
  turn: number
}

// Every game move is reversible and repeatable
const makeMove = (move: Move): State<GameState, boolean> =>
  State((state) => {
    const isValid = validateMove(state.board, move)
    if (!isValid) return [false, state]
    
    const newBoard = applyMove(state.board, move)
    return [true, {
      ...state,
      board: newBoard,
      moves: [...state.moves, move],
      future: [],
      turn: state.turn + 1
    }]
  })

// Replay: apply all moves in order
function replayGame(game: GameState) {
  let state = initialGameState
  for (const move of game.moves) {
    state = makeMove(move).run(state)[1]
  }
  return state.board
}
```

#### 3. **Database Transaction Log**

```typescript
interface TransactionState {
  data: Record<string, unknown>
  log: Array<{ op: string, before: any, after: any }>
  rollbackStack: Array<Record<string, unknown>>
}

// Every change is logged and can be audited or rolled back
const update = (key: string, value: unknown): State<TransactionState, void> =>
  State((state) => {
    const before = state.data[key]
    const newData = { ...state.data, [key]: value }
    
    return [undefined, {
      data: newData,
      log: [...state.log, { op: 'UPDATE', before, after: value }],
      rollbackStack: [...state.rollbackStack, state.data]
    }]
  })

// Audit trail: see exactly what changed and when
console.log(state.log)  // [{ op: 'UPDATE', before: null, after: 'New value' }, ...]

// Rollback to any checkpoint
const snapshot = state.rollbackStack[5]  // State 5 operations ago
```

#### 4. **Animation Keyframes**

```typescript
interface AnimationState {
  currentFrame: number
  keyframes: Keyframe[]
  history: Keyframe[][]
}

// Build animations frame by frame, with full edit history
const addKeyframe = (frame: Keyframe): State<AnimationState, void> =>
  State((state) => {
    return [undefined, {
      ...state,
      keyframes: [...state.keyframes, frame],
      currentFrame: state.keyframes.length,
      history: [...state.history, state.keyframes]
    }]
  })

// Undo removes the last keyframe, redo restores it
const undoKeyframe = (): State<AnimationState, void> =>
  State((state) => {
    if (state.history.length === 0) return [undefined, state]
    const previousKeyframes = state.history[state.history.length - 1]
    return [undefined, {
      ...state,
      keyframes: previousKeyframes,
      currentFrame: previousKeyframes.length - 1,
      history: state.history.slice(0, -1)
    }]
  })
```

#### 5. **Configuration Management**

```typescript
interface ConfigState {
  current: Config
  history: Config[]
  deployments: Array<{ config: Config, timestamp: Date }>
}

// Deploy a config, keep full history
const deployConfig = (newConfig: Config): State<ConfigState, void> =>
  State((state) => {
    return [undefined, {
      current: newConfig,
      history: [...state.history, state.current],
      deployments: [...state.deployments, {
        config: newConfig,
        timestamp: new Date()
      }]
    }]
  })

// Rollback to any previous deployment
const rollbackToDeployment = (index: number): State<ConfigState, void> =>
  State((state) => {
    const previousConfig = state.deployments[index].config
    return [undefined, {
      ...state,
      current: previousConfig,
      history: [...state.history, state.current]
    }]
  })
```

## Key Insights

### 1. **History is Just State**

Instead of treating history as an afterthought, make it part of your core state:

```typescript
// Bad: history is separate
let todos = []
let history = []

// Good: history is built-in
interface AppState {
  todos: Todos
  history: Todos[]
  future: Todos[]
}
```

### 2. **Composition Over Configuration**

Don't write separate "undo-aware" and "normal" versions of operations:

```typescript
// ❌ Don't do this
function addTodoUndoAware() { ... }
function addTodoNormal() { ... }

// ✅ Do this - one version works both ways
const addTodo = (...): State<Todos, Todo> => ...
const addWithHistory = (...): State<AppState, Todo> =>
  State((state) => {
    const [result, newTodos] = addTodo(...).run(state.todos)
    return [result, { ...state, todos: newTodos, history: [...state.history, state.todos] }]
  })
```

### 3. **New Actions Clear Future**

When the user performs a new action after undoing, discard the redo chain:

```typescript
// After: add('A'), add('B'), undo() -> user is back to ['A']
// If user now adds('C'), the future (which contained ['A', 'B']) is discarded
// This matches what users expect (no branching timelines)

const addWithHistory = (title: string): State<AppState, Todo> =>
  State((state) => {
    // ...
    return [newTodo, {
      ...state,
      todos: newTodos,
      history: [...state.history, state.todos],
      future: []  // ← Clear redo chain on new action
    }]
  })
```

## Testing the Pattern

Here's the test suite we built:

```typescript
describe('History Operations', () => {
  it('undo restores previous state', () => {
    const state1 = addWithHistory('First').run(initialState)[1]
    const state2 = addWithHistory('Second').run(state1)[1]
    const state3 = undo().run(state2)[1]
    
    expect(state3.todos).toEqual(state1.todos)
    expect(state3.future).toHaveLength(1)
  })

  it('redo restores undone state', () => {
    const state1 = addWithHistory('First').run(initialState)[1]
    const state2 = addWithHistory('Second').run(state1)[1]
    const state3 = undo().run(state2)[1]
    const state4 = redo().run(state3)[1]
    
    expect(state4.todos).toEqual(state2.todos)
  })

  it('new action clears future', () => {
    const state1 = addWithHistory('First').run(initialState)[1]
    const state2 = addWithHistory('Second').run(state1)[1]
    const state3 = undo().run(state2)[1]
    const state4 = addWithHistory('Third').run(state3)[1]
    
    expect(state4.future).toHaveLength(0)  // Can't redo anymore
  })

  it('undo/redo cycle preserves state', () => {
    let state = initialState
    state = addWithHistory('A').run(state)[1]
    state = addWithHistory('B').run(state)[1]
    state = addWithHistory('C').run(state)[1]
    
    const stateAtC = state
    state = undo().run(state)[1]
    state = undo().run(state)[1]
    state = redo().run(state)[1]
    state = redo().run(state)[1]
    
    expect(state.todos).toEqual(stateAtC.todos)
  })
})
```

## Summary

The State monad is a powerful pattern for:
- **Undo/Redo systems** (games, editors, tools)
- **Auditing and logging** (finance, compliance, debugging)
- **Configuration management** (deployments, rollbacks)
- **Animation and keyframes** (timing, previews)
- **Form state** (complex user interactions)
- **Game logic** (replay and validation)

The key principles:
1. **Never mutate** — return `[result, newState]`
2. **Compose** — build complex operations from simple ones
3. **Track history** — make it part of your core state
4. **Test easily** — pure functions need no setup

Once you internalize this pattern, you'll see it everywhere. Any system where state evolves in steps can benefit from functional state management.
