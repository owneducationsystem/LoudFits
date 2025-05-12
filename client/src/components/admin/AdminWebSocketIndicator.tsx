import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';

interface AdminWebSocketIndicatorProps {
  connected: boolean;
  registered: boolean;
  adminId?: number;
}

const AdminWebSocketIndicator: React.FC<AdminWebSocketIndicatorProps> = ({
  connected,
  registered,
  adminId,
}) => {
  const getStatusColor = () => {
    if (connected && registered) return 'text-green-500';
    if (connected) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (connected && registered) {
      return <CheckCircle2 className={`w-4 h-4 ${getStatusColor()}`} />;
    }
    if (connected) {
      return <AlertCircle className={`w-4 h-4 ${getStatusColor()}`} />;
    }
    return <WifiOff className={`w-4 h-4 ${getStatusColor()}`} />;
  };

  const getStatusText = () => {
    if (connected && registered) {
      return `Connected to WebSocket (Admin ID: ${adminId})`;
    }
    if (connected) {
      return 'Connected but not registered as admin yet';
    }
    return 'Disconnected from WebSocket server';
  };
  
  const getStatusBadge = () => {
    const baseClasses = "text-xs font-medium px-2 py-1 rounded-full";
    
    if (connected && registered) {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    if (connected) {
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
    return `${baseClasses} bg-red-100 text-red-800`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center cursor-help">
            {getStatusIcon()}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {connected && registered ? 'Connected' : connected ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col items-center p-1">
            <div className={getStatusBadge()}>
              {connected && registered 
                ? 'Real-time connection active' 
                : connected 
                ? 'Partially connected' 
                : 'Connection offline'}
            </div>
            <p className="text-xs mt-1">{getStatusText()}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AdminWebSocketIndicator;