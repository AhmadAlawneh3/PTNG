
import axios from 'axios';
import { toast } from '@/components/ui/sonner';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ptng_token');
  if (token) {
    
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    
  }
  return config;
});

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    
    return response;
  },
  (error) => {
    // Handle common errors
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with an error status
      const status = error.response.status;
      const url = error.config?.url || 'unknown endpoint';
      
      console.error(`API Error ${status} from ${url}:`, error.response.data);
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        
        localStorage.removeItem('ptng_token');
        localStorage.removeItem('ptng_user');
        
        // Only show toast if we're not on the login page
        if (!window.location.pathname.includes('login')) {
          toast.error("Session Expired", { 
            description: "Your session has expired. Please log in again."
          });
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } 
      else if (status === 403) {
        toast.error("Access Denied", { 
          description: "You don't have permission to access this resource."
        });
      }
      else if (status === 404) {
        console.error(`Resource not found: ${url}`);
        // Not found - don't show toast, let the component handle it
      }
      else if (status === 500) {
        toast.error("Server Error", { 
          description: "Something went wrong on the server. Please try again later."
        });
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error - no response received:', error.request);
      toast.error("Network Error", { 
        description: "Unable to connect to the server. Please check your internet connection."
      });
    } else {
      // Something else happened
      console.error('Request error:', error.message);
      toast.error("Request Error", { 
        description: "An error occurred while processing your request."
      });
    }
    
    // Pass the error along to the component
    return Promise.reject(error);
  }
);

export default api;
