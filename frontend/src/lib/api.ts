const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('campus_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('campus_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('campus_token');
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not sending FormData, set Content-Type to JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred with the request.');
  }

  return data;
}

// API methods
export const api = {
  // Auth
  login: (email: string, name?: string, campusName?: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, name, campusName }),
    }),
  getMe: () => apiRequest('/auth/me'),

  // Items
  getItems: (params: {
    type?: string;
    category?: string;
    search?: string;
    lat?: number;
    lng?: number;
    radiusMeters?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.lat) query.set('lat', params.lat.toString());
    if (params.lng) query.set('lng', params.lng.toString());
    if (params.radiusMeters) query.set('radiusMeters', params.radiusMeters.toString());

    return apiRequest(`/items?${query.toString()}`);
  },

  getItemById: (id: string) => apiRequest(`/items/${id}`),

  createItem: (formData: FormData) =>
    apiRequest('/items', {
      method: 'POST',
      body: formData,
    }),

  updateItemStatus: (id: string, status: string) =>
    apiRequest(`/items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  verifyHandover: (itemId: string, handoverCode: string) =>
    apiRequest('/items/verify-handover', {
      method: 'POST',
      body: JSON.stringify({ itemId, handoverCode }),
    }),

  // Claims
  submitClaim: (itemId: string, proofDescription: string, verificationAnswer?: string) =>
    apiRequest('/claims', {
      method: 'POST',
      body: JSON.stringify({ itemId, proofDescription, verificationAnswer }),
    }),

  reviewClaim: (claimId: string, status: 'APPROVED' | 'REJECTED') =>
    apiRequest(`/claims/${claimId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  sendMessage: (itemId: string, text: string) =>
    apiRequest(`/claims/item/${itemId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Stats, Leaderboard & Notifications
  getStats: () => apiRequest('/stats/campus-metrics'),
  getLeaderboard: () => apiRequest('/stats/leaderboard'),
  getNotifications: () => apiRequest('/stats/notifications'),
  markNotificationRead: (id: string) =>
    apiRequest(`/stats/notifications/${id}/read`, { method: 'PATCH' }),
};
