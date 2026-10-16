let csrfToken = '';

export type AdminSession = {
  authenticated: true;
  csrfToken: string;
  profile: { email: string; displayName: string; defaultAuthor: string };
  createdAt: string;
  expiresAt: string;
};

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function parse(response: Response) {
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('adminzz:unauthorized'));
    throw new Error(typeof body === 'object' && body ? body.error || 'Request failed.' : 'Request failed.');
  }
  return body;
}

export async function adminRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || 'GET';
  const headers = new Headers(options.headers);
  if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
    headers.set('X-CSRF-Token', csrfToken);
    if (options.body !== undefined && !(options.body instanceof Blob) && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
  }
  const response = await fetch(`/api/adminzz${path}`, {
    ...options,
    method,
    headers,
    credentials: 'same-origin',
    body: options.body === undefined
      ? undefined
      : options.body instanceof Blob || options.body instanceof FormData || typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body),
  });
  return parse(response) as Promise<T>;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const session = await adminRequest<AdminSession>('/session');
    csrfToken = session.csrfToken;
    return session;
  } catch {
    csrfToken = '';
    return null;
  }
}

export async function adminLogin(email: string, password: string) {
  const response = await adminRequest<{ authenticated: true; csrfToken: string; profile: AdminSession['profile'] }>('/auth/login', {
    method: 'POST', body: { email, password },
  });
  csrfToken = response.csrfToken;
  return response;
}

export async function adminLogout() {
  await adminRequest('/auth/logout', { method: 'POST' });
  csrfToken = '';
}

export async function adminBinary(path: string, format: string) {
  const response = await fetch(`/api/adminzz${path}`, { credentials: 'same-origin' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'The export could not be downloaded.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `technoedge-export.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const adminCsrfToken = () => csrfToken;
