import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Updated auth middleware that properly extracts Clerk data
export const authMiddleware = (req, res, next) => {
  ClerkExpressRequireAuth({
    onError: (error) => {
      console.error('Clerk authentication error:', error);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  })(req, res, (err) => {
    if (err) {
      console.error('Clerk auth middleware error:', err);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    // Log the complete auth object to debug
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('req.auth:', JSON.stringify(req.auth, null, 2));
    
    // Ensure we have the user ID
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'No valid user session found'
      });
    }

    // The sessionClaims should contain all the user data
    console.log('User ID:', req.auth.userId);
    console.log('Session Claims:', JSON.stringify(req.auth.sessionClaims, null, 2));

    next();
  });
};

// Alternative middleware if the above doesn't work - uses Clerk's getAuth
export const alternativeAuthMiddleware = async (req, res, next) => {
  try {
    const { getAuth } = await import('@clerk/clerk-sdk-node');
    
    // Get auth from Clerk
    const auth = getAuth(req);
    
    console.log('=== ALTERNATIVE AUTH DEBUG ===');
    console.log('Auth object:', JSON.stringify(auth, null, 2));
    
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Attach auth data to request
    req.auth = auth;
    
    // Also try to get user data directly from Clerk
    try {
      const { clerkClient } = await import('@clerk/clerk-sdk-node');
      const user = await clerkClient.users.getUser(auth.userId);
      
      console.log('=== CLERK USER DATA ===');
      console.log('User object:', JSON.stringify(user, null, 2));
      
      // Attach user data to sessionClaims for consistency
      req.auth.sessionClaims = {
        ...req.auth.sessionClaims,
        email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        image_url: user.imageUrl,
        email_addresses: user.emailAddresses,
        ...user.publicMetadata,
        ...user.privateMetadata,
        ...user.unsafeMetadata
      };
      
      console.log('Enhanced session claims:', JSON.stringify(req.auth.sessionClaims, null, 2));
    } catch (userError) {
      console.error('Error fetching user data:', userError);
    }

    next();
  } catch (error) {
    console.error('Alternative auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};