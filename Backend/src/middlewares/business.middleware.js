const mongoose = require("mongoose");
const businessRepo = require("../repositories/business.repository");

/**
 * T6 - User-Business Mapping Middleware (Tenant Isolation Layer)
 * 
 * Attaches verified active `req.businessId`, `req.business`, and `req.businessRole`
 * to all downstream requests after validating authentication and business membership.
 */
const businessMiddleware = async (req, res, next) => {
  try {
    // 1. Ensure user is authenticated
    if (!req.user || !req.user.accountId) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required before accessing business resources.",
      });
    }

    const accountId = req.user.accountId;

    // 2. Extract business ID from request (Headers / Query / Cookie)
    let requestedBusinessId =
      req.headers["x-business-id"] ||
      req.headers["x-tenant-id"] ||
      req.cookies?.activeBusinessId ||
      null;

    let targetBusiness = null;
    let userRole = null;
    let membershipRecord = null;

    // Case A: Specific Business ID requested by Client
    if (requestedBusinessId) {
      if (!mongoose.Types.ObjectId.isValid(requestedBusinessId)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_BUSINESS_ID",
          message: "The provided business ID format is invalid.",
        });
      }

      // Check Business existence
      const business = await businessRepo.findBusinessById(requestedBusinessId);
      if (!business) {
        return res.status(404).json({
          success: false,
          code: "BUSINESS_NOT_FOUND",
          message: "Business does not exist or has been archived.",
        });
      }

      // Security check: Verify user is OWNER or active BusinessMember
      if (business.ownerId.toString() === accountId.toString()) {
        userRole = "OWNER";
      } else {
        const membership = await businessRepo.findBusinessMember({
          businessId: business._id,
          accountId,
        });

        if (!membership) {
          return res.status(403).json({
            success: false,
            code: "NO_ACCESS_TO_BUSINESS",
            message: "You do not have authorization to access this business context.",
          });
        }

        userRole = membership.role;
        membershipRecord = membership;
      }

      targetBusiness = business;
    } 
    // Case B: No specific business ID passed -> Auto-resolve user's active business
    else {
      // 1. Check owned businesses
      const ownedBusinesses = await businessRepo.findBusinessesByOwnerId(accountId);

      if (ownedBusinesses.length > 0) {
        targetBusiness = ownedBusinesses[0];
        userRole = "OWNER";
      } else {
        // 2. Check active memberships as staff/manager
        const memberships = await businessRepo.findMembershipsByAccountId(accountId);
        
        const validMembership = memberships.find(
          (m) => m.businessId && m.businessId.status !== "ARCHIVED"
        );

        if (validMembership) {
          targetBusiness = validMembership.businessId;
          userRole = validMembership.role;
          membershipRecord = validMembership;
        }
      }

      // If user has no active businesses at all -> Onboarding Gate
      if (!targetBusiness) {
        return res.status(403).json({
          success: false,
          code: "BUSINESS_ONBOARDING_REQUIRED",
          message: "No active business found for this account. Please complete business onboarding first.",
        });
      }
    }

    // 3. Attach trusted tenant context to Request object
    req.businessId = targetBusiness._id.toString();
    req.business = targetBusiness;
    req.businessRole = userRole;
    req.businessMember = membershipRecord;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role Gate Middleware Factory
 * Restricts downstream access to specific business roles (e.g. OWNER, MANAGER)
 */
const requireBusinessRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.businessRole) {
      return res.status(403).json({
        success: false,
        code: "BUSINESS_CONTEXT_MISSING",
        message: "Business context has not been initialized for this request.",
      });
    }

    if (!allowedRoles.includes(req.businessRole)) {
      return res.status(403).json({
        success: false,
        code: "INSUFFICIENT_PERMISSIONS",
        message: `Action requires one of the following roles: [${allowedRoles.join(", ")}]. Your role: ${req.businessRole}.`,
      });
    }

    next();
  };
};

module.exports = {
  businessMiddleware,
  requireBusinessRole,
};
