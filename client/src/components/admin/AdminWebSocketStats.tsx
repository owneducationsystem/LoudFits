import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ActivitySquare, Users, Wifi, Timer } from 'lucide-react';

interface WebSocketStats {
  totalConnections: number;
  activeConnections: {
    total: number;
    byType: Record<string, number>;
  };
  recentConnections: string[];
  serverUptime: number;
  timestamp: string;
}

export function AdminWebSocketStats() {
  const { data, isLoading, error } = useQuery<WebSocketStats>({
    queryKey: ['/api/admin/ws-stats'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Format server uptime from seconds to human-readable format
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Wifi className="h-5 w-5 mr-2" />
            WebSocket Status
          </CardTitle>
          <CardDescription>Loading connection statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={33} className="h-2 my-4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="shadow-sm border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Wifi className="h-5 w-5 mr-2" />
            WebSocket Status
          </CardTitle>
          <CardDescription>Error loading connection data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to fetch WebSocket stats'}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate connection rate as percentage of active connections to total tracked connections
  const connectionRate = Math.round((data.activeConnections.total / Math.max(data.totalConnections, 1)) * 100);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Wifi className="h-5 w-5 mr-2" />
          WebSocket Status
        </CardTitle>
        <CardDescription>Real-time connection statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Connection Rate</span>
              <span className="text-sm font-medium">{connectionRate}%</span>
            </div>
            <Progress value={connectionRate} className="h-2" />
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-secondary/40 p-2 rounded-md">
              <ActivitySquare className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Active</div>
                <div className="font-medium">{data.activeConnections.total}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-secondary/40 p-2 rounded-md">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-medium">{data.totalConnections}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-secondary/40 p-2 rounded-md">
              <Wifi className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Admin Clients</div>
                <div className="font-medium">{data.activeConnections.byType?.admin || 0}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-secondary/40 p-2 rounded-md">
              <Timer className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Uptime</div>
                <div className="font-medium">{formatUptime(data.serverUptime)}</div>
              </div>
            </div>
          </div>
          
          {/* Recent Connections */}
          {data.recentConnections.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Connections</h4>
              <div className="flex flex-wrap gap-2">
                {data.recentConnections.map((client, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {client}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground text-right">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminWebSocketStats;