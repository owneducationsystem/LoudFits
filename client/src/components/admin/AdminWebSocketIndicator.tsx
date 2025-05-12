import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useAdminWebSocket } from '@/hooks/use-admin-websocket';

interface AdminWebSocketIndicatorProps {
  adminId?: number;
  showControls?: boolean;
}

/**
 * A simple WebSocket connection indicator for admin pages
 */
const AdminWebSocketIndicator: React.FC<AdminWebSocketIndicatorProps> = ({
  adminId = 1,
  showControls = true
}) => {
  // Use our custom hook for WebSocket functionality
  const { connected, registered, reconnect, setAdminId } = useAdminWebSocket({
    adminId,
    autoConnect: true
  });
  
  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <Badge className="flex items-center gap-1 bg-green-500 text-white">
          <Wifi className="h-3 w-3" />
          <span>{registered ? 'Connected' : 'Connecting...'}</span>
        </Badge>
      ) : (
        <Badge className="flex items-center gap-1 bg-red-500 text-white">
          <WifiOff className="h-3 w-3" />
          <span>Disconnected</span>
        </Badge>
      )}
      
      {registered && (
        <Badge className="bg-blue-500 text-white">ID: {adminId}</Badge>
      )}
      
      {showControls && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={reconnect} 
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
};

export default AdminWebSocketIndicator;