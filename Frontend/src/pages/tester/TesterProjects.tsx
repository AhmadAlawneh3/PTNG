
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/services/api';
import { Project } from '@/types/project';
import ProjectDetailsDialog from '@/components/projects/ProjectDetailsDialog';

const TesterProjects = () => {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Fetch user's assigned projects
  const { data: projects = [], isLoading } = useQuery({
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

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
      case 'not started':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleViewDetails = (projectId: string | number) => {
    setSelectedProject(projectId);
    setIsDetailsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-primary">Your Projects</h1>
          <p className="text-muted-foreground mt-2">View and manage all your assigned testing projects.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: Project) => (
              <Card 
                key={project.id} 
                className="overflow-hidden bg-card border-border/40 shadow-subtle hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold text-foreground">{project.name}</CardTitle>
                    <Badge className={`${getStatusColor(project.status)} px-2 py-1 rounded-full text-xs`}>
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-muted-foreground mt-1">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'Not specified'} 
                        {project.end_date ? ` - ${format(new Date(project.end_date), 'MMM d, yyyy')}` : ''}
                      </span>
                    </div>
                    {project.manager_name && (
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Manager: {project.manager_name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-end">
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-primary hover:bg-primary/10 p-0"
                    onClick={() => handleViewDetails(project.id)}
                  >
                    View details <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/30 border-border/40 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">No projects assigned</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You don't have any projects assigned to you yet. New projects will appear here once they are assigned.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Project Details Dialog */}
      <ProjectDetailsDialog
        projectId={selectedProject}
        open={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
      />
    </DashboardLayout>
  );
};

export default TesterProjects;
