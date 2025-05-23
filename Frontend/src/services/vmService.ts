
import api from './api';

export interface VMResponse {
  message: string;
  URL?: string;
}

export interface VMStatus {
  linux: string;
  windows: string;
}

export interface VMInfo {
  id: number;
  employee_id: string;
  instance_id: string;
  instance_os: string;
  status: string;
  created_at: string;
  updated_at: string;
  guacamole_url: string;
  user_name: string;
  user_email: string;
}

export interface AllVMsResponse {
  vms: VMInfo[];
}

export interface UserVM {
  instance_id: string;
  instance_os: string;
  guacamole_url: string | null;
  status: string;
}

export interface UserVMsResponse {
  vms: UserVM[];
}

export const vmService = {
  // Get all VMs for admin view
  getAllVMs: async (): Promise<AllVMsResponse> => {
    const response = await api.get('/admin/vm/get-all-vms');
    return response.data;
  },

  // Get VMs for the current user
  getUserVMs: async (): Promise<UserVMsResponse> => {
    const response = await api.get('/vm/get-vms');
    return response.data;
  },

  // This matches the API spec POST /vm/get-status and POST /admin/vm/vm-status
  getVMStatus: async (employeeId?: string): Promise<VMStatus> => {
    if (employeeId) {
      // Admin getting VM status for a specific user
      const formData = new FormData();
      formData.append('employee_id', employeeId);
      const response = await api.post('/admin/vm/vm-status', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } else {
      // User getting their own VM status
      const response = await api.post('/vm/get-status', {}, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    }
  },

  // This matches the API spec POST /vm/start-vm and POST /admin/vm/start-vm
  startVM: async (instanceOs: string, employeeId?: string): Promise<VMResponse> => {
    const formData = new FormData();
    formData.append('instance_os', instanceOs);
    
    if (employeeId) {
      // Admin starting VM for a specific user
      formData.append('employee_id', employeeId);
      const response = await api.post('/admin/vm/start-vm', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } else {
      // User starting their own VM
      const response = await api.post('/vm/start-vm', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    }
  },

  // This matches the API spec POST /vm/stop-vm and POST /admin/vm/stop-vm
  stopVM: async (instanceOs: string, employeeId?: string): Promise<VMResponse> => {
    const formData = new FormData();
    formData.append('instance_os', instanceOs);
    
    if (employeeId) {
      // Admin stopping VM for a specific user
      formData.append('employee_id', employeeId);
      const response = await api.post('/admin/vm/stop-vm', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } else {
      // User stopping their own VM
      const response = await api.post('/vm/stop-vm', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    }
  },

  // This matches the API spec POST /vm/restart-vm and POST /admin/vm/restart-vm
  restartVM: async (instanceOs: string, employeeId?: string): Promise<VMResponse> => {
    const formData = new FormData();
    formData.append('instance_os', instanceOs);
    
    if (employeeId) {
      // Admin restarting VM for a specific user
      formData.append('employee_id', employeeId);
      const response = await api.post('/admin/vm/restart-vm', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } else {
      // User restarting their own VM
      const response = await api.post('/vm/restart-vm', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    }
  }
};
