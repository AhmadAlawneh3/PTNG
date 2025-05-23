
import api from './api';

export interface PasswordResetResponse {
  message: string;
  reset_link?: string;
}

export interface AdminInitResponse {
  success: boolean;
  message: string;
  status?: string;
  error?: string;
}

export const authService = {
  // This matches the API spec POST /auth/login
  login: async (employee_id: string, password: string) => {
    const response = await api.post('/auth/login', { 
      employee_id, 
      password 
    });
    return response.data; // Returns { access_token, role }
  },
  
  // This matches the API spec POST /auth/logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // This matches the API spec POST /auth/request-password-reset
  requestPasswordReset: async (employee_id: string): Promise<PasswordResetResponse> => {
    const response = await api.post('/auth/request-password-reset', { employee_id });
    return response.data;
  },
  
  // This matches the API spec POST /auth/reset-password/{token}
  resetPassword: async (token: string, new_password: string): Promise<PasswordResetResponse> => {
    const response = await api.post(`/auth/reset-password/${token}`, { new_password });
    return response.data;
  },

  // Function to check if admin exists - not in API spec but needed for frontend
  checkAdminExists: async (): Promise<boolean> => {
    try {
      const response = await api.get('/auth/check-admin-exists');
      return response.data.adminExists;
    } catch (error) {
      // If endpoint doesn't exist or any error occurs, assume no admin
      return false;
    }
  },

  // Function to initialize the first admin user
  initializeAdminUser: async (adminData: any): Promise<AdminInitResponse> => {
    try {
      // Map the UserFormValues to the expected API format
      const payload = {
        employee_id: adminData.username, // Use username as employee_id
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        role: adminData.role
      };
      
      const response = await api.post('/auth/initialize-admin', payload);
      
      return { 
        success: true, 
        message: response.data.message || 'Admin user created successfully',
        status: response.data.status
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create admin user';
      const errorDetails = error.response?.data?.error || '';
      
      console.error('Admin initialization error:', error.response?.data || error);
      
      return { 
        success: false, 
        message: errorMessage,
        error: errorDetails
      };
    }
  },

  // Function to create a test admin user for development/testing purposes
  createTestAdminUser: async (): Promise<AdminInitResponse> => {
    try {
      const testAdmin = {
        employee_id: '1',
        name: 'Test Admin',
        email: 'admin@example.com',
        password: '1',
        role: 'Admin'
      };
      
      const response = await api.post('/auth/initialize-admin', testAdmin);
      
      return { 
        success: true, 
        message: 'Test admin user created successfully',
        status: response.data.status
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create test admin user';
      const errorDetails = error.response?.data?.error || '';
      
      console.error('Test admin creation error:', error.response?.data || error);
      
      return { 
        success: false, 
        message: errorMessage,
        error: errorDetails
      };
    }
  }
};
