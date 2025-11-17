import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    console.log("=== Webhook received ===");
    console.log("Headers:", req.headers);
   

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
        
        // More robust email extraction - DON'T use fallback email to avoid duplicates
        const email = data.email_addresses?.[0]?.email_address || 
                     data.primary_email_address || 
                     data.email || 
                     `${data.id}@clerk.user`; // Use unique fallback based on Clerk ID
        
        const firstName = data.first_name || "";
        const lastName = data.last_name || "";
        const name = `${firstName} ${lastName}`.trim() || 
                     data.username || 
                     `User_${data.id.slice(-8)}`; // Unique name fallback
        
        const image = data.image_url || 
                     data.profile_image_url || 
                     "/default-avatar.png";

        const userData = {
          _id: data.id,
          email: email,
          name: name,
          image: image,
          resume: "",
        };

        console.log("Creating user with data:", userData);

        try {
          // Use upsert to handle duplicates gracefully
          const user = await User.findByIdAndUpdate(
            data.id, 
            userData, 
            { 
              upsert: true, 
              new: true, 
              runValidators: false // Disable validators to avoid issues with fallback data
            }
          );
          console.log("User created/updated successfully:", user._id);
        } catch (dbError) {
          console.error("Database error:", dbError);
          
          // If there's still an error, try to find and update existing user
          try {
            const existingUser = await User.findById(data.id);
            if (existingUser) {
              console.log("User already exists, skipping creation");
            } else {
              // Last resort - create with minimal data
              await User.create({
                _id: data.id,
                name: `User_${data.id.slice(-8)}`,
                email: `${data.id}@clerk.user`,
                image: "/default-avatar.png",
                resume: ""
              });
              console.log("User created with minimal fallback data");
            }
          } catch (finalError) {
            console.error("Final attempt failed:", finalError);
          }
        }

        res.json({ received: true });
        break;
      }

      case "user.updated": {
        console.log("Processing user.updated event");
        
        // Only update if we have real email data
        const email = data.email_addresses?.[0]?.email_address || 
                     data.primary_email_address_id;
        
        const firstName = data.first_name || "";
        const lastName = data.last_name || "";
        const name = `${firstName} ${lastName}`.trim();
        const image = data.image_url || data.profile_image_url;

        // Only include fields that have actual values
        const updateData = {};
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (image) updateData.image = image;

        console.log("Updating user with data:", updateData);

        try {
          if (Object.keys(updateData).length > 0) {
            const updatedUser = await User.findByIdAndUpdate(data.id, updateData, { new: true });
            if (updatedUser) {
              console.log("User updated successfully");
            } else {
              console.log("User not found for update");
            }
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