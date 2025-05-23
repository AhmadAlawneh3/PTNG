
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Monitor, Power, ExternalLink, LayoutGrid, Terminal } from 'lucide-react';
import { VMStatusBadge } from './VMStatusBadge';
import { VirtualMachine, handleVMAction } from '@/services/vmManagementService';

interface VMDetailsDialogProps {
  vm: VirtualMachine | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actionLoading: string | null;
}

export const VMDetailsDialog = ({ vm, isOpen, onOpenChange, actionLoading }: VMDetailsDialogProps) => {
  if (!vm) return null;

  const handleConnect = () => {
    if (vm.guacamole_url) {
      window.open(vm.guacamole_url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-cyber-teal/30 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-cyber-teal">Virtual Desktop Details</DialogTitle>
          <DialogDescription className="text-cyber-gray">
            {vm.name} ({vm.id})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* OS Info */}
            <div className="p-3 border border-cyber-teal/20 rounded-md bg-cyber-dark-blue/20">
              <div className="text-xs text-cyber-gray">Operating System</div>
              <div className={`text-sm mt-1 flex items-center gap-2 ${
                vm.os.toLowerCase() === 'windows' ? 'text-blue-400' : 
                vm.os.toLowerCase() === 'linux' ? 'text-yellow-400' : 
                'text-purple-400'
              }`}>
                {vm.os.toLowerCase() === 'windows' ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : vm.os.toLowerCase() === 'linux' ? (
                  <Terminal className="h-4 w-4" />
                ) : null}
                {vm.os}
              </div>
            </div>
            
            {/* Status */}
            <div className="p-3 border border-cyber-teal/20 rounded-md bg-cyber-dark-blue/20">
              <div className="text-xs text-cyber-gray">Status</div>
              <div className="mt-1">
                <VMStatusBadge status={vm.status} />
              </div>
            </div>

            {/* User Info */}
            <div className="p-3 border border-cyber-teal/20 rounded-md bg-cyber-dark-blue/20">
              <div className="text-xs text-cyber-gray">Assigned User</div>
              <div className="text-sm text-cyber-teal mt-1">{vm.assigned_user}</div>
            </div>

            {/* User Email */}
            <div className="p-3 border border-cyber-teal/20 rounded-md bg-cyber-dark-blue/20">
              <div className="text-xs text-cyber-gray">User Email</div>
              <div className="text-sm text-cyber-teal mt-1">{vm.user_email || 'N/A'}</div>
            </div>

            {/* Instance ID */}
            <div className="p-3 border border-cyber-teal/20 rounded-md bg-cyber-dark-blue/20">
              <div className="text-xs text-cyber-gray">Instance ID</div>
              <div className="text-sm text-cyber-teal mt-1">{vm.instance_id || vm.id}</div>
            </div>
            
            {/* Created At */}
            <div className="p-3 border border-cyber-teal/20 rounded-md bg-cyber-dark-blue/20">
              <div className="text-xs text-cyber-gray">Created</div>
              <div className="text-sm text-cyber-teal mt-1">
                {vm.created_at ? new Date(vm.created_at).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {vm.status.toLowerCase() === 'running' ? (
              <>
                <Button
                  variant="outline"
                  className="border-cyber-teal/30 hover:bg-cyber-red/20 hover:text-cyber-red"
                  onClick={() => handleVMAction(vm.id, 'Stop', vm.os.toLowerCase(), vm.assigned_user)}
                  disabled={actionLoading === vm.id}
                >
                  {actionLoading === vm.id ? (
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Power className="mr-2 h-4 w-4" />
                  )}
                  Stop
                </Button>
                {vm.guacamole_url && (
                  <Button 
                    className="cyber-button"
                    onClick={handleConnect}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                )}
              </>
            ) : vm.status === 'Paused' ? (
              <Button
                className="cyber-button"
                onClick={() => handleVMAction(vm.id, 'Resume', vm.os.toLowerCase(), vm.assigned_user)}
                disabled={actionLoading === vm.id}
              >
                {actionLoading === vm.id ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                  </svg>
                )}
                Resume
              </Button>
            ) : vm.status === 'Stopped' || vm.status === 'Error' ? (
              <Button
                className="cyber-button"
                onClick={() => handleVMAction(vm.id, 'Start', vm.os.toLowerCase(), vm.assigned_user)}
                disabled={actionLoading === vm.id}
              >
                {actionLoading === vm.id ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                  </svg>
                )}
                Start
              </Button>
            ) : (
              <Button
                className="cyber-button"
                onClick={() => handleVMAction(vm.id, 'Start', vm.os.toLowerCase(), vm.assigned_user)}
                disabled={actionLoading === vm.id}
              >
                {actionLoading === vm.id ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                  </svg>
                )}
                Start
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
