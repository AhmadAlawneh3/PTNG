
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, LayoutGrid, Terminal } from 'lucide-react';
import { VMStatusBadge } from '@/components/vm/VMStatusBadge';
import { VMDetailsDialog } from '@/components/vm/VMDetailsDialog';
import { VMTableActions } from '@/components/vm/VMTableActions';
import { toast } from '@/components/ui/sonner';
import { vmService } from '@/services/vmService';
import { useQuery } from '@tanstack/react-query';
import { handleVMAction, VirtualMachine, VMStatus } from '@/services/vmManagementService';

const VirtualDesktopPage = () => {
  const [selectedVM, setSelectedVM] = useState<VirtualMachine | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use React Query for VM data
  const { 
    data: vms = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['admin-vms'],
    queryFn: async () => {
      try {
        const response = await vmService.getAllVMs();
        
        
        if (response && response.vms && Array.isArray(response.vms)) {
          // Convert API response to VirtualMachine format
          return response.vms.map(vm => ({
            id: vm.id.toString(),
            name: `${vm.instance_os} VM`,
            status: normalizeVMStatus(vm.status),
            os: vm.instance_os,
            assigned_user: vm.employee_id,
            uptime: calculateUptime(vm.status, vm.updated_at),
            health: 'Good',
            ip_address: 'N/A',
            user_name: vm.user_name,
            user_email: vm.user_email,
            guacamole_url: vm.guacamole_url,
            instance_id: vm.instance_id,
            created_at: vm.created_at,
            resources: generateResourceMetrics(vm.status)
          }));
        } else {
          console.error('Unexpected API response format:', response);
          toast.error('Unexpected API response format');
          return [];
        }
      } catch (error) {
        console.error('Error fetching all VMs:', error);
        toast.error('Failed to fetch VMs data');
        return [];
      }
    }
  });
  
  // Helper function to normalize VM status strings
  const normalizeVMStatus = (status: string): VMStatus => {
    const lowercaseStatus = status.toLowerCase();
    
    if (lowercaseStatus === 'running') return 'Running';
    if (lowercaseStatus === 'stopped') return 'Stopped';
    if (lowercaseStatus === 'starting') return 'Starting';
    if (lowercaseStatus === 'stopping') return 'Stopping';
    if (lowercaseStatus === 'paused') return 'Paused';
    
    return 'Error';
  };

  // Helper function to calculate uptime based on status and last update
  const calculateUptime = (status: string, updatedAt: string) => {
    const isRunning = status.toLowerCase() === 'running';
    if (!isRunning) return '0h 0m';
    
    const updatedDate = new Date(updatedAt);
    const now = new Date();
    const uptimeMs = now.getTime() - updatedDate.getTime();
    
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Helper function to generate resource metrics based on status
  const generateResourceMetrics = (status: string) => {
    const isRunning = status.toLowerCase() === 'running';
    
    return {
      cpu: isRunning ? Math.floor(Math.random() * 60) + 20 : 0,
      memory: isRunning ? Math.floor(Math.random() * 50) + 30 : 0,
      disk: Math.floor(Math.random() * 40) + 10,
      network: isRunning ? Math.floor(Math.random() * 40) + 5 : 0,
    };
  };

  const handleViewDetails = (vm: VirtualMachine) => {
    setSelectedVM(vm);
    setIsDetailsOpen(true);
  };

  // Calculate stats based on actual data
  const runningVMs = vms.filter(vm => vm.status.toLowerCase() === 'running').length;
  const vmsByOs = {
    Windows: vms.filter(vm => vm.os.toLowerCase() === 'windows').length,
    Linux: vms.filter(vm => vm.os.toLowerCase() === 'linux').length,
    Other: vms.filter(vm => !['windows', 'linux'].includes(vm.os.toLowerCase())).length,
  };

  const handleAction = async (vmId: string, action: string, instanceOs: string, employeeId: string) => {
    setActionLoading(vmId);
    
    try {
      await handleVMAction(vmId, action, instanceOs, employeeId);
      
      // Refresh VM list after action
      await refetch();
    } catch (error) {
      console.error(`Error executing VM action:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success('VM data refreshed', {
      description: 'Virtual machine data has been updated.'
    });
  };

  return (
    <DashboardLayout>
      <Card className="glass-panel border-cyber-teal/30 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-cyber-teal">Virtual Desktop Management</CardTitle>
            <CardDescription className="text-cyber-gray">
              Monitor and control virtual desktop instances
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              className="cyber-button" 
              size="sm" 
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* System Overview Stats - Only showing relevant metrics */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Running VMs Card */}
            <Card className="glass-panel border-cyber-teal/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyber-gray text-sm">Running VMs</p>
                    <h3 className="text-3xl font-bold text-cyber-blue mt-1">
                      {runningVMs}/{vms.length}
                    </h3>
                  </div>
                  <div className="bg-cyber-blue/10 p-3 rounded-full">
                    <svg className="h-6 w-6 text-cyber-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OS Distribution Card */}
            <Card className="glass-panel border-cyber-teal/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyber-gray text-sm">OS Distribution</p>
                    <div className="flex space-x-4 mt-1">
                      <p><span className="font-bold text-blue-500">Windows:</span> {vmsByOs.Windows}</p>
                      <p><span className="font-bold text-yellow-500">Linux:</span> {vmsByOs.Linux}</p>
                      {vmsByOs.Other > 0 && (
                        <p><span className="font-bold text-purple-500">Other:</span> {vmsByOs.Other}</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-cyber-teal/10 p-3 rounded-full">
                    <svg className="h-6 w-6 text-cyber-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VM Table - Simplified to only show supported columns */}
          <div className="rounded-md border border-cyber-teal/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-cyber-dark-blue/40">
                <TableRow>
                  <TableHead className="text-cyber-teal">VM</TableHead>
                  <TableHead className="text-cyber-teal">Status</TableHead>
                  <TableHead className="text-cyber-teal">User</TableHead>
                  <TableHead className="text-cyber-teal">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      <div className="flex justify-center">
                        <div className="animate-spin h-8 w-8 border-2 border-cyber-teal border-t-transparent rounded-full"></div>
                      </div>
                      <div className="mt-2 text-cyber-gray">Loading virtual machines...</div>
                    </TableCell>
                  </TableRow>
                ) : vms.length > 0 ? (
                  vms.map((vm) => (
                    <TableRow key={vm.id} className={`hover:bg-cyber-dark-blue/20 ${
                      vm.status === 'Error' ? 'bg-cyber-red/5' : ''
                    }`}>
                      {/* VM Info - Using proper OS logos */}
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white border ${
                              vm.os.toLowerCase() === 'windows' ? 'bg-blue-500/20 border-blue-500/30' : 
                              vm.os.toLowerCase() === 'linux' ? 'bg-yellow-500/20 border-yellow-500/30' : 
                              'bg-purple-500/20 border-purple-500/30'
                            }`}>
                              {vm.os.toLowerCase() === 'windows' ? (
                                <LayoutGrid className="h-4 w-4" />
                              ) : vm.os.toLowerCase() === 'linux' ? (
                                <Terminal className="h-4 w-4" />
                              ) : (
                                vm.os.substring(0, 1).toUpperCase()
                              )}
                            </div>
                          </div>
                          <div>
                            <button 
                              className="text-sm font-medium text-cyber-teal hover:text-cyber-blue"
                              onClick={() => handleViewDetails(vm)}
                            >
                              {vm.name}
                            </button>
                            <div className="text-xs text-cyber-gray">{vm.instance_id || vm.id}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <VMStatusBadge status={vm.status} />
                      </TableCell>

                      {/* User information */}
                      <TableCell className="text-sm text-cyber-gray">
                        <div>
                          <div>{vm.user_name || 'N/A'}</div>
                          <div className="text-xs opacity-70">ID: {vm.assigned_user}</div>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <VMTableActions
                          vmId={vm.id}
                          status={vm.status}
                          instanceOs={vm.os}
                          employeeId={vm.assigned_user}
                          actionLoading={actionLoading}
                          onAction={handleAction}
                          onViewDetails={() => handleViewDetails(vm)}
                          guacamoleUrl={vm.guacamole_url}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      No virtual machines available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* VM Details Dialog */}
      {selectedVM && (
        <VMDetailsDialog
          vm={selectedVM}
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          actionLoading={actionLoading}
        />
      )}
    </DashboardLayout>
  );
};

export default VirtualDesktopPage;
