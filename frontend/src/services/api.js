/**
 * Frontend API Service Layer
 */

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({ success: false, message: 'Invalid response from server' }));

    if (!res.ok) {
      if (res.status === 401 && !options.skipAuthRedirect) {
        if (data.hijackAlert) {
          alert('SECURITY WARNING: ' + (data.message || 'Session Hijacking Alert: User-Agent mismatch!'));
        }
        // If session expired or revoked, clear storage
        if (data.message && data.message.includes('expired')) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.dispatchEvent(new Event('auth-session-expired'));
        }
      }
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyEmail: (body) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  verify2FA: (body) => request('/auth/verify-2fa', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Profiles
  getMyProfile: () => request('/profiles/me'),
  updateProfile: (body) => request('/profiles/me', { method: 'PUT', body: JSON.stringify(body) }),
  getPublicProfile: (userId) => request(`/profiles/${userId}`),

  // Listings
  getListings: (params = '') => request(`/listings${params}`),
  getMyListings: () => request('/listings/user/my-listings'),
  getListing: (id) => request(`/listings/${id}`),
  createListing: (body) => request('/listings', { method: 'POST', body: JSON.stringify(body) }),
  updateListing: (id, body) => request(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateListingStatus: (id, status) => request(`/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteListing: (id) => request(`/listings/${id}`, { method: 'DELETE' }),

  // Roommate Matching
  getSuggestedRoommates: (params = '') => request(`/matching/suggestions${params}`),

  // Requests
  sendRequest: (body) => request('/requests', { method: 'POST', body: JSON.stringify(body) }),
  getReceivedRequests: () => request('/requests/received'),
  getSentRequests: () => request('/requests/sent'),
  acceptRequest: (id) => request(`/requests/${id}/accept`, { method: 'PATCH' }),
  declineRequest: (id) => request(`/requests/${id}/decline`, { method: 'PATCH' }),
  cancelRequest: (id) => request(`/requests/${id}/cancel`, { method: 'PATCH' }),

  // Messages
  getConversations: () => request('/messages/conversations'),
  getMessageHistory: (partnerId) => request(`/messages/history/${partnerId}`),
  sendMessage: (body) => request('/messages/send', { method: 'POST', body: JSON.stringify(body) }),

  // Favourites
  getFavourites: () => request('/favourites'),
  checkFavourite: (id) => request(`/favourites/check/${id}`),
  saveFavourite: (id) => request(`/favourites/${id}`, { method: 'POST' }),
  removeFavourite: (id) => request(`/favourites/${id}`, { method: 'DELETE' }),

  // Reviews
  createReview: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getUserReviews: (userId) => request(`/reviews/user/${userId}`),
  reportReview: (id) => request(`/reviews/${id}/report`, { method: 'POST' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // Reports & Safety
  submitReport: (body) => request('/reports', { method: 'POST', body: JSON.stringify(body) }),
  blockUser: (userId) => request(`/reports/block/${userId}`, { method: 'POST' }),
  unblockUser: (userId) => request(`/reports/block/${userId}`, { method: 'DELETE' }),
  getBlockedUsers: () => request('/reports/blocked'),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminUsers: () => request('/admin/users'),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  getAdminListings: () => request('/admin/listings'),
  deleteAdminListing: (id) => request(`/admin/listings/${id}`, { method: 'DELETE' }),
  getAdminReports: () => request('/admin/reports'),
  updateReport: (id, body) => request(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getAdminReviews: () => request('/admin/reviews'),
  deleteAdminReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
  rotateRsaKey: (reason) => request('/admin/kmm/rotate-rsa', { method: 'POST', body: JSON.stringify({ reason }) }),
  rotateEccKey: (reason) => request('/admin/kmm/rotate-ecc', { method: 'POST', body: JSON.stringify({ reason }) }),
  getCategories: () => request('/admin/categories'),
  createCategory: (body) => request('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Cryptographic Registry
  getCryptoRegistry: () => request('/crypto/registry'),
  testCryptoDemo: (sampleText) => request('/crypto/test-demo', { method: 'POST', body: JSON.stringify({ sampleText }) }),
};
