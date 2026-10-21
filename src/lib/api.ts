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

  // Double-header session resilience: pass cached user id
  try {
    const savedUserStr = localStorage.getItem('earn_saved_user');
    if (savedUserStr) {
      const u = JSON.parse(savedUserStr);
      if (u && u.id) {
        headers.set('x-user-id', String(u.id));
      }
    }
  } catch {}

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

export async function safeJson<T = any>(res: Response, defaultMessage = 'অনুরোধটি সম্পন্ন করা যায়নি'): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      // Continue to error extraction
    }
  }

  let textSnippet = '';
  try {
    const rawText = await res.text();
    const cleanText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanText && cleanText.length > 0 && cleanText.length < 150 && !cleanText.startsWith('<!DOCTYPE')) {
      textSnippet = cleanText;
    }
  } catch {}

  // If HTML or plaintext error from host (e.g., Vercel 404 / 502)
  let hint = defaultMessage;
  if (textSnippet) {
    hint = textSnippet;
  } else if (res.status === 404) {
    hint = 'সার্ভার এপিআই পাওয়া যায়নি (404)। Vercel এ ব্যাকএন্ড কনফিগারেশন রিলোড করুন।';
  } else if (res.status === 500) {
    hint = 'সার্ভার অভ্যন্তরীণ সমস্যা (500 Internal Error)';
  } else if (res.status === 502 || res.status === 504) {
    hint = 'সার্ভার রেসপন্স গেটওয়ে টাইমআউট (502/504)';
  } else if (!res.ok) {
    hint = `সার্ভার সমস্যা (HTTP ${res.status})`;
  }

  const err = new Error(hint);
  (err as any).status = res.status;
  throw err;
}
