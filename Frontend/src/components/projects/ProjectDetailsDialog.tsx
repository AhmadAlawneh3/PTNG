
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@/types/project';
import { projectService } from '@/services/projectService';
import { format } from 'date-fns';
import { CalendarIcon, UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '../ui/card';

interface ProjectDetailsDialogProps {
  projectId: string | number | null;
  open: boolean;
  onClose: () => void;
}

const ProjectDetailsDialog = ({ projectId, open, onClose }: ProjectDetailsDialogProps) => {
  // Fetch project details
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project-details', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      try {
        const projectData = await projectService.getProjectById(projectId);
        return projectData as Project;
      } catch (error) {
        console.error('Error fetching project details:', error);
        toast.error('Failed to load project details');
        throw error;
      }
    },
    enabled: open && !!projectId,
  });

  // Helper function to get status color
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary/80">Project Details</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            View detailed information about this project.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-md text-center">
            <p className="text-destructive font-medium">Error loading project details</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : project ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary/80">{project.name}</h2>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>
            
            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon size={16} className="mr-2" />
                  <span>
                    {project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'Not specified'} 
                    {project.end_date ? ` - ${format(new Date(project.end_date), 'MMM d, yyyy')}` : ''}
                  </span>
                </div>
                
                {project.manager_name && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UserIcon size={16} className="mr-2" />
                    <span>Project Manager: {project.manager_name}</span>
                  </div>
                )}
              </div>
            </Card>
            
            <div>
              <h3 className="text-sm font-medium text-primary/80 mb-2">Description</h3>
              <div className="border rounded-md border-input p-3 bg-muted/30 text-muted-foreground">
                {project.description || "No description provided."}
              </div>
            </div>
            
            {project.scope && (
              <div>
                <h3 className="text-sm font-medium text-primary/80 mb-2">Project Scope</h3>
                <div className="border rounded-md border-input p-3 bg-muted/30 text-muted-foreground">
                  {project.scope}
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No project data available.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsDialog;
