const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

// Check if error is auth-related
const isAuthError = (status: number) => {
  return status === 401 || status === 403;
};

// Main API client
export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: "include", // Important for CORS with credentials
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle auth errors globally
    if (isAuthError(response.status)) {
      localStorage.removeItem("auth_token");
    //   window.location.hre    f = "/";
      throw new Error("Authentication required. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Request failed (${response.status})`);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors
    if (error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection and ensure the server is running.");
    }
    throw error;
  }
};

// Convenience methods
export const api = {
  get: (endpoint: string) => apiClient(endpoint, { method: "GET" }),
  
  post: (endpoint: string, data?: any) => 
    apiClient(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  put: (endpoint: string, data?: any) => 
    apiClient(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (endpoint: string) => apiClient(endpoint, { method: "DELETE" }),
};