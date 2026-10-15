import { expect, test } from '@playwright/test';

interface OTelProbe {
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

test('actual browser → Yunka OTel → Collector → queryable Jaeger traces', async ({ page, request }) => {
  await page.goto('/auth/login');
  const result = await page.evaluate(async () => {
    const { fetchWithTrace } = await import('/src/platform/trace-request.ts');
    async function call(path: string): Promise<OTelProbe> {
      const traced = await fetchWithTrace('http://127.0.0.1:8097' + path);
      const body = await traced.response.json() as OTelProbe['body'];
      return {
        traceId: traced.traceId,
        clientSpanId: traced.clientSpanId,
        serverSpanId: traced.serverSpanId,
        status: traced.response.status,
        body,
      };
    }
    return { ok: await call('/__dev/otel'), failed: await call('/__dev/otel/failure') };
  });
  expect(result.ok.status).toBe(200);
  expect(result.ok.body.ok).toBe(true);
  expect(result.failed.status).toBe(500);
  expect(result.failed.body.code).toBe('TRACE_PROBE_FAILURE');

  for (const trace of [result.ok, result.failed]) {
    expect(trace.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(trace.clientSpanId).toMatch(/^[0-9a-f]{16}$/);
    expect(trace.serverSpanId).toMatch(/^[0-9a-f]{16}$/);
    expect(trace.serverSpanId).not.toBe(trace.clientSpanId);
    expect(trace.body.traceId).toBe(trace.traceId);
    expect(trace.body.spanId).toBe(trace.serverSpanId);

    // Query a real, separately running trace backend; matching the HTTP echo
    // or terminal log alone would not establish OTel export/durability.
    await expect.poll(async () => {
      try {
        const response = await request.get(
          'http://127.0.0.1:16686/api/traces/' + trace.traceId,
          { timeout: 3_000 },
        );
        if (!response.ok()) return false;
        const data = await response.json() as {
          data?: Array<{
            spans?: Array<{
              traceID?: string;
              spanID?: string;
              operationName?: string;
              references?: Array<{ spanID?: string }>;
            }>;
          }>;
        };
        const serverSpan = data.data?.flatMap((item) => item.spans ?? []).find(
          (span) => span.traceID === trace.traceId &&
            span.spanID === trace.serverSpanId &&
            span.operationName === 'observability.traceprobe.otel',
        );
        return Boolean(serverSpan &&
          JSON.stringify(serverSpan.references ?? []).includes(trace.clientSpanId));
      } catch {
        return false;
      }
    }, { timeout: 40_000, intervals: [500, 750, 1_500, 2_000] }).toBe(true);
  }
  expect(result.ok.traceId).not.toBe(result.failed.traceId);
});
