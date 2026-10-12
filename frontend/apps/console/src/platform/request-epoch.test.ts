import { describe, expect, it } from 'vitest';
import { RequestEpoch } from './request-epoch';

describe('workspace request lifetime', () => {
  it('invalidates every earlier capture and aborts its shared signal', () => {
    const epoch = new RequestEpoch();
    const earlier = epoch.capture();
    const next = epoch.advance();
    expect(earlier.signal.aborted).toBe(true);
    expect(earlier.isCurrent()).toBe(false);
    expect(next.isCurrent()).toBe(true);
    expect(next.revision).toBe(earlier.revision + 1);
  });

  it('discards a late result even when the transport ignores cancellation', async () => {
    const epoch = new RequestEpoch();
    const earlier = epoch.capture();
    let finish!: (value: string) => void;
    let visible = 'enterprise A';
    const response = new Promise<string>((resolve) => { finish = resolve; });
    const waiting = response.then((value) => { if (earlier.isCurrent()) visible = value; });
    epoch.advance();
    visible = 'enterprise B';
    finish('late enterprise A');
    await waiting;
    expect(visible).toBe('enterprise B');
  });
});
