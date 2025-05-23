
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { Monitor, Server } from 'lucide-react';
import { vmService, UserVM } from '@/services/vmService';
import { Progress } from '@/components/ui/progress';

const TesterVirtualDesktop = () => {
  const [activeOs, setActiveOs] = React.useState<'windows' | 'linux'>('windows');
  const [userVMs, setUserVMs] = useState<UserVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [connectionUrls, setConnectionUrls] = useState<{windows?: string, linux?: string}>({});
  const [connectTimers, setConnectTimers] = useState<{windows?: NodeJS.Timeout, linux?: NodeJS.Timeout}>({});
  const [canConnect, setCanConnect] = useState<{windows: boolean, linux: boolean}>({
    windows: false,
    linux: false
  });
  const [vmStartProgress, setVmStartProgress] = useState<{windows: number, linux: number}>({
    windows: 0,
    linux: 0
  });
  const [loadingState, setLoadingState] = useState<{windows: boolean, linux: boolean}>({
    windows: false,
    linux: false
  });

  useEffect(() => {
    loadUserVMs();
    
    // Clear timers on component unmount
    return () => {
      Object.values(connectTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const loadUserVMs = async () => {
    try {
      const response = await vmService.getUserVMs();
      setUserVMs(response.vms);
      
      // Process VM data and set status
      const windowsVM = response.vms.find(vm => vm.instance_os.toLowerCase() === 'windows');
      const linuxVM = response.vms.find(vm => vm.instance_os.toLowerCase() === 'linux');
      
      // Check if VMs are already running
      if (windowsVM && windowsVM.status.toLowerCase() === 'running') {
        setCanConnect(prev => ({ ...prev, windows: true }));
        if (windowsVM.guacamole_url) {
          setConnectionUrls(prev => ({ ...prev, windows: windowsVM.guacamole_url || undefined }));
        }
      }
      
      if (linuxVM && linuxVM.status.toLowerCase() === 'running') {
        setCanConnect(prev => ({ ...prev, linux: true }));
        if (linuxVM.guacamole_url) {
          setConnectionUrls(prev => ({ ...prev, linux: linuxVM.guacamole_url || undefined }));
        }
      }
    } catch (error) {
      toast.error("Failed to load VM data", {
        description: "Could not retrieve information about your virtual machines."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateLoading = (os: 'windows' | 'linux') => {
    // Reset progress
    setVmStartProgress(prev => ({ ...prev, [os]: 0 }));
    setLoadingState(prev => ({ ...prev, [os]: true }));
    
    // Start visual progress animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1.7; // Slightly faster to complete in time (~59 seconds)
      if (progress >= 100) {
        clearInterval(interval);
        setLoadingState(prev => ({ ...prev, [os]: false }));
        setCanConnect(prev => ({ ...prev, [os]: true }));
        
        // Show completion toast
        toast.success(`VM Ready`, {
          description: `Your ${os} VM is now ready to connect.`,
        });
      }
      setVmStartProgress(prev => ({ ...prev, [os]: Math.min(progress, 100) }));
    }, 1000); // Update every second

    // Clear interval after 60 seconds (just to be safe)
    const safetyTimer = setTimeout(() => {
      clearInterval(interval);
      setLoadingState(prev => ({ ...prev, [os]: false }));
      setCanConnect(prev => ({ ...prev, [os]: true }));
    }, 60000);

    // Store the timers for cleanup
    return { interval, safetyTimer };
  };

  const handleVmAction = async (action: string) => {
    if (actionInProgress) return;
    
    setActionInProgress(true);
    try {
      let response;
      
      switch (action) {
        case 'Start':
          // Show immediate toast about starting
          toast.info(`Starting ${activeOs} VM`, {
            description: "This will take about a minute. Please wait."
          });
          
          // Start visual loading simulation first
          const { interval, safetyTimer } = simulateLoading(activeOs);
          
          // Call API in background (not tied to the visual loading)
          response = await vmService.startVM(activeOs);
          
          // Store the URL for when loading completes
          if (response.URL) {
            setConnectionUrls(prev => ({ ...prev, [activeOs]: response.URL }));
          }
          
          // Store timers for cleanup
          setConnectTimers(prev => ({ 
            ...prev, 
            [activeOs]: setTimeout(() => {
              // This will be executed after the visual loading completes
              // Reload VM data to reflect current state
              loadUserVMs();
            }, 60000) 
          }));
          break;
          
        case 'Stop':
          response = await vmService.stopVM(activeOs);
          toast.info(`${activeOs} VM stopped`, {
            description: response.message || "Virtual machine has been stopped successfully."
          });
          
          // Reset connection state
          setCanConnect(prev => ({ ...prev, [activeOs]: false }));
          setConnectionUrls(prev => ({ ...prev, [activeOs]: undefined }));
          setVmStartProgress(prev => ({ ...prev, [activeOs]: 0 }));
          setLoadingState(prev => ({ ...prev, [activeOs]: false }));
          
          // Clear any timer that might be running
          if (connectTimers[activeOs]) {
            clearTimeout(connectTimers[activeOs]);
            setConnectTimers(prev => ({ ...prev, [activeOs]: undefined }));
          }

          // Reload VM data
          loadUserVMs();
          break;
          
        case 'Restart':
          toast.info(`Restarting ${activeOs} VM`, {
            description: "This will take about a minute. Please wait."
          });
          
          // Start visual loading simulation first
          const restartTimers = simulateLoading(activeOs);
          
          // Call API in background
          response = await vmService.restartVM(activeOs);
          
          // Store the URL for when loading completes
          if (response.URL) {
            setConnectionUrls(prev => ({ ...prev, [activeOs]: response.URL }));
          }
          
          // Store timer for cleanup
          setConnectTimers(prev => ({ 
            ...prev, 
            [activeOs]: setTimeout(() => {
              // This will be executed after the visual loading completes
              loadUserVMs();
            }, 60000) 
          }));
          break;
          
        default:
          return;
      }
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} VM`, {
        description: "An error occurred while managing your virtual machine. Please try again."
      });
      
      // Reset loading state if there's an error
      setLoadingState(prev => ({ ...prev, [activeOs]: false }));
      setVmStartProgress(prev => ({ ...prev, [activeOs]: 0 }));
    } finally {
      setActionInProgress(false);
    }
  };

  const handleConnect = () => {
    const url = connectionUrls[activeOs];
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Calculate remaining time based on progress
  const getRemainingSeconds = (os: 'windows' | 'linux') => {
    const progress = vmStartProgress[os];
    return Math.ceil(60 * (1 - progress / 100));
  };

  // Find VM status for current OS
  const getVmStatus = (os: 'windows' | 'linux') => {
    const vm = userVMs.find(vm => vm.instance_os.toLowerCase() === os.toLowerCase());
    return vm?.status || 'Not Available';
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
      <Card className="glass-panel border-primary/10 mb-6">
        <CardHeader>
          <CardTitle className="text-2xl text-primary/80">Virtual Desktop Access</CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect to your secure testing environment
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel border-primary/10 h-full">
          <CardHeader>
            <CardTitle className="text-xl text-primary/80 flex items-center">
              <Monitor className="mr-2 text-muted-foreground" size={20} />
              Virtual Desktop Console
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Select your preferred operating system and connect to your virtual environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="windows" onValueChange={(value) => setActiveOs(value as 'windows' | 'linux')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="windows">
                  Windows
                </TabsTrigger>
                <TabsTrigger value="linux">
                  Linux
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="windows" className="border rounded-md border-input p-4 bg-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-primary/80 font-medium">Windows VM</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: {' '}
                        <span className={
                          getVmStatus('windows').toLowerCase() === 'running' ? 'text-green-500' : 
                          'text-amber-500'
                        }>
                          {getVmStatus('windows')}
                        </span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-input hover:bg-primary/20 hover:text-primary"
                        onClick={() => handleVmAction('Start')}
                        disabled={getVmStatus('windows').toLowerCase() === 'running' || actionInProgress || loadingState.windows}
                      >
                        {actionInProgress && activeOs === 'windows' ? (
                          <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        ) : null}
                        Start
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-input hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => handleVmAction('Stop')}
                        disabled={getVmStatus('windows').toLowerCase() !== 'running' || actionInProgress || loadingState.windows}
                      >
                        {actionInProgress && activeOs === 'windows' ? (
                          <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        ) : null}
                        Stop
                      </Button>
                    </div>
                  </div>
                  
                  {loadingState.windows && (
                    <div className="mt-3 p-3 bg-muted rounded border border-amber-500/30">
                      <div className="flex items-center mb-2">
                        <div className="mr-3 relative">
                          <div className="w-8 h-8 border-4 border-amber-300/20 border-t-amber-500 rounded-full animate-spin"></div>
                        </div>
                        <div>
                          <p className="font-medium text-amber-500">VM is starting</p>
                          <p className="text-xs text-muted-foreground">Connection will be available in {getRemainingSeconds('windows')} seconds</p>
                        </div>
                      </div>
                      <Progress value={vmStartProgress.windows} className="h-2" />
                    </div>
                  )}
                  
                  <Button 
                    className="w-full bg-primary/80 hover:bg-primary text-primary-foreground mt-4"
                    disabled={!canConnect.windows || getVmStatus('windows').toLowerCase() !== 'running' || !connectionUrls.windows}
                    onClick={handleConnect}
                  >
                    {loadingState.windows ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        Preparing connection...
                      </>
                    ) : getVmStatus('windows').toLowerCase() === 'running' ? (
                      'Connect to Desktop'
                    ) : (
                      'Start VM to Connect'
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="linux" className="border rounded-md border-input p-4 bg-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-primary/80 font-medium">Linux VM</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: {' '}
                        <span className={
                          getVmStatus('linux').toLowerCase() === 'running' ? 'text-green-500' : 
                          'text-amber-500'
                        }>
                          {getVmStatus('linux')}
                        </span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-input hover:bg-primary/20 hover:text-primary"
                        onClick={() => handleVmAction('Start')}
                        disabled={getVmStatus('linux').toLowerCase() === 'running' || actionInProgress || loadingState.linux}
                      >
                        {actionInProgress && activeOs === 'linux' ? (
                          <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        ) : null}
                        Start
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-input hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => handleVmAction('Stop')}
                        disabled={getVmStatus('linux').toLowerCase() !== 'running' || actionInProgress || loadingState.linux}
                      >
                        {actionInProgress && activeOs === 'linux' ? (
                          <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        ) : null}
                        Stop
                      </Button>
                    </div>
                  </div>
                  
                  {loadingState.linux && (
                    <div className="mt-3 p-3 bg-muted rounded border border-amber-500/30">
                      <div className="flex items-center mb-2">
                        <div className="mr-3 relative">
                          <div className="w-8 h-8 border-4 border-amber-300/20 border-t-amber-500 rounded-full animate-spin"></div>
                        </div>
                        <div>
                          <p className="font-medium text-amber-500">VM is starting</p>
                          <p className="text-xs text-muted-foreground">Connection will be available in {getRemainingSeconds('linux')} seconds</p>
                        </div>
                      </div>
                      <Progress value={vmStartProgress.linux} className="h-2" />
                    </div>
                  )}
                  
                  <Button 
                    className="w-full bg-primary/80 hover:bg-primary text-primary-foreground mt-4"
                    disabled={!canConnect.linux || getVmStatus('linux').toLowerCase() !== 'running' || !connectionUrls.linux}
                    onClick={handleConnect}
                  >
                    {loadingState.linux ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        Preparing connection...
                      </>
                    ) : getVmStatus('linux').toLowerCase() === 'running' ? (
                      'Connect to Desktop'
                    ) : (
                      'Start VM to Connect'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="glass-panel border-primary/10 h-full">
          <CardHeader>
            <CardTitle className="text-xl text-primary/80 flex items-center">
              <Server className="mr-2 text-muted-foreground" size={20} />
              User Guide
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              How to use your virtual desktop environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border border-input rounded-md p-3 bg-card/50">
                <h4 className="text-primary/80 font-medium">Getting Started</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-2 list-disc pl-4">
                  <li>Start your desired VM using the controls on the left</li>
                  <li>Wait for the VM to initialize (approximately 1 minute)</li>
                  <li>Click 'Connect to Desktop' when available</li>
                  <li>Use your regular credentials to log in</li>
                </ul>
              </div>
              
              <div className="border border-input rounded-md p-3 bg-card/50">
                <h4 className="text-primary/80 font-medium">Best Practices</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-2 list-disc pl-4">
                  <li>Always shut down your VM when not in use</li>
                  <li>Save your work frequently</li>
                  <li>Report any connection or performance issues to your manager</li>
                  <li>Disconnect from the VM when taking extended breaks</li>
                </ul>
              </div>

              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full border-input hover:bg-background"
                  onClick={loadUserVMs}
                >
                  Refresh Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TesterVirtualDesktop;
