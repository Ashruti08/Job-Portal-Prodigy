import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    console.log("=== Webhook received ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const reqBody = req.body;
    
    if (!reqBody) {
      console.error("Missing request body");
      return res.status(400).json({ error: "Missing request body" });
    }

    const { data, type } = reqBody;
    
    if (!data || !type) {
      console.error("Invalid request body - missing data or type");
      return res.status(400).json({ error: "Invalid request body" });
    }

    console.log("Event type:", type);
    console.log("User data:", data);

    // Verify webhook signature
    try {
      await webhook.verify(JSON.stringify(reqBody), {
        "svix-id": req.headers["svix-id"],
        "svix-timestamp": req.headers["svix-timestamp"],
        "svix-signature": req.headers["svix-signature"],
      });
      console.log("Webhook signature verified");
    } catch (verifyError) {
      console.error("Webhook verification failed:", verifyError);
      return res.status(401).json({ error: "Webhook verification failed" });
    }

    switch (type) {
      case "user.created": {
        console.log("Processing user.created event");
        console.log("Full data object:", JSON.stringify(data, null, 2));
        
        // More robust email extraction - handle Clerk's actual structure
        const email = data.email_addresses?.[0]?.email_address || 
                     data.primary_email_address || 
                     data.email || 
                     "user@example.com"; // Fallback
        
        const firstName = data.first_name || "";
        const lastName = data.last_name || "";
        const name = `${firstName} ${lastName}`.trim() || data.username || "User";
        const image = data.image_url || 
                     data.profile_image_url || 
                     "\default-avatar.png"; // Fallback

        const userData = {
          _id: data.id,
          email: email,
          name: name,
          image: image,
          resume: "", // Empty string as per your model
        };

        console.log("Creating user with data:", userData);

        try {
          // Check if user already exists
          const existingUser = await User.findById(data.id);
          if (existingUser) {
            console.log("User already exists, updating instead");
            const updatedUser = await User.findByIdAndUpdate(data.id, userData, { 
              new: true, 
              runValidators: true 
            });
            console.log("User updated:", updatedUser);
          } else {
            const newUser = await User.create(userData);
            console.log("User created successfully:", newUser);
          }
        } catch (dbError) {
          console.error("Database error creating user:", dbError);
          console.error("Error details:", dbError.message);
          
          // Try with absolute minimum required data
          try {
            const minimalUserData = {
              _id: data.id,
              name: name || "User",
              email: email || "user@example.com",
              image: "\default-avatar.png",
              resume: ""
            };
            
            await User.findByIdAndUpdate(data.id, minimalUserData, { 
              upsert: true, 
              new: true,
              runValidators: true
            });
            console.log("User created with minimal data");
          } catch (finalError) {
            console.error("Final attempt failed:", finalError);
          }
        }

        res.json({ received: true });
        break;
      }

      case "user.updated": {
        console.log("Processing user.updated event");
        
        const email = data.email_addresses?.[0]?.email_address || 
                     data.primary_email_address_id || 
                     "";
        
        const firstName = data.first_name || "";
        const lastName = data.last_name || "";
        const name = `${firstName} ${lastName}`.trim() || "User";
        const image = data.image_url || data.profile_image_url || "";

        const userData = {
          email: email,
          name: name,
          image: image,
        };

        console.log("Updating user with data:", userData);

        try {
          const updatedUser = await User.findByIdAndUpdate(data.id, userData, { new: true });
          if (updatedUser) {
            console.log("User updated successfully");
          } else {
            console.log("User not found for update, creating new user");
            // If user doesn't exist, create them
            await User.create({
              _id: data.id,
              ...userData,
              resume: ""
            });
          }
        } catch (dbError) {
          console.error("Database error updating user:", dbError);
        }

        res.json({ received: true });
        break;
      }

      case "user.deleted": {
        console.log("Processing user.deleted event");
        
        try {
          const deletedUser = await User.findByIdAndDelete(data.id);
          if (deletedUser) {
            console.log("User deleted successfully");
          } else {
            console.log("User not found for deletion");
          }
        } catch (dbError) {
          console.error("Database error deleting user:", dbError);
        }

        res.json({ received: true });
        break;
      }

      default:
        console.log("Unhandled event type:", type);
        res.status(400).json({ error: `Unhandled event type: ${type}` });
        break;
    }
  } catch (error) {
    console.error("Webhook error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ success: false, message: "Webhooks Error", error: error.message });
  }
};