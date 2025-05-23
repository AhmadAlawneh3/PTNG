
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Shield, Pencil, Trash2, Key } from "lucide-react";
import type { User } from "@/types/user";

interface UserListProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (employee_id: string) => void;
  onViewPermissions: (user: User) => void;
  onToggleStatus: (employee_id: string) => void;
}

export function UserList({ 
  users, 
  onEditUser, 
  onDeleteUser, 
  onViewPermissions, 
  onToggleStatus 
}: UserListProps) {
  return (
    <div className="rounded-md border border-cyber-teal/20 overflow-hidden">
      <Table>
        <TableHeader className="bg-cyber-dark-blue/40">
          <TableRow>
            <TableHead className="text-white">User</TableHead>
            <TableHead className="text-white">Role</TableHead>
            <TableHead className="text-white">Status</TableHead>
            <TableHead className="text-white">Last Login</TableHead>
            <TableHead className="text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id || user.employee_id} className="hover:bg-cyber-dark-blue/20">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-cyber-dark-blue flex items-center justify-center text-white border border-cyber-teal/30">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <div className="text-xs text-white/80">{user.email}</div>
                    <div className="text-xs text-white/70">@{user.employee_id}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.role.toLowerCase() === 'admin' 
                    ? 'bg-cyber-red/20 text-white' 
                    : user.role.toLowerCase() === 'manager' 
                      ? 'bg-cyber-green/20 text-white' 
                      : 'bg-cyber-blue/20 text-white'
                }`}>
                  {user.role}
                </span>
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.status.toLowerCase() === 'active' 
                    ? 'bg-green-400/20 text-white' 
                    : user.status.toLowerCase() === 'suspended' 
                      ? 'bg-yellow-400/20 text-white' 
                      : 'bg-cyber-red/20 text-white'
                }`}>
                  {user.status}
                </span>
              </TableCell>
              <TableCell className="text-sm text-white/80">
                {user.lastLogin || 'Never'}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 w-8 p-0 border-cyber-teal/30 hover:bg-cyber-blue/20 hover:text-white"
                    onClick={() => onViewPermissions(user)}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 border-cyber-teal/30 hover:bg-cyber-green/20 hover:text-white"
                    onClick={() => onEditUser(user)}
                    title="Edit User"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 border-cyber-teal/30 hover:bg-cyber-red/20 hover:text-white"
                    onClick={() => onDeleteUser(user.employee_id)}
                    disabled={user.role.toLowerCase() === 'admin' || user.status.toLowerCase() === 'inactive' }
                    title="Deactivate User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`h-8 w-8 p-0 border-cyber-teal/30 ${
                      user.status.toLowerCase() === 'active'
                        ? 'hover:bg-yellow-400/20 hover:text-white'
                        : 'hover:bg-green-400/20 hover:text-white'
                    }`}
                    onClick={() => onToggleStatus(user.employee_id)}
                    disabled={user.status.toLowerCase() === 'active'}
                    title={user.status.toLowerCase() === 'active' ? "Deactivate User" : "Activate User"}
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
