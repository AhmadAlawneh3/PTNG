
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Monitor, Users } from 'lucide-react';
import { userManagementService } from '@/services/userManagementService';
import { vmService, VMStatus } from '@/services/vmService';
import ChatPanel from '@/components/chat/ChatPanel';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch projects assigned to the manager
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['manager-projects', user?.employee_id],
    queryFn: async () => {
      try {
        const response = await api.get(`/project/get-projects`);
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Failed to load projects data');
        return [];
      }
    },
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: isLoadingTeam } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      try {
        const response = await userManagementService.getAllTesters();
        return response || [];
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        toast.error('Failed to load team data');
        return [];
      }
    },
  });

    // Fetch VM status
    const { data: vmStatus, isLoading: isLoadingVmStatus } = useQuery({
      queryKey: ['vm-status', user?.employee_id],
      queryFn: async () => {
        try {
          return await vmService.getVMStatus();
        } catch (error) {
          console.error('Failed to fetch VM status:', error);
          toast.error('Failed to load VM status');
          return { windows: 'Stopped', linux: 'Stopped' };
        }
      }
    });

  return (
    <DashboardLayout>
      {/* Welcome Card */}
      <Card className="border-border/40 mb-6 bg-card shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Manager Dashboard</CardTitle>
          <CardDescription className="text-muted-foreground">
            Welcome back, {user?.name}. Manage your team and projects.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Team Summary */}
        <Card className="border-border/40 bg-card shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-foreground flex items-center">
              <Users className="mr-2 text-primary" size={20} />
              Team Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTeam ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground mb-2">
                  {teamMembers.length} <span className="text-muted-foreground text-lg">Testers</span>
                </div>
                <div className="space-y-4 mt-4">
                  {teamMembers.slice(0, 3).map((member) => (
                    <div key={member.employee_id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-foreground">
                          {member.name.charAt(0)}
                        </div>
                        <span className="ml-3 text-foreground">{member.name}</span>
                      </div>
                    </div>
                  ))}
                  {teamMembers.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-primary hover:text-primary/80"
                      onClick={() => navigate('/dashboard/manager/team')}
                    >
                      View All Team Members
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Projects Summary */}
        <Card className="border-border/40 bg-card shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-foreground flex items-center">
              <svg className="mr-2 text-primary" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3V19H21V21H3V3H5Z" fill="currentColor"/>
                <path d="M19.1 8.7L14.7 13.1L12.1 10.5L9 13.6L7.6 12.2L12.1 7.7L14.7 10.3L17.7 7.3L16.3 5.9L19.8 6.2L19.5 9.7L18.1 8.3L18.1 8.7L19.1 8.7Z" fill="currentColor"/>
              </svg>
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground mb-2">
                  {projects.filter((project) => project.status.toLowerCase() === 'in progress').length} <span className="text-muted-foreground text-lg">Active Projects</span>
                </div>
                <div className="space-y-4 mt-4">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-foreground">
                          {project.name.charAt(0)}
                        </div>
                        <span className="ml-3 text-foreground">{project.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status.toLowerCase() === 'in progress' ? 'bg-blue-500/20 text-blue-400' : 
                        project.status.toLowerCase() === 'complete' ? 'bg-green-500/20 text-green-400' : 
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  ))}
                  {projects.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-primary hover:text-primary/80"
                      onClick={() => navigate('/dashboard/manager/projects')}
                    >
                      View All Projects
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* VM Status - Only showing manager's own VMs */}
        <Card className="border-border/40 bg-card shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-foreground flex items-center">
              <Monitor className="mr-2 text-primary" size={20} />
              Virtual Desktop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Windows VM */}
                            <div className="border border-border rounded-md p-4 bg-card">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-foreground font-medium">Windows VM</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Status: {' '}
                                    <span className={
                                      isLoadingVmStatus ? "text-yellow-500" :
                                      vmStatus?.windows?.toLowerCase() === 'running' ? "text-green-500" : 
                                      "text-yellow-500"
                                    }>
                                      {isLoadingVmStatus ? 'Checking...' : vmStatus?.windows || 'Not Available'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Linux VM */}
                            <div className="border border-border rounded-md p-4 bg-card">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-foreground font-medium">Linux VM</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Status: {' '}
                                    <span className={
                                      isLoadingVmStatus ? "text-yellow-500" :
                                      vmStatus?.linux?.toLowerCase() === 'running' ? "text-green-500" : 
                                      "text-yellow-500"
                                    }>
                                      {isLoadingVmStatus ? 'Checking...' : vmStatus?.linux || 'Not Available'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => navigate('/dashboard/manager/desktop')}
                          >
                            Manage Virtual Desktops
                          </Button>
          </CardContent>
        </Card>
      </div>

      {/* Chat Panel */}
      <Card className="border-border/40 bg-card shadow-md mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-foreground">Project Chat</CardTitle>
          <CardDescription className="text-muted-foreground">
            Communicate with your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ChatPanel />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
