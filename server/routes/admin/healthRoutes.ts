import { Request, Response } from 'express';
import { storage } from '../../storage';
import { emailService } from '../../services/emailService';

export const getSystemHealth = async (req: Request, res: Response) => {
  const healthStatus = {
    database: true,
    email: true,
    websocket: true,
    lastChecked: new Date().toISOString()
  };

  // Check database connection by running a simple query
  try {
    await storage.countUsers();
  } catch (error) {
    console.error("Database health check failed:", error);
    healthStatus.database = false;
  }

  // Check email functionality
  try {
    // Just validate if email environment variables are set - don't actually send test emails
    const emailConfigured = process.env.EMAIL_USER && 
                           process.env.EMAIL_PASSWORD && 
                           process.env.EMAIL_FROM;
    
    healthStatus.email = !!emailConfigured;
  } catch (error) {
    console.error("Email health check failed:", error);
    healthStatus.email = false;
  }

  // WebSocket status is managed client-side through the notification context
  // as we don't want to check it on every health request

  res.json(healthStatus);
};