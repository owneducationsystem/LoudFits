import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { connectWebSocket, subscribeToWebSocket } from '@/lib/globalWebSocket';

interface GlobalWebSocketTestProps {
  label?: string;
}

/**
 * A simple, reliable WebSocket component to add to any admin page
 * Uses the global WebSocket singleton for persistent connection
 */
const GlobalWebSocketTest: React.FC<GlobalWebSocketTestProps> = ({ label = "WebSocket" }) => {
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  // Subscribe to global WebSocket connection status
  useEffect(() => {
    const unsubscribe = subscribeToWebSocket((isConnected) => {
      setConnected(isConnected);
      
      // Show toast when connection status changes
      if (isConnected) {
        toast({
          title: 'WebSocket Connected',
          description: 'Real-time updates are now enabled'
        });
      } else {
        toast({
          title: 'WebSocket Disconnected',
          description: 'Attempting to reconnect...',
          variant: 'destructive'
        });
      }
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [toast]);

  // Simple UI to show connection status
  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <Badge className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
          <Wifi className="h-3 w-3" />
          <span>{label} Connected</span>
        </Badge>
      ) : (
        <Badge className="flex items-center gap-1 bg-red-500 hover:bg-red-600">
          <WifiOff className="h-3 w-3" />
          <span>{label} Disconnected</span>
        </Badge>
      )}
      
      <Button 
        size="sm" 
        variant="outline" 
        className="h-7 px-2 text-xs"
        onClick={() => connectWebSocket()}
      >
        Reconnect
      </Button>
    </div>
  );
};

export default GlobalWebSocketTest;