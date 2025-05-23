
import React from 'react';
import { Button } from '@/components/ui/button';
import { Power, RefreshCw, ExternalLink } from 'lucide-react';

interface VMTableActionsProps {
  vmId: string;
  status: string;
  instanceOs: string;
  employeeId: string;
  actionLoading: string | null;
  onAction: (vmId: string, action: string, instanceOs: string, employeeId: string) => void;
  onViewDetails: () => void;
  guacamoleUrl?: string;
}

export const VMTableActions = ({ 
  vmId, 
  status, 
  instanceOs,
  employeeId,
  actionLoading, 
  onAction, 
  onViewDetails,
  guacamoleUrl
}: VMTableActionsProps) => {
  
  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (guacamoleUrl) {
      window.open(guacamoleUrl, '_blank');
    }
  };

  // Convert status to lowercase for consistent comparison
  const vmStatus = status.toLowerCase();
  
  return (
    <div className="flex space-x-1">
      {vmStatus === 'running' ? (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-primary/30 hover:bg-destructive/20 hover:text-destructive"
            onClick={() => onAction(vmId, 'Stop', instanceOs, employeeId)}
            disabled={actionLoading === vmId}
            title="Stop VM"
          >
            {actionLoading === vmId ? (
              <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Power className="h-4 w-4" />
            )}
          </Button>
          
          {guacamoleUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-primary/30 hover:bg-green-500/20 hover:text-green-500"
              onClick={handleConnect}
              title="Connect to VM"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border-primary/30 hover:bg-green-500/20 hover:text-green-500"
          onClick={() => onAction(vmId, 'Start', instanceOs, employeeId)}
          disabled={actionLoading === vmId}
          title="Start VM"
        >
          {actionLoading === vmId ? (
            <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2" fill="currentColor" />
            </svg>
          )}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 border-primary/30 hover:bg-primary/20 hover:text-primary"
        onClick={onViewDetails}
        title="View Details"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </Button>
      {(vmStatus === 'error' || vmStatus === 'running') && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border-primary/30 hover:bg-blue-500/20 hover:text-blue-500"
          onClick={() => onAction(vmId, 'Restart', instanceOs, employeeId)}
          disabled={actionLoading === vmId}
          title="Restart VM"
        >
          {actionLoading === vmId ? (
            <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};
