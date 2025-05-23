import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from '@/components/ui/sonner';
import { 
  Users, Monitor, Activity, MessageCircle,
  UserPlus, FolderOpen, RefreshCw, PieChart, CheckCircle, AlertCircle, Clock
} from 'lucide-react';

// User Type
type User = {
  id: string;
  name: string;
  role: string;
  status: string;
  email: string;
  lastLogin: string;
  employee_id?: string;
};

// VM Type
type VirtualMachine = {
  id: string;
  user_name: string;
  instance_os: string;
  status: string;
  user_email: string;
};

// Project Type
type Project = {
  id: string;
  name: string;
  status: string;
  manager: string;
  teamSize: number;
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeUserTab, setActiveUserTab] = useState('active');
  
  // Use React Query for data fetching
  const { 
    data: usersData = { active: [], inactive: [] }, 
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/user/get-all-users');
        
        
        let usersArray = [];
        
        // Handle different response formats
        if (response.data && Array.isArray(response.data)) {
          // Direct array response
          usersArray = response.data;
        } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
          // Wrapped in users object
          usersArray = response.data.users;
        } else {
          console.error('Unexpected API response format:', response.data);
          return { active: [], inactive: [] };
        }
        
        // Transform API data to required format
        const activeUsers = usersArray
          .filter((user: any) => user.status && user.status.toLowerCase() === 'active')
          .map((user: any) => ({
            id: user.id || user.employee_id,
            name: user.name,
            role: user.role,
            status: user.status,
            email: user.email,
            lastLogin: user.last_login || 'Never',
            employee_id: user.employee_id
          }));
        
        const inactiveUsers = usersArray
          .filter((user: any) => !user.status || user.status.toLowerCase() !== 'active')
          .map((user: any) => ({
            id: user.id || user.employee_id,
            name: user.name,
            role: user.role,
            status: user.status || 'Inactive',
            email: user.email,
            lastLogin: user.last_login || 'Never',
            employee_id: user.employee_id
          }));
        
        return { active: activeUsers, inactive: inactiveUsers };
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users data",
          variant: "destructive",
        });
        return { active: [], inactive: [] };
      }
    },
  });
  
  const { 
    data: vmsData = [],
    isLoading: isLoadingVMs,
    refetch: refetchVMs
  } = useQuery({
    queryKey: ['dashboard-vms'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/vm/get-all-vms');
        
        // Transform API data to required format
        return response.data.vms.map((vm: any) => ({
          id: vm.instance_id || vm.id,
          user_name: vm.user_name,
          instance_os: vm.instance_os,
          status: vm.status,
          user_email: vm.user_email
        }));
      } catch (error) {
        console.error('Error fetching VMs:', error);
        toast({
          title: "Error",
          description: "Failed to load virtual machine data",
          variant: "destructive",
        });
        return [];
      }
    },
  });
  
  const { 
    data: projectsData = [],
    isLoading: isLoadingProjects,
    refetch: refetchProjects
  } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/project/get-all-projects');
        
        
        let projectsArray = [];
        
        // Handle different response formats
        if (response.data && Array.isArray(response.data)) {
          projectsArray = response.data;
        } else if (response.data && response.data.projects && Array.isArray(response.data.projects)) {
          projectsArray = response.data.projects;
        } else {
          console.error('Unexpected API response format for projects:', response.data);
          return [];
        }
        
        // Transform API data to required format
        return projectsArray.map((project: any) => ({
          id: project.id,
          name: project.name,
          status: project.status,
          manager: project.manager_name,
          teamSize: project.team_size || (project.team_members ? project.team_members.length : 0)
        }));
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const handleAddUser = () => {
    navigate('/dashboard/admin/users/new');
  };
  
  // Refresh all data
  const refreshAllData = () => {
    refetchUsers();
    refetchVMs();
    refetchProjects();
    toast({
      title: "Refreshed",
      description: "Dashboard data has been updated",
    });
  };
  
  // Calculate project statistics
  const projectStats = React.useMemo(() => {
    const active = projectsData.filter(p => p.status.toLowerCase() === 'in progress').length;
    const completed = projectsData.filter(p => p.status.toLowerCase() === 'complete').length;
    const onHoldOrIssues = projectsData.filter(p => 
      ['on hold', 'cancelled', 'issues'].includes(p.status.toLowerCase())
    ).length;
    const pending = projectsData.filter(p => p.status.toLowerCase() === 'not started').length;
    
    const total = projectsData.length;
    
    return {
      active,
      completed,
      onHoldOrIssues,
      pending,
      total,
      activePercent: total > 0 ? (active / total) * 100 : 0,
      completedPercent: total > 0 ? (completed / total) * 100 : 0,
      pendingPercent: total > 0 ? (pending / total) * 100 : 0
    };
  }, [projectsData]);
  
  return (
    <DashboardLayout>
      {/* Welcome Card */}
      <Card className="dark-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Admin Dashboard</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage users, virtual desktops, and projects
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Users Card */}
        <Card className="dark-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Users</p>
                {isLoadingUsers ? (
                  <Skeleton className="h-9 w-16 bg-primary/10" />
                ) : (
                  <h3 className="text-3xl font-bold text-primary mt-1">
                    {usersData.active.length + usersData.inactive.length}
                  </h3>
                )}
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline" 
                size="sm"
                className="w-full border-border hover:bg-muted"
                onClick={() => navigate('/dashboard/admin/users')}
              >
                View All Users
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Projects Card */}
        <Card className="dark-card border-border hover:border-accent/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Projects</p>
                {isLoadingProjects ? (
                  <Skeleton className="h-9 w-16 bg-accent/10" />
                ) : (
                  <h3 className="text-3xl font-bold text-accent mt-1">
                    {projectStats.active}
                  </h3>
                )}
              </div>
              <div className="bg-accent/10 p-3 rounded-full">
                <FolderOpen className="h-6 w-6 text-accent" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline" 
                size="sm"
                className="w-full border-border hover:bg-muted"
                onClick={() => navigate('/dashboard/admin/projects')}
              >
                View All Projects
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Virtual Desktops Card */}
        <Card className="dark-card border-border hover:border-destructive/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Running VMs</p>
                {isLoadingVMs ? (
                  <Skeleton className="h-9 w-16 bg-destructive/10" />
                ) : (
                  <h3 className="text-3xl font-bold text-destructive mt-1">
                    {vmsData.filter(vm => vm.status.toLowerCase() === 'running').length}
                  </h3>
                )}
              </div>
              <div className="bg-destructive/10 p-3 rounded-full">
                <Monitor className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline" 
                size="sm"
                className="w-full border-border hover:bg-muted"
                onClick={() => navigate('/dashboard/admin/vm')}
              >
                View All VMs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* User Management Section */}
      <Card className="dark-card border-border mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-foreground flex items-center">
              <Users className="mr-2 text-primary" size={20} />
              User Management
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage system users and their roles
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="border-border hover:bg-muted"
              onClick={refreshAllData}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleAddUser}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full bg-muted" />
              <Skeleton className="h-16 w-full bg-muted" />
              <Skeleton className="h-16 w-full bg-muted" />
            </div>
          ) : (
            <Tabs defaultValue="active" onValueChange={(value) => setActiveUserTab(value)}>
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted">
                <TabsTrigger value="active" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  Active Users ({usersData.active.length})
                </TabsTrigger>
                <TabsTrigger value="inactive" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  Inactive Users ({usersData.inactive.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="space-y-4">
                {usersData.active.length > 0 ? (
                  usersData.active.map((user) => (
                    <div key={user.id} className="flex items-center justify-between border border-border rounded-md p-3 bg-card">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground border border-border">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <div className="flex space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">ID: {user.employee_id || user.id}</span>
                            <span className={`text-xs ${
                              user.role === 'Admin' 
                                ? 'text-destructive' 
                                : user.role === 'Manager' 
                                  ? 'text-primary' 
                                  : user.role === 'Tester'
                                    ? 'text-accent'
                                    : 'text-foreground'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          user.status === 'Active' || user.status === 'Online' 
                            ? 'bg-green-900/40 text-green-300 border border-green-800' 
                            : user.status === 'Away' 
                              ? 'bg-amber-900/40 text-amber-300 border border-amber-800' 
                              : 'bg-gray-800 text-gray-300 border border-gray-700'
                        }`}>
                          {user.status}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No active users found
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-muted"
                  onClick={() => navigate('/dashboard/admin/users')}
                >
                  View All Users
                </Button>
              </TabsContent>
              
              <TabsContent value="inactive" className="space-y-4">
                {usersData.inactive.length > 0 ? (
                  usersData.inactive.map((user) => (
                    <div key={user.id} className="flex items-center justify-between border border-border rounded-md p-3 bg-card">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border opacity-70">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{user.name}</p>
                          <div className="flex space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">ID: {user.employee_id || user.id}</span>
                            <span className="text-xs text-muted-foreground">{user.role}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-xs px-2 py-1 rounded-full bg-red-900/40 text-red-300 border border-red-800">
                          {user.status}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No inactive users found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      {/* Virtual Desktop Management */}
      <Card className="dark-card border-border mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-foreground flex items-center">
              <Monitor className="mr-2 text-destructive" size={20} />
              Virtual Desktop Overview
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monitor virtual desktop instances
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="border-border hover:bg-muted"
              onClick={() => refetchVMs()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => navigate('/dashboard/admin/vm')}
            >
              View Details
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingVMs ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full bg-muted" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Running VMs counter */}
              <div className="border border-border rounded-md p-4 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-muted-foreground text-sm">Running VMs</div>
                    <div className="text-3xl font-bold text-destructive mt-1">
                      {vmsData.filter(vm => vm.status.toLowerCase() === 'running').length}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {vmsData.length} total
                  </div>
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-destructive rounded-full" 
                    style={{ 
                      width: `${vmsData.length > 0 ? (vmsData.filter(vm => vm.status.toLowerCase() === 'running').length / vmsData.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* OS Distribution */}
              <div className="border border-border rounded-md p-4 bg-card">
                <div className="text-muted-foreground text-sm">OS Distribution</div>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-foreground">Windows</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground mt-1">
                      {vmsData.filter(vm => vm.instance_os.toLowerCase() === 'windows').length}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <span className="text-sm text-foreground">Linux</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground mt-1">
                      {vmsData.filter(vm => vm.instance_os.toLowerCase() === 'linux').length}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                      <span className="text-sm text-foreground">Other</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground mt-1">
                      {vmsData.filter(vm => 
                        vm.instance_os.toLowerCase() !== 'windows' && 
                        vm.instance_os.toLowerCase() !== 'linux'
                      ).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Projects Overview */}
      <Card className="dark-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-foreground flex items-center">
              <Activity className="mr-2 text-accent" size={20} />
              Projects Overview
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Project status summary
            </CardDescription>
          </div>
          <div>
            <Button 
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={() => navigate('/dashboard/admin/projects')}
            >
              Manage Projects
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <Skeleton className="h-24 w-full bg-muted" />
          ) : (
            <>
              <div className="mb-4">
                <div className="h-6 w-full bg-muted rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-green-600" 
                    style={{ width: `${projectStats.activePercent}%` }}
                    title={`Active: ${projectStats.active} (${projectStats.activePercent.toFixed(1)}%)`}
                  ></div>
                  <div 
                    className="h-full bg-blue-600" 
                    style={{ width: `${projectStats.completedPercent}%` }}
                    title={`Completed: ${projectStats.completed} (${projectStats.completedPercent.toFixed(1)}%)`}
                  ></div>
                  <div 
                    className="h-full bg-amber-600" 
                    style={{ width: `${projectStats.pendingPercent}%` }}
                    title={`Pending: ${projectStats.pending} (${projectStats.pendingPercent.toFixed(1)}%)`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Total Projects: {projectStats.total}</span>
                </div>
              </div>
            
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-border rounded-md p-4 bg-card">
                  <div className="flex items-center text-green-400 mb-2">
                    <PieChart className="w-4 h-4 mr-1" />
                    <div className="text-sm">Active</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {projectStats.active}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Projects in progress</div>
                </div>
                
                <div className="border border-border rounded-md p-4 bg-card">
                  <div className="flex items-center text-blue-400 mb-2">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <div className="text-sm">Completed</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {projectStats.completed}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Successfully delivered projects</div>
                </div>
                
                <div className="border border-border rounded-md p-4 bg-card">
                  <div className="flex items-center text-amber-400 mb-2">
                    <Clock className="w-4 h-4 mr-1" />
                    <div className="text-sm">Pending</div>
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    {projectStats.pending}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Projects awaiting start</div>
                </div>
                
                
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
