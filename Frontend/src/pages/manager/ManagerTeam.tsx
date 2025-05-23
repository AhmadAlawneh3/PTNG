
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { userManagementService } from '@/services/userManagementService';
import { Badge } from '@/components/ui/badge';

const ManagerTeam = () => {
  const { user } = useAuth();
  
  // Use React Query to fetch testers
  const { data: testers = [], isLoading: isLoadingTesters } = useQuery({
    queryKey: ['testers'],
    queryFn: async () => {
      try {
        const response = await userManagementService.getAllTesters();
        return response;
      } catch (error) {
        console.error('Failed to fetch testers:', error);
        toast.error('Failed to load team data', {
          description: 'There was an error loading your team members. Please try again later.'
        });
        return [];
      }
    },
  });

  // Use React Query for fetching projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['team-projects', user?.employee_id],
    queryFn: async () => {
      try {
        const response = await api.get(`/project/get-projects`);
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch project data:', error);
        toast.error('Failed to load project data', {
          description: 'There was an error loading your projects. Please try again later.'
        });
        return [];
      }
    },
  });

  // Process the data to show testers with their assigned projects
  const teamMembersWithProjects = testers.map(tester => {
    // Find all projects this tester is assigned to
    const assignedProjects = projects.filter(project => 
      project.members && project.members.some(member => 
        member.employee_id === tester.employee_id
      )
    );
    
    return {
      ...tester,
      projects: assignedProjects
    };
  });

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-panel border-primary/30 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Team Management</CardTitle>
            <CardDescription className="text-white/70">
              Manage team members and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTesters || isLoadingProjects ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : teamMembersWithProjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Employee</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Assigned Projects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembersWithProjects.map((tester) => (
                    <TableRow key={tester.employee_id}>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {tester.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{tester.email}</TableCell>
                      <TableCell>
                        {tester.projects && tester.projects.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {tester.projects.map(project => (
                              <li key={project.id} className="text-sm mb-1 text-white">
                                {project.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-white/50 text-sm">No projects assigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-4 text-white/70">
                No team members found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManagerTeam;
