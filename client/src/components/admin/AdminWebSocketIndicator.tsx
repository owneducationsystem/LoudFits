import React from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminWebSocketIndicatorProps {
  className?: string;
  showLabel?: boolean;
  // These props are for backward compatibility
  connected?: boolean;
  registered?: boolean;
  adminId?: number;
}

export function AdminWebSocketIndicator({ 
  className, 
  showLabel = false 
}: AdminWebSocketIndicatorProps) {
  const { connected, registered, reconnect } = useWebSocket();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-2 cursor-pointer", 
              className
            )}
            onClick={() => !connected && reconnect()}
          >
            <div className="relative">
              {connected ? (
                <>
                  <Wifi 
                    className="h-5 w-5 text-emerald-500" 
                    aria-hidden="true" 
                  />
                  {registered ? (
                    <CheckCircle 
                      className="h-3 w-3 text-emerald-500 absolute -top-1 -right-1" 
                      aria-hidden="true" 
                    />
                  ) : (
                    <AlertCircle 
                      className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" 
                      aria-hidden="true" 
                    />
                  )}
                </>
              ) : (
                <>
                  <WifiOff 
                    className="h-5 w-5 text-destructive" 
                    aria-hidden="true" 
                  />
                  <RefreshCw 
                    className="h-3 w-3 text-muted-foreground absolute -top-1 -right-1 animate-spin" 
                    aria-hidden="true" 
                  />
                </>
              )}
            </div>
            {showLabel && (
              <span className={cn(
                "text-sm font-medium",
                connected 
                  ? registered 
                    ? "text-emerald-500" 
                    : "text-amber-500" 
                  : "text-destructive"
              )}>
                {connected 
                  ? registered 
                    ? "Connected" 
                    : "Connecting..." 
                  : "Disconnected"}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {connected 
              ? registered 
                ? "WebSocket connected and registered" 
                : "WebSocket connected but not registered"
              : "WebSocket disconnected. Click to reconnect"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AdminWebSocketIndicator;