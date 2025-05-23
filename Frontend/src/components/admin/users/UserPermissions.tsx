
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { User } from "@/types/user";

interface UserPermissionsProps {
  user: User;
  onClose: () => void;
}

export function UserPermissions({ user, onClose }: UserPermissionsProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-cyber-teal">User Permissions</DialogTitle>
        <DialogDescription className="text-cyber-gray">
          {user.name}'s system permissions
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {user.permissions.map((permission, index) => (
          <div 
            key={index} 
            className="p-3 border border-cyber-teal/20 rounded-md bg-cyber-dark-blue/20"
          >
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-cyber-blue" />
              <span className="text-cyber-teal">{permission}</span>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end pt-4">
          <Button 
            className="cyber-button"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
