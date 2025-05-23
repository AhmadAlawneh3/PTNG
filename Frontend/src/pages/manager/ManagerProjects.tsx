import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChatPanel from '@/components/chat/ChatPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Filter,
  PlusCircle,
  Edit,
  Archive,
  UserPlus,
  Eye,
  UserMinus,
  Users,
  RefreshCcw,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/services/projectService';
import { Project, ProjectFormValues, ProjectMember } from '@/types/project';
import { SimpleUser, userManagementService } from '@/services/userManagementService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Form validation schema
const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  scope: z.string().min(3, "Scope must be at least 3 characters"),
  status: z.string().optional(),
});

// Project assignment schema
const assignmentSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
});

const ManagerProjects = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [teamListDialogOpen, setTeamListDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [archiveProjectId, setArchiveProjectId] = useState<string | number | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Project form
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scope: '',
      status: 'in progress',
    }
  });

  // Assignment form
  const assignForm = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      employeeId: '',
    }
  });

  // Fetch projects with React Query
  const { 
    data: projects = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['manager-projects', user?.employee_id],
    queryFn: async () => {
      try {
        const response = await projectService.getManagerProjects();
        return response || [];
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Failed to load projects', {
          description: 'There was an error loading your projects. Please try again later.'
        });
        return [];
      }
    }
  });

  // Fetch testers for the assignment dialog
  const { 
    data: testers = [],
    isLoading: isLoadingTesters
  } = useQuery({
    queryKey: ['testers'],
    queryFn: async () => {
      try {
        const response = await userManagementService.getAllTesters();
        return response || [];
      } catch (error) {
        console.error('Failed to fetch testers:', error);
        return [];
      }
    },
    enabled: assignDialogOpen
  });

  // Mutation for creating a new project
  const createProjectMutation = useMutation({
    mutationFn: (projectData: ProjectFormValues) => projectService.createProject(projectData),
    onSuccess: () => {
      toast.success('Project created', {
        description: 'New project has been created successfully.'
      });
      setCreateDialogOpen(false);
      projectForm.reset();
      queryClient.invalidateQueries({ queryKey: ['manager-projects'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create project';
      toast.error('Error', {
        description: errorMessage
      });
    }
  });

  // Mutation for updating a project
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number, data: ProjectFormValues }) => 
      projectService.updateProject(id, data),
    onSuccess: () => {
      toast.success('Project updated', {
        description: 'Project has been updated successfully.'
      });
      setEditDialogOpen(false);
      setSelectedProject(null);
      queryClient.invalidateQueries({ queryKey: ['manager-projects'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update project';
      toast.error('Error', {
        description: errorMessage
      });
    }
  });

  // Mutation for archiving a project
  const archiveProjectMutation = useMutation({
    mutationFn: (projectId: string | number) => projectService.archiveProject(projectId),
    onSuccess: () => {
      toast.success('Project archived', {
        description: 'Project has been archived successfully.'
      });
      setArchiveProjectId(null);
      queryClient.invalidateQueries({ queryKey: ['manager-projects'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to archive project';
      toast.error('Error', {
        description: errorMessage
      });
    }
  });

  // Mutation for assigning a user to a project
  const assignUserMutation = useMutation({
    mutationFn: ({ projectId, employeeId }: { projectId: number, employeeId: number }) => 
      projectService.assignUserToProject(projectId, employeeId),
    onSuccess: () => {
      toast.success('User assigned', {
        description: 'User has been assigned to the project successfully.'
      });
      setAssignDialogOpen(false);
      assignForm.reset();
      queryClient.invalidateQueries({ queryKey: ['manager-projects'] });
      // Also invalidate the specific project query if we're viewing the team list
      if (selectedProject?.id) {
        queryClient.invalidateQueries({ queryKey: ['project-team', selectedProject.id] });
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to assign user';
      toast.error('Error', {
        description: errorMessage
      });
    }
  });

  // Mutation for removing a user from a project
  const removeUserMutation = useMutation({
    mutationFn: ({ projectId, employeeId }: { projectId: number, employeeId: number }) => 
      projectService.removeUserFromProject(projectId, employeeId),
    onSuccess: () => {
      toast.success('User removed', {
        description: 'User has been removed from the project successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['manager-projects'] });
      // Also invalidate the specific project query if we're viewing the team list
      if (selectedProject?.id) {
        queryClient.invalidateQueries({ queryKey: ['project-team', selectedProject.id] });
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to remove user';
      toast.error('Error', {
        description: errorMessage
      });
    }
  });

  // Handle manual refresh of projects
  const handleRefresh = () => {
    refetch();
    toast.info('Refreshing projects...', {
      description: 'Project list is being updated.'
    });
  };

  // Fetch project team members - now using the members from project details
  const { data: projectDetails } = useQuery({
    queryKey: ['project-details', selectedProject?.id],
    queryFn: async () => {
      if (!selectedProject?.id) return null;
      try {
        return await projectService.getProjectById(selectedProject.id);
      } catch (error) {
        console.error('Failed to fetch project details:', error);
        return null;
      }
    },
    enabled: !!selectedProject?.id && teamListDialogOpen
  });

  const teamMembers = projectDetails?.members || [];

  const filteredProjects = projects.filter((project: Project) => 
    statusFilter === 'all' ? true : project.status === statusFilter
  );

  const handleCreateSubmit = (values: ProjectFormValues) => {
    createProjectMutation.mutate(values);
  };

  const handleEditSubmit = (values: ProjectFormValues) => {
    if (selectedProject?.id) {
      updateProjectMutation.mutate({ id: selectedProject.id, data: values });
    }
  };

  const handleAssignUser = (values: { employeeId: string }) => {
    if (selectedProject?.id) {
      assignUserMutation.mutate({ 
        projectId: Number(selectedProject.id), 
        employeeId: Number(values.employeeId) 
      });
    }
  };

  const handleRemoveUser = (employeeId: number) => {
    if (selectedProject?.id) {
      removeUserMutation.mutate({
        projectId: Number(selectedProject.id),
        employeeId
      });
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setViewDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    projectForm.reset({
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      scope: project.scope || '',
    });
    setEditDialogOpen(true);
  };

  const handleAssignDialog = (project: Project) => {
    setSelectedProject(project);
    assignForm.reset();
    setAssignDialogOpen(true);
  };

  const handleTeamListDialog = (project: Project) => {
    setSelectedProject(project);
    setTeamListDialogOpen(true);
  };

  const handleArchiveProject = () => {
    if (archiveProjectId) {
      archiveProjectMutation.mutate(archiveProjectId);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'in progress') return 'bg-blue-500/20 text-blue-400';
    if (statusLower === 'complete') return 'bg-green-500/20 text-green-400';
    if (statusLower === 'not started') return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-card shadow-md mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-foreground">Projects Overview</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage and monitor all active projects
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleRefresh}
                        disabled={isLoading}
                      >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh projects</p>
                    </TooltipContent>
                  </Tooltip>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="in progress">In Progress</SelectItem>
                      <SelectItem value="not started">Not Started</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        New Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                          Fill in the details to create a new project
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...projectForm}>
                        <form onSubmit={projectForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                          <FormField
                            control={projectForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter project name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={projectForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Project description" 
                                    className="min-h-[100px]" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={projectForm.control}
                              name="start_date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={projectForm.control}
                              name="end_date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={projectForm.control}
                            name="scope"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Scope</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Project scope" 
                                    className="min-h-[80px]" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              disabled={createProjectMutation.isPending}
                            >
                              {createProjectMutation.isPending && (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                              )}
                              Create Project
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredProjects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">{project.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">{project.description.substring(0, 50)}...</div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(project.status)}`}>
                              {project.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-foreground">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewProject(project)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View project details</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditProject(project)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit project</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleAssignDialog(project)}
                                  >
                                    <UserPlus className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Assign user to project</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost"
                                    size="sm" 
                                    onClick={() => handleTeamListDialog(project)}
                                  >
                                    <Users className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View team members</p>
                                </TooltipContent>
                              </Tooltip>

                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setArchiveProjectId(project.id)}
                                      >
                                        <Archive className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Archive project</p>
                                  </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Archive Project</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to archive this project? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setArchiveProjectId(null)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={handleArchiveProject}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {archiveProjectMutation.isPending && (
                                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                                      )}
                                      Archive
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No projects found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="h-[calc(100vh-8rem)] sticky top-24">
            <ChatPanel />
          </div>
        </div>

        {/* View Project Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Project Details</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Name</h3>
                  <p className="mt-1">{selectedProject.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="mt-1">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Start Date</h3>
                    <p className="mt-1">{selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">End Date</h3>
                    <p className="mt-1">{selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <p className="mt-1">{selectedProject.status}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Scope</h3>
                  <p className="mt-1">{selectedProject.scope || 'Not specified'}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the details of this project
              </DialogDescription>
            </DialogHeader>
            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={projectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Project description" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={projectForm.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={projectForm.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={projectForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not started">Not Started</SelectItem>
                          <SelectItem value="in progress">In Progress</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectForm.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scope</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Project scope" 
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateProjectMutation.isPending}
                  >
                    {updateProjectMutation.isPending && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Assign User Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Assign User to Project</DialogTitle>
              <DialogDescription>
                Select a tester to add to this project
              </DialogDescription>
            </DialogHeader>
            <Form {...assignForm}>
              <form onSubmit={assignForm.handleSubmit(handleAssignUser)} className="space-y-4">
                <FormField
                  control={assignForm.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tester</FormLabel>
                      <FormControl>
                        {isLoadingTesters ? (
                          <div className="flex items-center justify-center p-2">
                            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                          </div>
                        ) : testers.length > 0 ? (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tester" />
                            </SelectTrigger>
                            <SelectContent>
                              {testers.map((tester: SimpleUser) => (
                                <SelectItem 
                                  key={tester.employee_id} 
                                  value={tester.employee_id}
                                >
                                  {tester.name} (ID: {tester.employee_id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No testers available. Try refreshing.
                          </div>
                        )}
                      </FormControl>
                      <FormDescription>
                        {testers.length > 0 && "Select a tester from the list to assign to this project."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={assignUserMutation.isPending || testers.length === 0}
                  >
                    {assignUserMutation.isPending && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                    )}
                    Assign User
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Team List Dialog */}
        <Dialog open={teamListDialogOpen} onOpenChange={setTeamListDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Project Team</DialogTitle>
              <DialogDescription>
                Members assigned to this project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!projectDetails ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent"></div>
                </div>
              ) : teamMembers.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member: ProjectMember) => (
                        <TableRow key={member.employee_id}>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.employee_id}</TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveUser(member.employee_id)}
                                  disabled={removeUserMutation.isPending}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove from project</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No team members found for this project
                </div>
              )}
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleAssignDialog(selectedProject!)}
                  className="bg-warm-300 hover:bg-warm-400"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default ManagerProjects;
