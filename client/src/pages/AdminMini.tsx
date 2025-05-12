import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminHeader from '../components/admin/AdminHeader';
import BasicWebSocket from '../components/admin/BasicWebSocket';

// Extremely simplified admin panel with WebSocket
const AdminMini: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Mini Admin" />
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Minimal Admin Panel</h1>
          <BasicWebSocket />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">This is a minimal WebSocket implementation that only shows connection status.</p>
              <BasicWebSocket />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>About This Page</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This is the simplest possible implementation of a WebSocket connection.
                It uses the absolute minimum amount of code needed.
              </p>
              <p className="mb-4">
                No registration, no reconnect logic, no complex state management.
                Just a simple WebSocket connection that shows if it's connected or not.
              </p>
              <div className="flex justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Force a page reload to test WebSocket connection
                    window.location.reload();
                  }}
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminMini;