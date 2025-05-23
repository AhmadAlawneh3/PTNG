
export interface Project {
  id: string | number;
  name: string;
  status: string;
  description: string;
  start_date?: string;
  end_date?: string;
  scope?: string;
  manager?: string; // Manager name
  managerId?: string | number; // Manager ID
  manager_name?: string; // Adding manager_name field
  members?: ProjectMember[]; // Adding members field
  archived?: boolean; // Adding archived field
}

export interface ProjectMember {
  employee_id: number;
  name: string;
}

export interface ApiProject {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string | null;
  scope: string;
  manager?: string;
  manager_name?: string; // Adding manager_name field
  members?: ProjectMember[]; // Adding members field
  archived?: boolean; // Adding archived field
}

export interface ProjectFormValues {
  name: string;
  description: string;
  status?: string;
  start_date: string;
  end_date: string;
  scope?: string;
  managerId?: string | number; // Use managerId consistently
}

export interface ProjectAssignment {
  project_id: number;
  employee_id: number;
}
