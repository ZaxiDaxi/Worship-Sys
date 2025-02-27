import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';


const AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
});

// Request interceptor: attach the access token from localStorage (if available) to every request
AxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: if a 401 error occurs (token expired), try refreshing the token
AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check for 401 error and make sure we haven't retried this request already
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Request a new access token using the refresh token
          const response = await axios.post(`${baseUrl}auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = response.data.access;
          localStorage.setItem('accessToken', newAccessToken);

          // Update the default headers and the original request headers with the new token
          AxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          // Retry the original request with the new access token
          return AxiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token error:", refreshError);
          // Optionally, clear tokens and redirect the user to login if refresh fails
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default AxiosInstance;
