const BASE_URL = '/api';

export const getAuthToken = () => {
  return localStorage.getItem('smart_school_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('smart_school_token', token);
  } else {
    localStorage.removeItem('smart_school_token');
  }
};

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    // Session expired
    setAuthToken(null);
    localStorage.removeItem('smart_school_user');
    window.location.href = '/login?expired=1';
    throw new Error('Session expired. Please log in again.');
  }

  // Handle CSV and file downloads
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const text = await response.text();
    return text;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred during the request.');
    error.status = response.status;
    error.errors = data.errors;
    error.code = data.code;
    throw error;
  }

  return data;
}

export const api = {
  get: (url, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    return request(queryString ? `${url}?${queryString}` : url, { method: 'GET' });
  },

  post: (url, body = {}) => {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put: (url, body = {}) => {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patch: (url, body = {}) => {
    return request(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete: (url) => {
    return request(url, { method: 'DELETE' });
  },
};
