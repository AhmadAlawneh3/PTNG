
export interface Employee {
  id: string;
  name: string;
  role: string;
  tasks: {
    id: string;
    title: string;
    status: 'In Progress' | 'Completed';
  }[];
}
