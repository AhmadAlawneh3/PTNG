
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { Monitor, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { handleVMAction, loadUserVMs, VirtualMachine } from '@/services/vmManagementService';
import { VMTableActions } from '@/components/vm/VMTableActions';
import { VMStatusBadge } from '@/components/vm/VMStatusBadge';
import { userManagementService } from '@/services/userManagementService';
import { useAuth } from '@/contexts/AuthContext';

const ManagerTeamDesktops = () => {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedTester, setSelectedTester] = useState<string | null>(null);
  const [showConnectLink, setShowConnectLink] = useState<Record<string, boolean>>({});
  const [vmStartProgress, setVmStartProgress] = useState<Record<string, number>>({});
  const [loadingVMs, setLoadingVMs] = useState<Record<string, boolean>>({});
  const [connectTimers, setConnectTimers] = useState<Record<string, {interval?: NodeJS.Timeout, timer?: NodeJS.Timeout}>>({});

  // Fetch team members (testers)
  const { data: testers = [], isLoading: isLoadingTesters } = useQuery({
    queryKey: ['testers'],
    queryFn: async () => {
      try {
        const response = await userManagementService.getAllTesters();
        return response;
      } catch (error) {
        console.error('Error fetching testers:', error);
        toast.error('Failed to load team members');
        return [];
      }
    }
  });

  // Fetch VMs for selected tester
  const { 
    data: vms = [], 
    isLoading: isLoadingVMs,
    refetch: refetchVMs
  } = useQuery({
    queryKey: ['manager-vms', selectedTester],
    queryFn: async () => {
      if (!selectedTester) return [];
      try {
        return await loadUserVMs(selectedTester);
      } catch (error) {
        console.error('Error fetching VMs for tester:', error);
        toast.error('Failed to load virtual machines');
        return [];
      }
    },
    enabled: !!selectedTester
  });

  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      Object.values(connectTimers).forEach(timers => {
        if (timers.interval) clearInterval(timers.interval);
        if (timers.timer) clearTimeout(timers.timer);
      });
    };
  }, [connectTimers]);

  // Simulate loading for VM start
  const simulateLoading = (vmId: string) => {
    // Reset progress
    setVmStartProgress(prev => ({ ...prev, [vmId]: 0 }));
    setLoadingVMs(prev => ({ ...prev, [vmId]: true }));
    setShowConnectLink(prev => ({ ...prev, [vmId]: false }));
    
    // Start visual progress animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1.7; // Slightly faster to complete in time (~59 seconds)
      if (progress >= 100) {
        clearInterval(interval);
        setLoadingVMs(prev => ({ ...prev, [vmId]: false }));
        setShowConnectLink(prev => ({ ...prev, [vmId]: true }));
        
        // Show completion toast
        toast(`VM Ready`, {
          description: "The team member's virtual machine is now ready to connect."
        });
        
        // Remove the interval reference
        if (connectTimers[vmId]) {
          const updatedTimers = { ...connectTimers[vmId] };
          delete updatedTimers.interval;
          setConnectTimers(prev => ({ ...prev, [vmId]: updatedTimers }));
        }
      }
      setVmStartProgress(prev => ({ ...prev, [vmId]: Math.min(progress, 100) }));
    }, 1000); // Update every second

    // Clear interval after 60 seconds (just to be safe)
    const timer = setTimeout(() => {
      clearInterval(interval);
      setLoadingVMs(prev => ({ ...prev, [vmId]: false }));
      setShowConnectLink(prev => ({ ...prev, [vmId]: true }));
      
      // Remove timer references
      delete connectTimers[vmId];
      setConnectTimers({ ...connectTimers });
    }, 60000);

    // Store the timers for cleanup
    setConnectTimers(prev => ({ 
      ...prev, 
      [vmId]: { 
        interval, 
        timer 
      } 
    }));
  };

  // Handle VM action (start, stop, restart)
  const handleAction = async (vmId: string, action: string, instanceOs: string, employeeId: string) => {
    setActionLoading(vmId);
    try {
      // If action is start, simulate loading
      if (action.toLowerCase() === 'start') {
        toast(`Starting ${instanceOs} VM`, {
          description: "The team member's virtual machine is starting. This may take about a minute."
        });
        
        // Start visual loading animation
        simulateLoading(vmId);
      }
      
      // Make the actual API call
      await handleVMAction(vmId, action, instanceOs, employeeId);
      
      // If it's not a start action, we don't need to simulate loading
      if (action.toLowerCase() !== 'start') {
        // Refresh VM data after action
        await refetchVMs();
      } else {
        // For start action, we'll refresh after the visual loading completes
        setTimeout(() => {
          refetchVMs();
        }, 60000);
      }
    } catch (error) {
      console.error(`Error ${action} VM:`, error);
      
      // Clear loading state if there's an error
      if (action.toLowerCase() === 'start') {
        setLoadingVMs(prev => ({ ...prev, [vmId]: false }));
        setVmStartProgress(prev => ({ ...prev, [vmId]: 0 }));
        
        // Clear any timers
        if (connectTimers[vmId]) {
          if (connectTimers[vmId].interval) clearInterval(connectTimers[vmId].interval);
          if (connectTimers[vmId].timer) clearTimeout(connectTimers[vmId].timer);
          delete connectTimers[vmId];
          setConnectTimers({ ...connectTimers });
        }
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (vm: VirtualMachine) => {
    toast(`VM Details: ${vm.name}`, {
      description: `OS: ${vm.os}, Status: ${vm.status}, ID: ${vm.id}`
    });
  };

  // Calculate remaining time for VM initialization
  const getRemainingSeconds = (vmId: string) => {
    const progress = vmStartProgress[vmId] || 0;
    return Math.ceil(60 * (1 - progress / 100));
  };

  return (
    <DashboardLayout>
      <Card className="glass-panel border-primary/30 mb-6">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Team Virtual Desktops</CardTitle>
          <CardDescription className="text-white/70">
            Manage and monitor your team's virtual machines
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-panel border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl text-white">
              <Users className="mr-2 text-primary" size={20} />
              Select Team Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTesters ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            ) : testers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {testers.map((tester) => (
                  <Button
                    key={tester.employee_id}
                    variant={selectedTester === tester.employee_id ? "default" : "outline"}
                    onClick={() => setSelectedTester(tester.employee_id)}
                    className="border-primary/30 text-white"
                  >
                    {tester.name}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-white/70">
                No team members found
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTester && (
          <Card className="glass-panel border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl text-white">
                <Monitor className="mr-2 text-primary" size={20} />
                Virtual Machines
              </CardTitle>
              <CardDescription className="text-white/70">
                {testers.find(t => t.employee_id === selectedTester)?.name}'s virtual desktops
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingVMs ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              ) : vms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">VM</TableHead>
                      <TableHead className="text-white">OS</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vms.map((vm) => (
                      <TableRow key={vm.id}>
                        <TableCell className="font-medium text-white">{vm.name}</TableCell>
                        <TableCell className="text-white">{vm.os}</TableCell>
                        <TableCell>
                          {loadingVMs[vm.id] ? (
                            <div className="flex items-center space-x-2">
                              <div className="h-4 w-4 animate-spin border-2 border-amber-400 border-t-transparent rounded-full"></div>
                              <span className="text-amber-400">Starting ({getRemainingSeconds(vm.id)}s)</span>
                            </div>
                          ) : (
                            <VMStatusBadge status={vm.status} />
                          )}
                        </TableCell>
                        <TableCell>
                          <VMTableActions
                            vmId={vm.id}
                            status={loadingVMs[vm.id] ? 'Starting' : vm.status}
                            instanceOs={vm.os}
                            employeeId={selectedTester}
                            actionLoading={actionLoading === vm.id ? vm.id : null}
                            onAction={handleAction}
                            onViewDetails={() => handleViewDetails(vm)}
                            guacamoleUrl={
                              vm.status.toLowerCase() === 'running' && 
                              vm.guacamole_url && 
                              showConnectLink[vm.id] ? vm.guacamole_url : undefined
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 text-white/70">
                  No virtual machines available for this user
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManagerTeamDesktops;
