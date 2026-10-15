import { describe, expect, it, vi } from 'vitest';

import { createBrowserTrace, fetchWithTrace, TraceRequestError } from './trace-request';

describe('W3C browser → Go trace transport bridge', () => {
  it('generates nonzero, distinct W3C trace and client span identifiers', () => {
    const a = createBrowserTrace();
    const b = createBrowserTrace();
    expect(a.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(a.clientSpanId).toMatch(/^[0-9a-f]{16}$/);
    expect(a.traceId).not.toBe('0'.repeat(32));
    expect(a.clientSpanId).not.toBe('0'.repeat(16));
    expect(a.traceparent).toBe('00-' + a.traceId + '-' + a.clientSpanId + '-01');
    expect(b.traceId).not.toBe(a.traceId);
  });

  it('preserves ordinary headers, overwrites forged traceparent, and checks response echo', async () => {
    const transport = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const parent = headers.get('traceparent')!;
      expect(parent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
      expect(parent).not.toContain('forged');
      expect(headers.get('x-operation')).toBe('read');
      expect(headers.get('accept')).toBe('application/json');
      const [, traceId] = parent.split('-');
      return new Response(JSON.stringify({ code: 'TRACE_PROBE_FAILURE', traceId }), {
        status: 500,
        headers: { 'x-trace-id': traceId!, 'x-span-id': '1111111111111111' },
      });
    });
    const result = await fetchWithTrace('http://127.0.0.1:8097/__dev/trace/failure', {
      headers: {
        Accept: 'application/json',
        'x-operation': 'read',
        traceparent: 'forged',
      },
    }, transport);
    expect(result.response.status).toBe(500);
    expect(result.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(result.serverSpanId).toBe('1111111111111111');
    expect(transport).toHaveBeenCalledOnce();
  });

  it('never accepts a missing or mismatched server trace identity', async () => {
    for (const badHeaders of [{}, { 'x-trace-id': 'deadbeef', 'x-span-id': '2222222222222222' }]) {
      await expect(fetchWithTrace('/test', {}, async () => new Response('', { headers: badHeaders })))
        .rejects.toMatchObject({ code: 'TRACE_CONTEXT_MISMATCH', traceId: expect.stringMatching(/^[0-9a-f]{32}$/) });
    }
  });

  it('keeps a trace identity on connection errors without leaking transport details', async () => {
    const request = fetchWithTrace('/test', {}, async () => { throw new Error('credential-is-secret'); });
    await expect(request).rejects.toMatchObject({
      code: 'TRACE_NETWORK_FAILURE',
      traceId: expect.stringMatching(/^[0-9a-f]{32}$/),
    });
    await expect(fetchWithTrace('/test', {}, async () => {
      throw new Error('hidden-secret');
    })).rejects.toBeInstanceOf(TraceRequestError);
  });
});
