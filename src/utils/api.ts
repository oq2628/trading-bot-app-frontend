// Base URL of the backend API.
//
// Production serves the frontend and the backend from one origin (Caddy
// proxies /api/* to uvicorn), so VITE_API_BASE_URL is an empty string there
// and every request below becomes a same-origin relative URL. Development
// points at the local uvicorn on a different port.
//
// vite.config.ts refuses to produce a production build when the variable is
// unset, so a bundle can never ship with the development default baked in.
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// A trailing slash would produce "//api/..." once a path is appended.
export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '');

// Origin for WebSocket connections, derived from the same setting so the two
// can never drift apart. When API_BASE_URL is empty the API is same-origin, so
// the socket follows the page's own protocol and host — which also keeps it on
// wss:// wherever the page is served over TLS.
export const WS_BASE_URL = API_BASE_URL
  ? API_BASE_URL.replace(/^http/, 'ws')
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Turn a fetch Response into data, or throw with the API's own message.
 *
 * A 401 while holding a token means the session is gone -- expired, revoked, or
 * the account deleted. Every caller used to receive a generic "An error
 * occurred" and the stale token stayed in localStorage, so the app kept
 * retrying with a credential the server had already rejected. Clear it and send
 * the user to the login page instead.
 *
 * Requests made without a token are left alone: a 401 from the login endpoint
 * is a wrong password, not an expired session, and redirecting there would loop.
 */
async function handleResponse<T>(response: Response, parseBody: boolean): Promise<T> {
  if (response.status === 401 && localStorage.getItem('token')) {
    localStorage.removeItem('token');
    // A full navigation rather than a router push: this runs outside React and
    // has no access to the router, and discarding all in-memory state is the
    // right outcome for a session that no longer exists.
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errData.detail || 'An error occurred');
  }

  return parseBody ? response.json() : (undefined as T);
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<T>(response, true);
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response, true);
  },

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse<T>(response, true);
  },

  async putForm<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse<T>(response, true);
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response, true);
  },

  async delete(path: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<void>(response, false);
  },

  async downloadFile(productId: string, filename: string): Promise<void> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/downloads/${productId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Download failed' }));
      throw new Error(errData.detail || 'Failed to download tool');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    let finalFilename = filename;
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      // RegEx to parse filename parameter from Content-Disposition header
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        finalFilename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', finalFilename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
export default api;
