
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { authService } from '@/services/authService';
import api from '@/services/api';
import { UserRole } from '@/types/user';

// Define types for our auth context
type User = {
  employee_id: string;
  name: string;
  email: string;
  role: UserRole;
  profile_picture?: string;
  status?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (employee_id: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('ptng_user');
    const storedToken = localStorage.getItem('ptng_token');

    
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        
        // Ensure the role is properly formatted
        if (parsedUser && parsedUser.role) {
          // Normalize role case - ensure first letter is uppercase and rest is lowercase
          const normalizedRole = parsedUser.role.charAt(0).toUpperCase() + parsedUser.role.slice(1).toLowerCase();
          parsedUser.role = normalizedRole;
          
        }
        
        setUser(parsedUser);
        setToken(storedToken);
        
        // Validate token by fetching user profile
        fetchUserProfile(storedToken).catch((error) => {
          // If token is invalid, clear storage and state
          console.error('Token validation failed:', error);
          clearAuthState();
        });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearAuthState();
        setIsLoading(false);
      }
    } else {
      
      setIsLoading(false);
    }
  }, []);
  
  // Helper to fetch user profile with token
  const fetchUserProfile = async (authToken: string) => {
    try {
      
      const response = await api.get('/user/get-profile', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      
      // Verify the response has the expected structure
      if (!response.data || !response.data.role) {
        console.error('Invalid user profile data received:', response.data);
        throw new Error('Invalid user profile data');
      }
      
      // Normalize role case
      const userData = { ...response.data };
      if (userData.role) {
        // Ensure consistent role format (e.g., 'Admin', 'Employee', 'Manager')
        userData.role = userData.role.charAt(0).toUpperCase() + userData.role.slice(1).toLowerCase();
      }
      
      
      setUser(userData);
      localStorage.setItem('ptng_user', JSON.stringify(userData));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsLoading(false);
      throw new Error('Invalid token');
    }
  };

  // Login function - updated to use authService
  const login = async (employee_id: string, password: string) => {
    setIsLoading(true);
    
    try {
      
      const response = await authService.login(employee_id, password);
      
      
      
      if (!response || !response.access_token) {
        throw new Error('No access token received');
      }
      
      const { access_token, role } = response;
      console.log('Login successful, received token and role:', { 
        tokenExists: !!access_token, 
        tokenLength: access_token ? access_token.length : 0,
        role 
      });
      
      if (!role) {
        console.error('Role is missing in the login response');
        throw new Error('Invalid login response: role is missing');
      }
      
      // Normalize role case
      const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
      
      
      // Save token
      setToken(access_token);
      localStorage.setItem('ptng_token', access_token);
      
      // Fetch user details with the token
      await fetchUserProfile(access_token);
      
      // Show success toast
      toast("Login Successful", {
        description: `Welcome back!`,
      });
      
      // Log before navigation
      
      
      // Redirect based on normalized user role
      navigate(`/dashboard/${normalizedRole.toLowerCase()}`);
      
      // Log after navigation attempt
      
      
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error("Login Failed", {
        description: error.response?.data?.message || error.message || "Invalid credentials",
      });
      setIsLoading(false);
    }
  };

  // Logout function - updated to use authService
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Call the logout API endpoint
      await authService.logout();
    } catch (error) {
      // Even if the API call fails, proceed with local logout
      console.error("Error during logout:", error);
    } finally {
      // Clear state and storage regardless of API response
      clearAuthState();
      setIsLoading(false);
      
      toast("Logged Out", {
        description: "You have been successfully logged out.",
      });
      
      navigate('/login');
    }
  };
  
  // Helper to clear auth state
  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ptng_user');
    localStorage.removeItem('ptng_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
