import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { WebSocketProvider, useWebSocket } from '@/context/WebSocketContext';

interface GlobalWebSocketIndicatorProps {
  showControls?: boolean;
}

/**
 * A component that shows the status of the global WebSocket connection
 */
const GlobalWebSocketIndicatorInner: React.FC<GlobalWebSocketIndicatorProps> = ({
  showControls = true
}) => {
  const { connected, registered, reconnect, adminId, setAdminId } = useWebSocket();
  
  if (!showControls) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <Badge className="flex items-center gap-1 bg-green-500">
          <Wifi className="h-3 w-3" />
          <span>Connected</span>
        </Badge>
      ) : (
        <Badge className="flex items-center gap-1 bg-red-500">
          <WifiOff className="h-3 w-3" />
          <span>Disconnected</span>
        </Badge>
      )}
      
      {registered && (
        <Badge className="bg-blue-500">ID: {adminId}</Badge>
      )}
      
      {showControls && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={reconnect} 
          className="h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
};

/**
 * A wrapper component that ensures the WebSocketProvider is available
 */
const GlobalWebSocketIndicator: React.FC<GlobalWebSocketIndicatorProps> = (props) => {
  // We can't check for the provider this way because hooks can't be called conditionally
  // Instead, we'll wrap it in a try/catch block
  try {
    // This will throw an error if WebSocketProvider is not in context
    useWebSocket();
    return <GlobalWebSocketIndicatorInner {...props} />;
  } catch (error) {
    // If WebSocketProvider is not available, create a standalone one
    console.log('WebSocketProvider not found in context, creating a local one');
    return (
      <WebSocketProvider>
        <GlobalWebSocketIndicatorInner {...props} />
      </WebSocketProvider>
    );
  }
};

export default GlobalWebSocketIndicator;