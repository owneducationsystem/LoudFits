import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useAdminWebSocket } from '../../hooks/use-admin-websocket';

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
  const [showDetails, setShowDetails] = useState(false);
  
  // Use our custom WebSocket hook
  const { connected, registered, reconnect } = useAdminWebSocket({
    adminId,
    autoConnect: true
  });
  
  return (
    <div className="flex items-center space-x-2">
      {/* Status indicator */}
      <div 
        className="relative"
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <div 
          className={`w-3 h-3 rounded-full ${
            connected 
              ? registered 
                ? 'bg-green-500' 
                : 'bg-yellow-500'
              : 'bg-red-500'
          }`}
        />
        
        {/* Tooltip */}
        {showDetails && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              {connected 
                ? registered 
                  ? 'Connected and registered' 
                  : 'Connected, waiting for registration'
                : 'Disconnected'
              }
            </div>
          </div>
        )}
      </div>
      
      {/* Optional controls */}
      {showControls && (
        <Button
          variant="ghost"
          size="icon"
          onClick={reconnect}
          title="Reconnect WebSocket"
        >
          <RefreshCw className={`h-4 w-4 ${!connected ? 'text-red-500' : 'text-gray-500'}`} />
        </Button>
      )}
    </div>
  );
};

export default AdminWebSocketIndicator;