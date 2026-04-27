import { describe, it, expect } from 'vitest';
import {
  runPipelineAudit,
  getPipelineEntries,
  getInputAt,
  getOutputAt,
  getEntryAt,
} from './pipeline';

describe('pipeline audit', () => {
  it('runs two operations in sequence', () => {
    const result = runPipelineAudit();
    const [output] = result;

    expect(output).toBe(20);
  });

  it('records both operations in order', () => {
    const result = runPipelineAudit();
    const entries = getPipelineEntries(result);

    expect(entries).toHaveLength(2);
    expect(entries[0].operation).toBe('double');
    expect(entries[1].operation).toBe('addTen');
  });

  it('retrieves input at specific index', () => {
    const result = runPipelineAudit();
    const input0 = getInputAt(0, result);
    const input1 = getInputAt(1, result);

    if (input0.tag === 'Just') {
      expect(input0.value).toBe(5);
    } else {
      expect.fail('Expected Just');
    }

    if (input1.tag === 'Just') {
      expect(input1.value).toBe(10);
    } else {
      expect.fail('Expected Just');
    }
  });

  it('retrieves output at specific index', () => {
    const result = runPipelineAudit();
    const output0 = getOutputAt(0, result);
    const output1 = getOutputAt(1, result);

    if (output0.tag === 'Just') {
      expect(output0.value).toBe(10);
    } else {
      expect.fail('Expected Just');
    }

    if (output1.tag === 'Just') {
      expect(output1.value).toBe(20);
    } else {
      expect.fail('Expected Just');
    }
  });

  it('retrieves entry at specific index', () => {
    const result = runPipelineAudit();
    const entry0 = getEntryAt(0, result);

    if (entry0.tag === 'Just') {
      expect(entry0.value.operation).toBe('double');
      expect(entry0.value.input).toBe(5);
      expect(entry0.value.output).toBe(10);
    } else {
      expect.fail('Expected Just');
    }
  });

  it('returns Nothing for out of bounds index', () => {
    const result = runPipelineAudit();
    const entry99 = getEntryAt(99, result);

    const isNothing = entry99.tag === 'Nothing';

    expect(isNothing).toBe(true);
  });
});
