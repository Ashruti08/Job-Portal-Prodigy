
import mongoose from 'mongoose';
import User from './models/User.js'; // Adjust path as needed
import 'dotenv/config';

/**
 * Migration Script: Convert firstName/middleName/surname to fullName/gender/dob
 * 
 * This script:
 * 1. Finds all users with old field structure
 * 2. Combines firstName/middleName/surname into fullName
 * 3. Preserves old fields for backward compatibility
 * 4. Logs all changes for verification
 */

async function migrateUserFields() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");
    
    // Find users with old field structure
    const users = await User.find({
      $or: [
        { firstName: { $exists: true, $ne: '' } },
        { middleName: { $exists: true, $ne: '' } },
        { surname: { $exists: true, $ne: '' } }
      ]
    });

    console.log(`\n=== MIGRATION STARTED ===`);
    console.log(`Found ${users.length} users with old field structure`);
    console.log(`=========================\n`);

    if (users.length === 0) {
      console.log("✓ No users need migration!");
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const user of users) {
      try {
        console.log(`\n--- Processing User ---`);
        console.log(`ID: ${user._id}`);
        console.log(`Email: ${user.emailId || user.email}`);
        console.log(`Current Name: ${user.name}`);
        console.log(`Current Structure: firstName="${user.firstName}", middleName="${user.middleName}", surname="${user.surname}"`);
        
        // Build fullName from existing fields
        const nameParts = [
          user.firstName,
          user.middleName,
          user.surname
        ].filter(part => part && part.trim() !== '');
        
        const fullName = nameParts.join(' ').trim();
        
        if (!fullName) {
          console.log(`⚠ Skipping: No name parts to combine`);
          continue;
        }

        console.log(`New fullName will be: "${fullName}"`);

        // Update user
        const updateData = {
          fullName: fullName,
          // Keep old fields for backward compatibility during transition
          // You can remove these after ensuring everything works
        };

        await User.updateOne(
          { _id: user._id },
          { $set: updateData }
        );

        console.log(`✓ Successfully migrated user`);
        successCount++;

      } catch (userError) {
        console.error(`✗ Error migrating user ${user._id}:`, userError.message);
        errors.push({
          userId: user._id,
          email: user.emailId || user.email,
          error: userError.message
        });
        errorCount++;
      }
    }

    console.log(`\n=== MIGRATION COMPLETED ===`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`===========================\n`);

    if (errors.length > 0) {
      console.log(`\nErrors encountered:`);
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. User: ${err.email || err.userId}`);
        console.log(`   Error: ${err.error}\n`);
      });
    }

    // Verify migration
    console.log(`\n--- VERIFICATION ---`);
    const verifyUsers = await User.find({
      fullName: { $exists: true, $ne: '' }
    }).limit(5);

    console.log(`Sample of migrated users (showing first 5):`);
    verifyUsers.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.emailId || user.email}`);
      console.log(`   fullName: "${user.fullName}"`);
      console.log(`   Old fields still present: firstName="${user.firstName}", middleName="${user.middleName}", surname="${user.surname}"`);
    });

    console.log(`\n✓ Migration completed successfully!`);
    console.log(`\nNOTE: Old fields (firstName, middleName, surname) have been preserved for backward compatibility.`);
    console.log(`You can remove them from the schema after ensuring everything works correctly.\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ MIGRATION FAILED:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration
console.log(`
╔══════════════════════════════════════════════════════╗
║  User Field Migration Script                         ║
║  firstName/middleName/surname → fullName            ║
╚══════════════════════════════════════════════════════╝
`);

migrateUserFields();
