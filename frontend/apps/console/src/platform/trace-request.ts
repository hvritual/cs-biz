/**
 * W3C traceparent boundary for browser → Go diagnostic qualification.
 * This is deliberately transport-only, NOT a second tracing SDK or an
 * authenticated API client. Yunka OTel will own production spans later.
 */
export interface BrowserTraceContext {
  traceId: string;
  clientSpanId: string;
  traceparent: string;
}

export type TraceRequestFailureCode = 'TRACE_NETWORK_FAILURE' | 'TRACE_CONTEXT_MISMATCH' | 'TRACE_ENTROPY_UNAVAILABLE';

export class TraceRequestError extends Error {
  constructor(
    readonly code: TraceRequestFailureCode,
    readonly traceId: string | null,
  ) {
    // Do not expose arbitrary URLs, browser exceptions or secrets in user copy.
    super(code);
    this.name = 'TraceRequestError';
  }
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  for (let attempt = 0; attempt < 3; attempt++) {
    crypto.getRandomValues(bytes);
    if (bytes.some((value) => value !== 0)) {
      return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
    }
  }
  throw new TraceRequestError('TRACE_ENTROPY_UNAVAILABLE', null);
}

export function createBrowserTrace(): BrowserTraceContext {
  const traceId = randomHex(16);
  const clientSpanId = randomHex(8);
  return {
    traceId,
    clientSpanId,
    traceparent: '00-' + traceId + '-' + clientSpanId + '-01',
  };
}

export interface TracedFetchResult {
  response: Response;
  traceId: string;
  clientSpanId: string;
  serverSpanId: string;
}

/**
 * The response must echo the same trace; network failure preserves the client
 * trace ID for diagnosis. A valid trace header is never an identity credential.
 */
export async function fetchWithTrace(
  input: RequestInfo | URL,
  init: RequestInit = {},
  transport: typeof fetch = fetch,
): Promise<TracedFetchResult> {
  const trace = createBrowserTrace();
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  // Always override a caller-provided traceparent; never accept a forged ID.
  headers.set('traceparent', trace.traceparent);
  let response: Response;
  try {
    response = await transport(input, { ...init, headers });
  } catch {
    throw new TraceRequestError('TRACE_NETWORK_FAILURE', trace.traceId);
  }
  const echoed = response.headers.get('x-trace-id');
  const serverSpanId = response.headers.get('x-span-id');
  if (echoed !== trace.traceId || !serverSpanId || !/^[0-9a-f]{16}$/.test(serverSpanId) ||
    serverSpanId === '0000000000000000' || serverSpanId === trace.clientSpanId) {
    throw new TraceRequestError('TRACE_CONTEXT_MISMATCH', trace.traceId);
  }
  return { response, traceId: trace.traceId, clientSpanId: trace.clientSpanId, serverSpanId };
}
