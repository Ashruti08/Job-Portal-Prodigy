import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Create the auth middleware
export const authMiddleware = ClerkExpressRequireAuth({
  // Optional: You can add custom error handling here
  onError: (error) => {
    console.error('Clerk authentication error:', error);
    return {
      status: 401,
      message: 'Authentication failed'
    };
  }
});

// Alternative manual JWT verification if you prefer (keep this as backup)
export const manualAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authorization token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    // Import Clerk's verifyToken function
    const { verifyToken } = await import('@clerk/clerk-sdk-node');
    
    // Verify the token
    const payload = await verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY, // Make sure this is set in your .env
    });

    // Attach the verified payload to request
    req.auth = {
      userId: payload.sub, // Clerk uses 'sub' for user ID
      sessionClaims: payload
    };

    console.log('Auth middleware - User ID:', req.auth.userId);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};