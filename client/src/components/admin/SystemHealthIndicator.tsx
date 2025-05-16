import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Wifi, Database, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SystemHealthProps {
  websocketConnected: boolean;
}

interface HealthStatus {
  database: boolean;
  email: boolean;
  websocket: boolean;
  lastChecked: string;
}

export const SystemHealthIndicator: React.FC<SystemHealthProps> = ({ websocketConnected }) => {
  const [health, setHealth] = useState<HealthStatus>({
    database: true,
    email: true,
    websocket: websocketConnected,
    lastChecked: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/admin/health');
        const healthData = await response.json();
        
        setHealth({
          ...healthData,
          websocket: websocketConnected, // Use the websocket status from props
        });
      } catch (error) {
        console.error('Error checking system health:', error);
        // If we can't fetch health data, assume there are issues
        setHealth({
          database: false,
          email: true, // Keep email as true since it's less critical
          websocket: websocketConnected,
          lastChecked: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    // Check health initially and then every 30 seconds
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);

    return () => clearInterval(interval);
  }, [websocketConnected]);

  // Update websocket status when prop changes
  useEffect(() => {
    setHealth(prev => ({
      ...prev,
      websocket: websocketConnected
    }));
  }, [websocketConnected]);

  // Calculate overall system status
  const getOverallStatus = () => {
    const criticalSystems = [health.database, health.websocket];
    const allSystemsUp = criticalSystems.every(status => status === true);
    const anyCriticalDown = criticalSystems.some(status => status === false);
    
    if (allSystemsUp && health.email) {
      return { status: 'operational', label: 'All Systems Operational', color: 'text-green-500' };
    } else if (anyCriticalDown) {
      return { status: 'critical', label: 'Critical Issues Detected', color: 'text-red-500' };
    } else {
      return { status: 'warning', label: 'Some Services Degraded', color: 'text-amber-500' };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">System Health</CardTitle>
        <CardDescription>Real-time monitoring of services</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className={`flex items-center justify-between border-b pb-2 mb-2 ${overallStatus.color}`}>
              <span className="font-medium">{overallStatus.label}</span>
              {overallStatus.status === 'operational' ? (
                <CheckCircle className="h-5 w-5" />
              ) : overallStatus.status === 'critical' ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  <span className="text-sm">Database</span>
                </div>
                {health.database ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wifi className="h-4 w-4 mr-2" />
                  <span className="text-sm">Real-time Connection</span>
                </div>
                {health.websocket ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">Email Service</span>
                </div>
                {health.email ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-right">
              Last checked: {new Date(health.lastChecked).toLocaleTimeString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthIndicator;