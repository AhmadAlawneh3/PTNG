
import api from './api';

export interface SimpleUser {
  email: string;
  employee_id: string;
  name: string;
}

export const userManagementService = {
  // Get all managers
  getAllManagers: async (): Promise<SimpleUser[]> => {
    try {
      const response = await api.get('/user/get-all-managers');
      return response.data;
    } catch (error) {
      console.error('Error fetching managers:', error);
      throw error;
    }
  },

  // Get all testers
  getAllTesters: async (): Promise<SimpleUser[]> => {
    try {
      const response = await api.get('/user/get-all-testers');
      return response.data;
    } catch (error) {
      console.error('Error fetching testers:', error);
      throw error;
    }
  }
};
