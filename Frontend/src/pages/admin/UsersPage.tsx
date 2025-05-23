
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { toast } from '@/components/ui/sonner';
import { UserPlus } from 'lucide-react';
import { UserForm } from '@/components/admin/users/UserForm';
import { UserList } from '@/components/admin/users/UserList';
import { UserPermissions } from '@/components/admin/users/UserPermissions';
import type { User, UserFormValues, ApiUser } from '@/types/user';
import { userService } from '@/services/userService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const UsersPage = () => {
  const { toast: uiToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  // Map API user to our internal User format
  const mapApiUserToUser = (apiUser: ApiUser): User => {
    // Handle case sensitivity in role and status
    const role = apiUser.role.charAt(0).toUpperCase() + apiUser.role.slice(1).toLowerCase() as User['role'];
    const status = apiUser.status.charAt(0).toUpperCase() + apiUser.status.slice(1).toLowerCase() as User['status'];
    
    return {
      id: apiUser.employee_id, // Using employee_id as id
      name: apiUser.name,
      email: apiUser.email,
      employee_id: apiUser.employee_id,
      role: role,
      status: status,
      lastLogin: 'N/A', // This isn't provided by the API
      permissions: [], // Default empty permissions
    };
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getAllUsers();
      
      // Check if response is an array (which is now the expected format)
      if (Array.isArray(response)) {
        
        const mappedUsers = response.map(mapApiUserToUser);
        
        setUsers(mappedUsers);
      } else {
        console.error('Unexpected API response format:', response);
        toast.error("Invalid Response Format", {
          description: "The server returned data in an unexpected format."
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error("Error Loading Users", {
        description: "Failed to load users. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (data: UserFormValues) => {
    try {
      await userService.createUser(data);
      await loadUsers();
      setIsAddUserOpen(false);
      
      toast.success("User Added", {
        description: `${data.name} has been added successfully.`
      });
    } catch (error) {
      toast.error("Error Adding User", {
        description: "Failed to add user. Please try again."
      });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (data: UserFormValues) => {
    if (!selectedUser) return;

    try {
      await userService.updateUser(selectedUser.employee_id, data);
      await loadUsers();
      setIsEditUserOpen(false);
      setSelectedUser(null);
      
      toast.success("User Updated", {
        description: `${data.name}'s details have been updated.`
      });
    } catch (error) {
      toast.error("Error Updating User", {
        description: "Failed to update user. Please try again."
      });
    }
  };

  const confirmDeleteUser = (employee_id: string) => {
    
    const user = users.find(u => u.employee_id === employee_id);
    
    if (!user) {
      console.error('User not found with employee_id:', employee_id);
      return;
    }
    
    if (user.role === 'Admin') {
      toast.error("Cannot Delete Admin", {
        description: "The admin user cannot be deleted."
      });
      return;
    }
    
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleViewPermissions = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      console.error('No user to delete. userToDelete is null or undefined');
      toast.error("Error Deleting User", {
        description: "User information is missing. Please try again."
      });
      return;
    }   
    
    try {
      
      
      
      // Validate employee_id exists before making the API call
      if (!userToDelete.employee_id) {
        throw new Error('Employee ID is missing or invalid');
      }
      
      // Use employee_id consistently for the API call
      await userService.softDeleteUser(userToDelete.employee_id);
      
      await loadUsers();
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      toast.success("User Deleted", {
        description: "The user has been deactivated from the system."
      });
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast.error("Error Deleting User", {
        description: error.message || "Failed to delete user. Please try again."
      });
    }
  };

  const handleStatusToggle = async (employee_id: string) => {
    
    const user = users.find(u => u.employee_id === employee_id);
    if (!user) {
      console.error('User not found with employee_id:', employee_id);
      return;
    }

    if (user.role === 'Admin') {
      toast.error("Cannot Change Admin Status", {
        description: "The admin user status cannot be changed."
      });
      return;
    }

    try {
      
      
      
      // Validate employee_id exists before making the API call
      if (!user.employee_id) {
        throw new Error('Employee ID is missing or invalid');
      }
      
      if (user.status === 'Active') {
        await userService.softDeleteUser(user.employee_id);
      } else {
        await userService.restoreUser(user.employee_id);
      }
      await loadUsers();

      toast.success("Status Updated", {
        description: `${user.name}'s status has been updated.`
      });
    } catch (error: any) {
      console.error('Status toggle error:', error);
      toast.error("Error Updating Status", {
        description: error.message || "Failed to update user status. Please try again."
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card className="glass-panel border-primary/30 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-white">User Management</CardTitle>
            <CardDescription className="text-white/70">
              Manage system users, their roles and permissions
            </CardDescription>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </CardHeader>
        <CardContent>
          <UserList 
            users={users}
            onEditUser={handleEditUser}
            onDeleteUser={confirmDeleteUser}
            onViewPermissions={handleViewPermissions}
            onToggleStatus={handleStatusToggle}
          />
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="glass-panel border-primary/30 sm:max-w-md">
          <UserForm 
            onSubmit={handleAddUser}
            onCancel={() => setIsAddUserOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="glass-panel border-primary/30 sm:max-w-md">
          <UserForm 
            onSubmit={handleUpdateUser}
            onCancel={() => setIsEditUserOpen(false)}
            initialData={selectedUser ?? undefined}
            submitLabel="Update User"
          />
        </DialogContent>
      </Dialog>
      
      {/* Permissions Dialog */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="glass-panel border-primary/30 sm:max-w-md">
          {selectedUser && (
            <UserPermissions 
              user={selectedUser}
              onClose={() => setIsPermissionsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-panel border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm User Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete {userToDelete?.name}? This action will deactivate their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/30 text-white hover:bg-card/50 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteUser}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default UsersPage;
