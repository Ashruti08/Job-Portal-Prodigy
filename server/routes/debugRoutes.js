import express from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const debugRouter = express.Router();

// Debug route to check current user info from Clerk
debugRouter.get("/clerk-user", authMiddleware, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    console.log("Fetching Clerk user:", clerkUserId);
    
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    console.log("Clerk user data:", clerkUser);
    
    // Check if user exists in database
    const dbUser = await User.findById(clerkUserId);
    console.log("Database user:", dbUser);
    
    res.json({
      success: true,
      clerkUser: {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddresses: clerkUser.emailAddresses,
        imageUrl: clerkUser.imageUrl,
        createdAt: clerkUser.createdAt,
      },
      dbUser: dbUser,
      exists: !!dbUser
    });
  } catch (error) {
    console.error("Debug route error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to manually sync current user from Clerk to database
debugRouter.post("/sync-user", authMiddleware, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    console.log("Syncing user:", clerkUserId);
    
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    console.log("Clerk user for sync:", clerkUser);
    
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                 clerkUser.primaryEmailAddressId || 
                 "user@example.com";
    
    const name = clerkUser.firstName && clerkUser.lastName 
                 ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
                 : clerkUser.firstName || clerkUser.lastName || "User";
    
    const image = clerkUser.imageUrl || "\default-avatar.png";
    
    const userData = {
      _id: clerkUserId,
      name: name,
      email: email,
      image: image,
      resume: ""
    };
    
    console.log("Creating/updating user with data:", userData);
    
    // Use upsert to create or update
    const user = await User.findByIdAndUpdate(
      clerkUserId, 
      userData, 
      { 
        new: true, 
        upsert: true, // Create if doesn't exist
        runValidators: true 
      }
    );
    
    console.log("User synced successfully:", user);
    
    res.json({
      success: true,
      message: "User synced successfully",
      user: user
    });
  } catch (error) {
    console.error("Sync user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to check all users in database
debugRouter.get("/all-users", async (req, res) => {
  try {
    const users = await User.find({}).limit(10);
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
  // Replace the setTimeout with:

});

export default debugRouter;