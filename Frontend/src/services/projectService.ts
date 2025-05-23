
import api from './api';
import { ApiProject, Project, ProjectFormValues } from '@/types/project';

export const projectService = {
  // Get all projects
  getAllProjects: async () => {
    try {
      const response = await api.get('/admin/project/get-all-projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Get project by ID
  getProjectById: async (projectId: string | number) => {
    try {
      const response = await api.get(`/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw error;
    }
  },

  // Create new project
  createProject: async (projectData: ProjectFormValues) => {
    try {
      const payload = {
        project_name: projectData.name,
        description: projectData.description,
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        scope: projectData.scope,
        manager: projectData.managerId, // Sending managerId as manager to backend
      };
      
      const response = await api.post('/project/create-project', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Update project
  updateProject: async (projectId: string | number, projectData: Partial<ProjectFormValues>) => {
    try {
      const payload: Record<string, any> = {};
      
      if (projectData.name) payload.project_name = projectData.name;
      if (projectData.description) payload.description = projectData.description;
      if (projectData.status) payload.status = projectData.status;
      if (projectData.start_date) payload.start_date = projectData.start_date;
      if (projectData.end_date) payload.end_date = projectData.end_date;
      if (projectData.scope) payload.scope = projectData.scope;
      
      const response = await api.put(`/project/update-project/${projectId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating project ${projectId}:`, error);
      throw error;
    }
  },

  adminupdateProject: async (projectId: string | number, projectData: Partial<ProjectFormValues>) => {
    try {
      const payload: Record<string, any> = {};
      
      if (projectData.name) payload.project_name = projectData.name;
      if (projectData.description) payload.description = projectData.description;
      if (projectData.status) payload.status = projectData.status;
      if (projectData.start_date) payload.start_date = projectData.start_date;
      if (projectData.end_date) payload.end_date = projectData.end_date;
      if (projectData.scope) payload.scope = projectData.scope;
      if (projectData.managerId) payload.manager = projectData.managerId;
      
      const response = await api.put(`/admin/project/update-project/${projectId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating project ${projectId}:`, error);
      throw error;
    }
  },
  

  // Archive project
  archiveProject: async (projectId: string | number) => {
    try {
      const response = await api.post(`/project/archive-project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error archiving project ${projectId}:`, error);
      throw error;
    }
  },

  // Assign user to project
  assignUserToProject: async (projectId: number, employeeId: number) => {
    try {
      const payload = {
        project_id: projectId,
        employee_id: employeeId
      };
      
      const response = await api.post('/project/assign-project', payload);
      return response.data;
    } catch (error) {
      console.error(`Error assigning user to project:`, error);
      throw error;
    }
  },

  // Remove user from project
  removeUserFromProject: async (projectId: number, employeeId: number) => {
    try {
      const payload = {
        project_id: projectId,
        employee_id: employeeId
      };
      
      const response = await api.post('/project/remove-assignment', payload);
      return response.data;
    } catch (error) {
      console.error(`Error removing user from project:`, error);
      throw error;
    }
  },
  
  // Get all projects for manager
  getManagerProjects: async () => {
    try {
      const response = await api.get('/project/get-projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching manager projects:', error);
      throw error;
    }
  }
};
