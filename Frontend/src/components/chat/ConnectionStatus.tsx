
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnecting: boolean;
}

// This is now a simplified version that just shows a loading indicator
const ConnectionStatus = ({ isConnecting }: ConnectionStatusProps) => {
  if (isConnecting) {
    return (
      <div className="flex items-center text-xs text-warm-200 gap-1">
        <Wifi className="h-3 w-3 animate-pulse" />
        <span>Connecting...</span>
      </div>
    );
  }
  
  return null;
};

export default ConnectionStatus;
