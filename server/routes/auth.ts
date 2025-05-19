import express, { Request, Response } from "express";
import { storage } from "../storage";
import { notificationService, NotificationType } from "../services/notificationService";
import { emailService } from "../services/emailService";

// Auth routes
const router = express.Router();

// Firebase token verification and session setup
router.post("/verify-token", async (req, res) => {
  try {
    const { firebaseId, email, displayName } = req.body;
    
    if (!firebaseId) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID is required"
      });
    }
    
    console.log(`[AUTH] Verifying Firebase user: ID=${firebaseId}, email=${email}`);
    
    // Find or create user in database
    let user = await storage.getUserByFirebaseId(firebaseId);
    
    if (!user && email) {
      // Try finding by email
      user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update existing user with Firebase ID
        user = await storage.updateUser(user.id, { firebaseId });
        console.log(`[AUTH] Updated existing user (${user.id}) with Firebase ID`);
      } else {
        // Create new user
        user = await storage.createUser({
          email,
          username: email?.split('@')[0] || `user_${Date.now()}`,
          firebaseId,
          displayName: displayName || '',
          isAdmin: false,
          isActive: true,
          password: '', // Not used with Firebase auth
        });
        console.log(`[AUTH] Created new user (${user.id}) from Firebase auth`);
        
        // Send welcome notification
        notificationService.sendUserNotification({
          type: NotificationType.ACCOUNT,
          title: "Welcome to Loudfits!",
          message: "Your account has been created successfully. Start shopping for stylish tees!",
          userId: user.id,
          entityId: user.id,
          entityType: 'user',
          priority: "high"
        }).catch(err => {
          console.error(`Error sending welcome notification: ${err.message}`);
        });
        
        // Send welcome email
        if (email) {
          emailService.sendWelcomeEmail(email, displayName || 'Valued Customer').catch(err => {
            console.error(`Error sending welcome email: ${err.message}`);
          });
        }
      }
    }
    
    if (user) {
      // Set authenticated user on request
      req.user = user;
      
      // Create user session
      if (req.session) {
        req.session.userId = user.id;
        req.session.isAdmin = user.isAdmin || false;
        console.log(`[AUTH] Session created for user ID ${user.id}`);
      }
      
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
  } catch (error) {
    console.error("[AUTH] Error in token verification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication"
    });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("[AUTH] Error destroying session:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to logout"
        });
      }
      
      res.clearCookie("connect.sid");
      return res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    });
  } else {
    return res.status(200).json({
      success: true,
      message: "No active session"
    });
  }
});

// Get current user
router.get("/current-user", (req, res) => {
  if (req.user) {
    const { id, email, username, displayName, isAdmin } = req.user;
    return res.status(200).json({
      success: true,
      user: { id, email, username, displayName, isAdmin }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }
});

export default router;