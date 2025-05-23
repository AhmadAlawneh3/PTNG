
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Monitor, ArrowRight } from 'lucide-react';
import { vmService, VMStatus } from '@/services/vmService';
import ChatPanel from '@/components/chat/ChatPanel';

const TesterDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch user's assigned projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['tester-projects', user?.employee_id],
    queryFn: async () => {
      try {
        const response = await api.get(`/project/get-projects`);
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Failed to load assigned projects');
        return [];
      }
    }
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
      <Card className="dark-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Welcome, {user?.name}</CardTitle>
          <CardDescription className="text-muted-foreground">
            Access your testing resources and assigned projects from this dashboard.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Content - Left Side (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Virtual Desktop Access */}
          <Card className="dark-card border-border hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-foreground flex items-center">
                <Monitor className="mr-2 text-primary" size={20} />
                Virtual Desktop Access
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Access your secure testing environments
              </CardDescription>
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
                onClick={() => navigate('/dashboard/tester/desktop')}
              >
                Manage Virtual Desktops
              </Button>
            </CardContent>
          </Card>
          
          {/* Assigned Projects Preview */}
          <Card className="dark-card border-border hover:border-accent/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-foreground">Projects</CardTitle>
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/dashboard/tester/projects')}
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-muted-foreground">
                Projects assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-muted-foreground border-t-primary rounded-full"></div>
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="border border-border rounded-md p-3 bg-card">
                      <h4 className="text-foreground font-medium">{project.name}</h4>
                      <div className="flex justify-between text-sm mt-1">
                        <span className={
                          project.status === 'In Progress' 
                            ? 'text-blue-500' 
                            : project.status === 'Pending' 
                              ? 'text-yellow-500' 
                              : 'text-green-500'
                        }>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2 mt-1">{project.description}</p>
                    </div>
                  ))}
                  
                  {projects.length > 3 && (
                    <div className="text-center text-muted-foreground text-sm">
                      +{projects.length - 3} more projects
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No projects assigned to you yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Chat Panel - Right Side (2 columns) */}
        <div className="lg:col-span-2">
          <div className="h-[600px]">
            <ChatPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TesterDashboard;
