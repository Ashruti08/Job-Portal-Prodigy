import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';
import SubUser from '../models/SubUser.js';  // ADD THIS IMPORT

// Company Authentication Middleware - for company JWT tokens AND sub-users
export const companyAuthMiddleware = async (req, res, next) => {
  try {
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
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully');
      
      // ========== NEW: CHECK IF SUB-USER ==========
      if (decoded.isSubUser) {
        // This is a sub-user login
        const subUser = await SubUser.findById(decoded.id);
        
        if (!subUser) {
          return res.status(401).json({
            success: false,
            message: 'Sub-user not found'
          });
        }

        // Get parent company
        const company = await Company.findById(decoded.parentCompanyId);
        
        if (!company) {
          return res.status(401).json({
            success: false,
            message: 'Parent company not found'
          });
        }

        // Attach to request object
        req.company = company;
        req.companyId = decoded.parentCompanyId; // Parent company ID
        req.isSubUser = true;
        req.subUserRole = decoded.roleType; // hr, consultancy, management
        req.subUserId = decoded.id;
        req.subUserName = subUser.name;
        
        console.log('Sub-user authenticated:', subUser.name, 'Role:', decoded.roleType);
        return next();
      }
      
      // ========== ORIGINAL: MAIN COMPANY LOGIN ==========
      // Find the company (original logic)
      const company = await Company.findById(decoded.id);
      
      if (!company) {
        console.log('Company not found for ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'Unauthenticated - Company not found'
        });
      }

      // Attach company to request object
      req.company = company;
      req.companyId = decoded.id; // Main company ID
      req.isSubUser = false; // This is main company
      
      console.log('Company authenticated:', company.name);
      next();
      
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
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
export const blockSubUsers = (req, res, next) => {
  // Check if the authenticated user is a sub-user
  if (req.isSubUser) {
    const roleType = req.subUserRole || 'Sub-user';
    return res.status(403).json({
      success: false,
      message: `${roleType.toUpperCase()} users do not have permission to perform this action. Only main recruiters can access this feature.`
    });
  }
  
  // If not a sub-user (i.e., main recruiter), allow the request
  next();
};
export const blockSubUserStatusChange = (req, res, next) => {
  if (req.isSubUser) {
    return res.status(403).json({
      success: false,
      message: `${req.subUserRole?.toUpperCase() || 'Sub-user'} users cannot accept or reject applications. You can only view and assess candidates.`
    });
  }
  next();
};