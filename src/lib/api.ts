export function getAuthToken(): string | null {
  const token = localStorage.getItem('earn_token');
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token.trim();
}

export function setAuthToken(token: string): void {
  if (token && typeof token === 'string' && token !== 'undefined' && token !== 'null') {
    localStorage.setItem('earn_token', token.trim());
  }
}

export function removeAuthToken(): void {
  localStorage.removeItem('earn_token');
}

export function getAdminToken(): string | null {
  const token = localStorage.getItem('earn_admin_token');
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token.trim();
}

export function setAdminToken(token: string): void {
  if (token && typeof token === 'string' && token !== 'undefined' && token !== 'null') {
    localStorage.setItem('earn_admin_token', token.trim());
  }
}

export function removeAdminToken(): void {
  localStorage.removeItem('earn_admin_token');
}

export function authFetch(url: string, options: RequestInit = {}, explicitToken?: string): Promise<Response> {
  const token = explicitToken || getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-session-token', token);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export function adminFetch(url: string, options: RequestInit = {}, explicitToken?: string): Promise<Response> {
  const token = explicitToken || getAdminToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-admin-token', token);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
