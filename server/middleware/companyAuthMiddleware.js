import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';

// Company Authentication Middleware - for company JWT tokens
export const companyAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from headers - your frontend sends it as 'token'
    const token = req.headers.token;
    
    console.log('Company auth middleware - Token received:', !!token);
    
    if (!token) {
      console.log('No company token provided');
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated - No token provided'
      });
    }

    try {
      // Verify the JWT token using your JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Company token decoded successfully');
      
      // Find the company
      const company = await Company.findById(decoded.id);
      
      if (!company) {
        console.log('Company not found for ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'Unauthenticated - Company not found'
        });
      }

      // Attach company to request object (this is what your controller expects)
      req.company = company;
      console.log('Company authenticated:', company.name);
      
      next();
    } catch (jwtError) {
      console.log('Company JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated - Invalid or expired token'
      });
    }
    
  } catch (error) {
    console.error('Company auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export default companyAuthMiddleware;