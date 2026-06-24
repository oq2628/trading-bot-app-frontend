const API_BASE_URL = 'http://localhost:8000';

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

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errData.detail || 'An error occurred');
    }
    return response.json();
  },

  async post<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errData.detail || 'An error occurred');
    }
    return response.json();
  },

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errData.detail || 'An error occurred');
    }
    return response.json();
  },

  async putForm<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: formData,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errData.detail || 'An error occurred');
    }
    return response.json();
  },

  async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errData.detail || 'An error occurred');
    }
    return response.json();
  },

  async delete(path: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errData.detail || 'An error occurred');
    }
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
