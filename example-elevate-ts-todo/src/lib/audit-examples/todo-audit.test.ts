import { describe, it, expect, beforeEach } from 'vitest';
import { Audit } from '@zambit/elevate-ts';
import {
  createAuditedAddition,
  createAuditedToggle,
  replayOperations,
  filterAddOperations,
  getOperationCount,
} from './todo-audit';
import type { AppState } from '../types';

const initialState: AppState = {
  todos: [],
  filter: 'All',
  history: [],
  future: [],
};

describe('todo audit', () => {
  let session: Audit.AuditSession;

  beforeEach(() => {
    session = Audit.withEnabled(true)(Audit.createSession());
  });

  it('records an add operation', () => {
    const [newSession] = createAuditedAddition('Buy milk', initialState, session);
    const entries = Audit.getEntries(Audit.getLog(newSession));

    expect(entries).toHaveLength(1);
    expect(entries[0].operation).toBe('addWithHistory');
    expect(entries[0].monadType).toBe('State');
  });

  it('records multiple operations in sequence', () => {
    const [s1] = createAuditedAddition('Task 1', initialState, session);
    const [s2] = createAuditedAddition('Task 2', initialState, s1);

    const entries = Audit.getEntries(Audit.getLog(s2));
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.operation)).toEqual([
      'addWithHistory',
      'addWithHistory',
    ]);
  });

  it('records toggle operations', () => {
    const state1 = {
      ...initialState,
      todos: [{ id: 1, title: 'Test', done: false }],
    };

    const [s1] = createAuditedAddition('Another', state1, session);
    const [s2] = createAuditedToggle(1, state1, s1);

    const entries = Audit.getEntries(Audit.getLog(s2));
    expect(entries).toHaveLength(2);
    expect(entries[0].operation).toBe('addWithHistory');
    expect(entries[1].operation).toBe('toggleWithHistory');
  });

  it('replays all operations in order', () => {
    const [s1] = createAuditedAddition('Task 1', initialState, session);
    const state1 = {
      ...initialState,
      todos: [{ id: 1, title: 'Task 1', done: false }],
    };
    const [s2] = createAuditedAddition('Task 2', state1, s1);

    const log = Audit.getLog(s2);
    const replay = replayOperations(log);

    expect(replay).toHaveLength(2);
    expect(replay[0].operation).toBe('addWithHistory');
    expect(replay[1].operation).toBe('addWithHistory');
  });

  it('filters operations by type', () => {
    const [s1] = createAuditedAddition('Task 1', initialState, session);
    const state1 = {
      ...initialState,
      todos: [{ id: 1, title: 'Task 1', done: false }],
    };
    const [s2] = createAuditedAddition('Task 2', state1, s1);

    const log = Audit.getLog(s2);
    const filtered = filterAddOperations(log);
    const entries = Audit.getEntries(filtered);

    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.operation === 'addWithHistory')).toBe(true);
  });

  it('counts total operations', () => {
    const [s1] = createAuditedAddition('Task 1', initialState, session);
    const state1 = {
      ...initialState,
      todos: [{ id: 1, title: 'Task 1', done: false }],
    };
    const [s2] = createAuditedAddition('Task 2', state1, s1);
    const [s3] = createAuditedToggle(1, state1, s2);

    const log = Audit.getLog(s3);
    const count = getOperationCount(log);

    expect(count).toBe(3);
  });

  it('includes state snapshots in entries', () => {
    const [newSession, log] = createAuditedAddition('Task', initialState, session);
    const entries = Audit.getEntries(log);

    expect(entries[0].input).toEqual(initialState);
    expect(entries[0].output.todos).toHaveLength(1);
    expect(entries[0].output.todos[0].title).toBe('Task');
  });
});
