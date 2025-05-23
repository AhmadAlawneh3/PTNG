
import React from 'react';
import { VMStatus } from '@/services/vmManagementService';

interface VMStatusBadgeProps {
  status: VMStatus | string;
}

export const VMStatusBadge = ({ status }: VMStatusBadgeProps) => (
  <span className={`text-xs px-2 py-1 rounded-full ${
    status === 'Running' ? 'bg-green-400/20 text-green-400' : 
    status === 'Stopped' ? 'bg-cyber-gray/20 text-cyber-gray' :
    status === 'Paused' ? 'bg-yellow-400/20 text-yellow-400' :
    status === 'Starting' ? 'bg-blue-400/20 text-blue-400' :
    status === 'Stopping' ? 'bg-orange-400/20 text-orange-400' :
    'bg-cyber-red/20 text-cyber-red'
  }`}>
    {status}
  </span>
);
