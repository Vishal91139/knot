import { ApiError } from "../utils/ApiError.js";

const ROLE = {
	SUPER_ADMIN: "super_admin",
	COLLEGE_ADMIN: "college_admin",
};

const ADMIN_ROLES = [ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN];

// ─── Assert Helpers (use directly in controllers) ────────────────────────────

const assertCollegeScopeOrSuperAdmin = (actor, targetCollegeId) => {
	if (!actor) {
        throw new ApiError(401, "Unauthorized request");
    }

	if (actor.role === ROLE.SUPER_ADMIN) return;

	if (actor.role !== ROLE.COLLEGE_ADMIN) {
		throw new ApiError(403, "Only college admin or super admin can perform this action");
	}

	if (!targetCollegeId) {
		throw new ApiError(400, "Target college ID is required");
	}

	if (String(actor.college_id) !== String(targetCollegeId)) {
		throw new ApiError(403, "You can only manage resources for your own college");
	}
};

// ─── Middleware Factories (use in routes) ─────────────────────────────────────

const requireAuthenticated = (req, _res, next) => {
	try {
		if (!req.user) throw new ApiError(401, "Unauthorized request");
		next();
	} catch (err) {
		next(err);
	}
};

const requireRoles = (...roles) => {
	return (req, _res, next) => {
		try {
			if (!req.user) throw new ApiError(401, "Unauthorized request");

			if (!roles.includes(req.user.role)) {
				throw new ApiError(403, "You do not have permission to perform this action");
			}

			next();
		} catch (err) {
			next(err);
		}
	};
};

const requireSuperAdmin = (req, _res, next) => {
	try {
		if (!req.user) throw new ApiError(401, "Unauthorized request");

		if (req.user.role !== ROLE.SUPER_ADMIN) {
			throw new ApiError(403, "Only super admin can perform this action");
		}

		next();
	} catch (err) {
		next(err);
	}
};

const requireCollegeAdminOrSuperAdmin = requireRoles(...ADMIN_ROLES);

export {
    ROLE,                              
    ADMIN_ROLES,
	assertCollegeScopeOrSuperAdmin,
	requireAuthenticated,
	requireRoles,
	requireSuperAdmin,
	requireCollegeAdminOrSuperAdmin
};