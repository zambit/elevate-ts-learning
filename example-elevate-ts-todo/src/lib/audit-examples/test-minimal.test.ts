import { describe, it, expect } from 'vitest';
import { Audit } from '@zambit/elevate-ts';

describe('minimal audit test', () => {
  it('creates audit session', () => {
    const session = Audit.createSession();
    expect(session.tag).toBe('AuditSession');
  });
});
