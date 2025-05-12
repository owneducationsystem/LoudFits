import React from 'react';
import { useAdminWebSocket } from '@/hooks/use-admin-websocket';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AdminWebSocketIndicatorProps {
  adminId: number;
}

const AdminWebSocketIndicator: React.FC<AdminWebSocketIndicatorProps> = ({ adminId }) => {
  const { connected, registered, reconnect } = useAdminWebSocket({
    adminId,
    autoConnect: true,
  });

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-1 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">
                {registered ? '(Registered)' : ''}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p>WebSocket Status: {connected ? 'Connected' : 'Disconnected'}</p>
              <p>Admin Registration: {registered ? 'Registered' : 'Not Registered'}</p>
              <p>Admin ID: {adminId}</p>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={reconnect}
              className="p-1 rounded-full hover:bg-muted flex items-center justify-center"
              aria-label="Reconnect WebSocket"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Reconnect WebSocket</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default AdminWebSocketIndicator;