export function getApiBaseUrl(): string {
  const env = (import.meta as any).env || {};
  const fromEnv = env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && typeof fromEnv === 'string') return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const isHttps = protocol === 'https:';
    const defaultPort = isHttps ? 443 : 80;
    const port = (window.location.port && parseInt(window.location.port, 10)) || defaultPort;

    // If running vite dev (3000/3001/5173), use 7001 for backend
    if ([3000, 3001, 5173].includes(port)) {
return `${isHttps ? 'https' : 'http'}://localhost:7080/api`;
    }
    // Otherwise assume same origin + /api (Netlify proxy)
    return `${protocol}//${hostname}${window.location.port ? `:${window.location.port}` : ''}/api`;
  }
  // SSR fallback
return 'http://localhost:7080/api';
}

export function getWsBaseUrl(): string {
  const env = (import.meta as any).env || {};
  const fromEnv = env.VITE_WS_BASE_URL as string | undefined;
  if (fromEnv && typeof fromEnv === 'string') return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const isHttps = protocol === 'https:';
    const wsProto = isHttps ? 'wss' : 'ws';
    const defaultPort = isHttps ? 443 : 80;
    const port = (window.location.port && parseInt(window.location.port, 10)) || defaultPort;
    if ([3000, 3001, 5173].includes(port)) {
return `${isHttps ? 'https' : 'http'}://localhost:7080`;
    }
    return `${wsProto}://${hostname}${window.location.port ? `:${window.location.port}` : ''}`;
  }
return 'http://localhost:7080';
}

