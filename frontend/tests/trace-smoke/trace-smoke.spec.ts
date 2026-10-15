import { expect, test } from '@playwright/test';

interface ProbeResult {
  traceId: string;
  clientSpanId: string;
  serverSpanId: string;
  status: number;
  body: {
    traceId: string;
    spanId: string;
    ok: boolean;
    code?: string;
  };
}

test('actual browser → live Go W3C parent-child and failure trace identity', async ({ page }) => {
  await page.goto('/auth/login');
  // Import from the running Vite app in real Chromium; this does not add
  // a user-facing diagnostic page or make an unauthenticated business API.
  const result = await page.evaluate(async () => {
    const { fetchWithTrace } = await import('/src/platform/trace-request.ts');
    async function invoke(path: string): Promise<ProbeResult> {
      const result = await fetchWithTrace('http://127.0.0.1:8097' + path);
      const body = await result.response.json() as ProbeResult['body'];
      return {
        traceId: result.traceId,
        clientSpanId: result.clientSpanId,
        serverSpanId: result.serverSpanId,
        status: result.response.status,
        body,
      };
    }
    return { success: await invoke('/__dev/trace'), failure: await invoke('/__dev/trace/failure') };
  });
  expect(result.success.status).toBe(200);
  expect(result.success.body.ok).toBe(true);
  expect(result.failure.status).toBe(500);
  expect(result.failure.body.code).toBe('TRACE_PROBE_FAILURE');
  expect(result.failure.body.ok).toBe(false);

  for (const response of [result.success, result.failure]) {
    expect(response.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(response.clientSpanId).toMatch(/^[0-9a-f]{16}$/);
    expect(response.serverSpanId).toMatch(/^[0-9a-f]{16}$/);
    expect(response.serverSpanId).not.toBe(response.clientSpanId);
    expect(response.body.traceId).toBe(response.traceId);
    expect(response.body.spanId).toBe(response.serverSpanId);
  }
  expect(result.success.traceId).not.toBe(result.failure.traceId);
});
