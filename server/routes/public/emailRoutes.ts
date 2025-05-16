import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

// Simple email testing endpoint that doesn't rely on the email service
router.post('/test-direct-email', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, message'
      });
    }
    
    // Create a transporter with Gmail settings
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Send a simple email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">${message}</div>`
    });
    
    console.log('Email sent directly:', info.messageId);
    
    return res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error('Error sending direct email:', error);
    
    return res.status(500).json({
      success: false,
      message: `Failed to send email: ${error.message}`,
      error: error.toString()
    });
  }
});

export default router;