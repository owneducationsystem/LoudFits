import express from "express";
import { storage } from "../storage";
import { notificationService, NotificationType } from "../services/notificationService";

const router = express.Router();

// Route to handle Firebase authentication synchronization
router.post("/sync", async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;
    
    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: "Firebase UID and email are required"
      });
    }
    
    console.log(`[AUTH] Syncing Firebase auth: UID=${uid}, email=${email}`);
    
    // Find or create user in local database
    let user = await storage.getUserByFirebaseId(uid);
    
    if (!user) {
      // Try finding by email first
      user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update existing user with Firebase ID
        user = await storage.updateUser(user.id, { firebaseId: uid });
        console.log(`[AUTH] Updated existing user (${user.id}) with Firebase ID`);
      } else {
        // Create new user
        const username = email.split('@')[0] || `user_${Date.now()}`;
        user = await storage.createUser({
          email,
          username,
          password: `firebase_${Date.now()}`, // Create a random password as we're using Firebase auth
          firebaseId: uid,
          firstName: displayName || null
        });
        console.log(`[AUTH] Created new user (${user.id}) from Firebase auth`);
        
        // Send welcome notification
        notificationService.sendUserNotification({
          type: NotificationType.NEW_USER,
          title: "Welcome to Loudfits!",
          message: "Your account has been created successfully. Start shopping for stylish tees!",
          userId: user.id,
          entityId: user.id,
          entityType: 'user',
          priority: "high"
        }).catch(err => {
          console.error(`Error sending welcome notification: ${err.message}`);
        });
      }
    }
    
    if (user) {
      // Store user information in session for authentication
      if (req.session) {
        // @ts-ignore - TypeScript doesn't recognize custom session fields
        req.session.userId = user.id;
        // @ts-ignore
        req.session.firebaseUid = uid;
        // @ts-ignore
        req.session.isAuthenticated = true;
        
        console.log(`[AUTH] Session created for user ID ${user.id}`);
      }
      
      return res.status(200).json({
        success: true,
        userId: user.id,
        username: user.username,
        email: user.email
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to find or create user"
      });
    }
  } catch (error) {
    console.error("[AUTH] Firebase sync error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get current authenticated user from session
router.get("/current-user", (req, res) => {
  // @ts-ignore
  if (req.session && req.session.userId) {
    // @ts-ignore
    const userId = req.session.userId;
    
    storage.getUser(userId)
      .then(user => {
        if (user) {
          return res.status(200).json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            }
          });
        } else {
          // Clear invalid session
          // @ts-ignore
          req.session.userId = undefined;
          // @ts-ignore
          req.session.isAuthenticated = false;
          
          return res.status(401).json({
            success: false,
            message: "User not found"
          });
        }
      })
      .catch(error => {
        console.error("[AUTH] Error retrieving user:", error);
        return res.status(500).json({
          success: false,
          message: "Error retrieving user information"
        });
      });
  } else {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }
});

// Logout endpoint to clear session
router.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error("[AUTH] Session destruction error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to logout"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    });
  } else {
    return res.status(200).json({
      success: true,
      message: "No session to destroy"
    });
  }
});

export default router;