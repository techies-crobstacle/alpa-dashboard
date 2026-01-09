const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com";

// Get auth token from localStorage (check both keys for compatibility)
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("alpa_token") || localStorage.getItem("auth_token");
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
  
  // Only set Content-Type if there is a body AND it's not FormData
  const hasBody = !!options.body;
  const isFormData = options.body instanceof FormData;
  
  const config: RequestInit = {
    ...options,
    headers: {
      // Only set JSON Content-Type if body exists and is not FormData
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
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
  } catch (error) {
    const err = error as Error;
    // Handle network errors
    if (err.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection and ensure the server is running.");
    }
    throw err;
  }
};

// Convenience methods
export const api = {
  get: (endpoint: string) => apiClient(endpoint, { method: "GET" }),
  post: <T = unknown>(endpoint: string, data?: T) => 
    apiClient(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: <T = unknown>(endpoint: string, data?: T, options?: { headers?: Record<string, string> }) => {
    const isFormData = data instanceof FormData;
    const requestOptions: RequestInit = {
      method: "PUT",
      body: isFormData ? data as FormData : JSON.stringify(data),
    };
    
    // Only add headers if it's not FormData (let browser set Content-Type for FormData)
    if (!isFormData || options?.headers) {
      requestOptions.headers = options?.headers;
    }
    
    return apiClient(endpoint, requestOptions);
  },
  patch: <T = unknown>(endpoint: string, data?: T) => 
    apiClient(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) => apiClient(endpoint, { method: "DELETE" }),
};