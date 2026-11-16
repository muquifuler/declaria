// Un cliente por cada API del proyecto. El prefijo lo enruta Vite en local y Nginx en el VPS.
export interface Backend {
  label: string;
  base: string;
  health: string | null;
}

export const BACKENDS: Record<string, Backend> = {
  node_api: { label: 'Servidor Node.js', base: '/api', health: '/health' },
};

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function createApi(base: string) {
  async function request<T = unknown>(path: string, { method = 'GET', body, headers = {}, token, signal }: RequestOptions = {}): Promise<T> {
    const isJson = body !== undefined && !(body instanceof Blob) && !(body instanceof FormData);
    const res = await fetch(`${base}${path}`, {
      method,
      signal,
      headers: {
        ...(isJson ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: isJson ? JSON.stringify(body) : (body as BodyInit | undefined),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    if (!res.ok) throw new ApiError(data?.error || data?.detail || `HTTP ${res.status}`, res.status);
    return data as T;
  }
  return {
    get: <T = unknown>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
    post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'POST', body }),
    put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'PUT', body }),
    del: <T = unknown>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
  };
}

export type Api = ReturnType<typeof createApi>;

// apis.node_api.get('/health'), apis.fastapi.post('/items', {...})…
export const apis: Record<string, Api> = Object.fromEntries(Object.entries(BACKENDS).map(([k, b]) => [k, createApi(b.base)]));

// API principal (/api): atajos de siempre
export const api = apis.node_api;
export const apiGet = <T = unknown>(path: string, opts?: RequestOptions) => api.get<T>(path, opts);
export const apiPost = <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => api.post<T>(path, body, opts);
