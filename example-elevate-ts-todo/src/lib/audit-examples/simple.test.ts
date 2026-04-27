import { describe, it, expect } from 'vitest';
import { runSimpleAudit, getSimpleEntries } from './simple';

describe('simple audit', () => {
  it('tracks a single function call', () => {
    const result = runSimpleAudit(5);
    const [output] = result;

    expect(output).toBe(10);
  });

  it('records operation in audit log', () => {
    const result = runSimpleAudit(5);
    const entries = getSimpleEntries(result);

    expect(entries).toHaveLength(1);
    expect(entries[0].operation).toBe('add');
    expect(entries[0].monadType).toBe('number');
    expect(entries[0].input).toBe(5);
    expect(entries[0].output).toBe(10);
  });

  it('includes timestamp and id in entry', () => {
    const result = runSimpleAudit(5);
    const entries = getSimpleEntries(result);

    expect(entries[0].timestamp).toBeGreaterThan(0);
    expect(entries[0].id).toBeDefined();
    expect(typeof entries[0].id).toBe('string');
  });
});
