import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertCollegeScopeOrSuperAdmin } from "../middlewares/role.middleware.js";
import { trim } from "../utils/sanitize.js";

const EVENT_CATEGORIES = new Set([
    "cultural",
    "technical",
    "sports",
    "academic",
    "workshop",
    "hackathon",
    "other",
]);

const EVENT_TYPES = new Set(["incollege", "intercollege"]);
const EVENT_MODES = new Set(["offline", "online", "hybrid"]);
const EVENT_STATUSES = new Set([
    "draft",
    "pending",
    "reviewing",
    "revision",
    "approved",
    "live",
    "completed",
    "cancelled",
    "rejected",
]);

const parseBoolean = (value) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return null;
};

const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
};

const parseDate = (value, fieldName) => {
    if (value === null || value === undefined || value === "") {
        throw new ApiError(400, `${fieldName} is required`);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new ApiError(400, `${fieldName} must be a valid date`);
    }

    return date;
};

const normalizeEnum = (value, allowed, fieldName, required = false) => {
    const normalized = trim(value);

    if (!normalized) {
        if (required) {
            throw new ApiError(400, `${fieldName} is required`);
        }

        return null;
    }

    if (!allowed.has(normalized)) {
        throw new ApiError(400, `${fieldName} is invalid`);
    }

    return normalized;
};

const resolveEventId = (req) => {
    return trim(req.params.eventId) || trim(req.body.eventId) || trim(req.body.id);
};

const getActiveOrganizerForUser = async (userId) => {
    return prisma.organizer.findFirst({
        where: {
            user_id: userId,
            is_active: true,
        },
        select: {
            id: true,
            college_id: true,
            is_active: true,
        },
    });
};

const assertCreateAccess = async (req, collegeId, organizerId) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.user.role === "super_admin") {
        return;
    }

    if (req.user.role === "college_admin") {
        assertCollegeScopeOrSuperAdmin(req.user, collegeId);
        return;
    }

    if (req.user.role === "faculty" || req.user.role === "organizer") {
        const activeOrganizer = await getActiveOrganizerForUser(req.user.id);

        if (!activeOrganizer) {
            throw new ApiError(403, "Active organizer account is required to create events");
        }

        if (String(activeOrganizer.id) !== String(organizerId)) {
            throw new ApiError(403, "You can only create events under your own organizer account");
        }

        if (String(activeOrganizer.college_id) !== String(collegeId)) {
            throw new ApiError(403, "You can only create events for your own college");
        }

        return;
    }

    throw new ApiError(403, "You do not have permission to perform this action");
};

const assertManageAccess = async (req, event) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.user.role === "super_admin") {
        return;
    }

    if (req.user.role === "college_admin") {
        assertCollegeScopeOrSuperAdmin(req.user, event.college_id);
        return;
    }

    if (req.user.role === "faculty" || req.user.role === "organizer") {
        const activeOrganizer = await getActiveOrganizerForUser(req.user.id);

        if (!activeOrganizer) {
            throw new ApiError(403, "Active organizer account is required to manage events");
        }

        if (String(activeOrganizer.id) !== String(event.organizer_id)) {
            throw new ApiError(403, "You can only manage events created under your organizer account");
        }

        if (String(activeOrganizer.college_id) !== String(event.college_id)) {
            throw new ApiError(403, "You can only manage events from your own college");
        }

        return;
    }

    throw new ApiError(403, "You do not have permission to perform this action");
};

const getAllEvents = asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const q = trim(req.query.q);
    const collegeId = trim(req.query.collegeId);
    const organizerId = trim(req.query.organizerId);
    const category = normalizeEnum(req.query.category, EVENT_CATEGORIES, "category");
    const eventType = normalizeEnum(req.query.eventType, EVENT_TYPES, "eventType");
    const mode = normalizeEnum(req.query.mode, EVENT_MODES, "mode");
    const status = normalizeEnum(req.query.status, EVENT_STATUSES, "status");
    const isFeatured = parseBoolean(req.query.isFeatured);

    const where = {};

    if (collegeId) where.college_id = collegeId;
    if (organizerId) where.organizer_id = organizerId;
    if (category) where.category = category;
    if (eventType) where.event_type = eventType;
    if (mode) where.mode = mode;
    if (status) where.status = status;
    if (isFeatured !== null) where.is_featured = isFeatured;

    if (q) {
        where.OR = [
            { title: { contains: q, mode: "insensitive" } },
            { short_description: { contains: q, mode: "insensitive" } },
            { long_description: { contains: q, mode: "insensitive" } },
            { venue_name: { contains: q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await prisma.$transaction([
        prisma.event.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                _count: {
                    select: {
                        registrations: true,
                        teams: true,
                    },
                },
                organizer: {
                    select: {
                        id: true,
                        org_name: true,
                        org_type: true,
                        college_id: true,
                        is_active: true,
                    },
                },
                college: {
                    select: {
                        id: true,
                        name: true,
                        short_name: true,
                    },
                },
            },
        }),
        prisma.event.count({ where }),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, "Events fetched successfully")
    );
});

const eventById = asyncHandler(async (req, res) => {
    const eventId = resolveEventId(req);

    if (!eventId) {
        throw new ApiError(400, "eventId is required");
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            organizer: true,
            college: true,
            event_schedule: true,
            event_speakers: true,
            rounds: true,
            registrations: true,
            teams: true,
        },
    });

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    return res.status(200).json(new ApiResponse(200, event, "Event fetched successfully"));
});

const createEvent = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const title = trim(req.body.title);
    const shortDescription = trim(req.body.shortDescription) || trim(req.body.short_description);
    const longDescription = trim(req.body.longDescription) || trim(req.body.long_description);
    const organizerId = trim(req.body.organizerId) || trim(req.body.organizer_id);
    const collegeId = trim(req.body.collegeId) || trim(req.body.college_id);
    const category = normalizeEnum(req.body.category, EVENT_CATEGORIES, "category", true);
    const eventType = normalizeEnum(req.body.eventType || req.body.event_type, EVENT_TYPES, "eventType") || "incollege";
    const mode = normalizeEnum(req.body.mode, EVENT_MODES, "mode") || "offline";
    const venueName = trim(req.body.venueName) || trim(req.body.venue_name) || null;
    const venueAddress = trim(req.body.venueAddress) || trim(req.body.venue_address) || null;
    const onlineLink = trim(req.body.onlineLink) || trim(req.body.online_link) || null;
    const bannerUrl = trim(req.body.bannerUrl) || trim(req.body.banner_url) || null;
    const posterUrl = trim(req.body.posterUrl) || trim(req.body.poster_url) || null;
    const documentUrl = trim(req.body.documentUrl) || trim(req.body.document_url) || null;
    const tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => trim(tag)).filter(Boolean)
        : typeof req.body.tags === "string"
            ? req.body.tags.split(",").map((tag) => trim(tag)).filter(Boolean)
            : [];
    const maxCapacity = parseNumber(req.body.maxCapacity ?? req.body.max_capacity);
    const isTeamEvent = parseBoolean(req.body.isTeamEvent ?? req.body.is_team_event) ?? false;
    const minTeamSize = parseNumber(req.body.minTeamSize ?? req.body.min_team_size);
    const maxTeamSize = parseNumber(req.body.maxTeamSize ?? req.body.max_team_size);
    const isPaid = parseBoolean(req.body.isPaid ?? req.body.is_paid) ?? false;
    const entryFeeRaw = req.body.entryFee ?? req.body.entry_fee;
    const entryFee = entryFeeRaw === undefined || entryFeeRaw === null || entryFeeRaw === ""
        ? null
        : Number(entryFeeRaw);
    const currency = trim(req.body.currency) || "INR";
    const waitlistEnabled = parseBoolean(req.body.waitlistEnabled ?? req.body.waitlist_enabled) ?? false;
    const hasMultiRounds = parseBoolean(req.body.hasMultiRounds ?? req.body.has_multi_rounds) ?? false;
    const isFeatured = parseBoolean(req.body.isFeatured ?? req.body.is_featured) ?? false;
    const startDatetime = parseDate(req.body.startDatetime ?? req.body.start_datetime, "startDatetime");
    const endDatetime = parseDate(req.body.endDatetime ?? req.body.end_datetime, "endDatetime");
    const registrationDeadline = parseDate(req.body.registrationDeadline ?? req.body.registration_deadline, "registrationDeadline");

    if (!title || !shortDescription || !longDescription || !organizerId || !collegeId) {
        throw new ApiError(400, "title, shortDescription, longDescription, organizerId, and collegeId are required");
    }

    if (!Number.isFinite(maxCapacity) || maxCapacity <= 0) {
        throw new ApiError(400, "maxCapacity must be a positive number");
    }

    if (Number.isFinite(minTeamSize) && Number.isFinite(maxTeamSize) && minTeamSize > maxTeamSize) {
        throw new ApiError(400, "minTeamSize cannot be greater than maxTeamSize");
    }

    if (isPaid && (entryFee === null || !Number.isFinite(entryFee) || entryFee < 0)) {
        throw new ApiError(400, "entryFee is required for paid events");
    }

    if (endDatetime <= startDatetime) {
        throw new ApiError(400, "endDatetime must be after startDatetime");
    }

    if (registrationDeadline > startDatetime) {
        throw new ApiError(400, "registrationDeadline must be on or before startDatetime");
    }

    const organizer = await prisma.organizer.findUnique({
        where: { id: organizerId },
        select: {
            id: true,
            college_id: true,
            is_active: true,
        },
    });

    if (!organizer) {
        throw new ApiError(404, "Organizer not found");
    }

    if (!organizer.is_active) {
        throw new ApiError(400, "Organizer account is inactive");
    }

    const college = await prisma.college.findUnique({
        where: { id: collegeId },
        select: {
            id: true,
            is_active: true,
        },
    });

    if (!college) {
        throw new ApiError(404, "College not found");
    }

    if (!college.is_active) {
        throw new ApiError(400, "College is inactive");
    }

    if (String(organizer.college_id) !== String(collegeId)) {
        throw new ApiError(400, "Organizer must belong to the same college as the event");
    }

    await assertCreateAccess(req, collegeId, organizerId);

    const event = await prisma.event.create({
        data: {
            organizer_id: organizerId,
            college_id: collegeId,
            title,
            short_description: shortDescription,
            long_description: longDescription,
            category,
            event_type: eventType,
            mode,
            start_datetime: startDatetime,
            end_datetime: endDatetime,
            registration_deadline: registrationDeadline,
            venue_name: venueName,
            venue_address: venueAddress,
            online_link: onlineLink,
            max_capacity: maxCapacity,
            is_team_event: isTeamEvent,
            min_team_size: Number.isFinite(minTeamSize) ? minTeamSize : null,
            max_team_size: Number.isFinite(maxTeamSize) ? maxTeamSize : null,
            is_paid: isPaid,
            entry_fee: isPaid ? entryFee : null,
            currency,
            waitlist_enabled: waitlistEnabled,
            has_multi_rounds: hasMultiRounds,
            banner_url: bannerUrl,
            poster_url: posterUrl,
            document_url: documentUrl,
            tags,
            status: req.body.status ? normalizeEnum(req.body.status, EVENT_STATUSES, "status") : "draft",
            is_featured: isFeatured,
        },
        include: {
            organizer: true,
            college: true,
        },
    });

    return res.status(201).json(new ApiResponse(201, event, "Event created successfully"));
});

const updateEvent = asyncHandler(async (req, res) => {
    const eventId = resolveEventId(req);

    if (!eventId) {
        throw new ApiError(400, "eventId is required");
    }

    const existingEvent = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            id: true,
            college_id: true,
            organizer_id: true,
            start_datetime: true,
            end_datetime: true,
            registration_deadline: true,
        },
    });

    if (!existingEvent) {
        throw new ApiError(404, "Event not found");
    }

    await assertManageAccess(req, existingEvent);

    const data = {};
    const title = trim(req.body.title);
    const shortDescription = trim(req.body.shortDescription) || trim(req.body.short_description);
    const longDescription = trim(req.body.longDescription) || trim(req.body.long_description);
    const category = normalizeEnum(req.body.category, EVENT_CATEGORIES, "category");
    const eventType = normalizeEnum(req.body.eventType || req.body.event_type, EVENT_TYPES, "eventType");
    const mode = normalizeEnum(req.body.mode, EVENT_MODES, "mode");
    const venueName = trim(req.body.venueName) || trim(req.body.venue_name);
    const venueAddress = trim(req.body.venueAddress) || trim(req.body.venue_address);
    const onlineLink = trim(req.body.onlineLink) || trim(req.body.online_link);
    const bannerUrl = trim(req.body.bannerUrl) || trim(req.body.banner_url);
    const posterUrl = trim(req.body.posterUrl) || trim(req.body.poster_url);
    const documentUrl = trim(req.body.documentUrl) || trim(req.body.document_url);
    const currency = trim(req.body.currency);
    const status = req.body.status ? normalizeEnum(req.body.status, EVENT_STATUSES, "status") : null;
    const isFeatured = parseBoolean(req.body.isFeatured ?? req.body.is_featured);
    const isTeamEvent = parseBoolean(req.body.isTeamEvent ?? req.body.is_team_event);
    const isPaid = parseBoolean(req.body.isPaid ?? req.body.is_paid);
    const waitlistEnabled = parseBoolean(req.body.waitlistEnabled ?? req.body.waitlist_enabled);
    const hasMultiRounds = parseBoolean(req.body.hasMultiRounds ?? req.body.has_multi_rounds);
    const maxCapacity = parseNumber(req.body.maxCapacity ?? req.body.max_capacity);
    const minTeamSize = parseNumber(req.body.minTeamSize ?? req.body.min_team_size);
    const maxTeamSize = parseNumber(req.body.maxTeamSize ?? req.body.max_team_size);
    const entryFeeRaw = req.body.entryFee ?? req.body.entry_fee;
    const startDatetimeRaw = req.body.startDatetime ?? req.body.start_datetime;
    const endDatetimeRaw = req.body.endDatetime ?? req.body.end_datetime;
    const registrationDeadlineRaw = req.body.registrationDeadline ?? req.body.registration_deadline;

    if (typeof req.body.title === "string" && title) data.title = title;
    if (typeof req.body.shortDescription === "string" || typeof req.body.short_description === "string") data.short_description = shortDescription || null;
    if (typeof req.body.longDescription === "string" || typeof req.body.long_description === "string") data.long_description = longDescription || null;
    if (category) data.category = category;
    if (eventType) data.event_type = eventType;
    if (mode) data.mode = mode;
    if (startDatetimeRaw !== undefined) data.start_datetime = parseDate(startDatetimeRaw, "startDatetime");
    if (endDatetimeRaw !== undefined) data.end_datetime = parseDate(endDatetimeRaw, "endDatetime");
    if (registrationDeadlineRaw !== undefined) data.registration_deadline = parseDate(registrationDeadlineRaw, "registrationDeadline");
    if (typeof req.body.venueName === "string" || typeof req.body.venue_name === "string") data.venue_name = venueName || null;
    if (typeof req.body.venueAddress === "string" || typeof req.body.venue_address === "string") data.venue_address = venueAddress || null;
    if (typeof req.body.onlineLink === "string" || typeof req.body.online_link === "string") data.online_link = onlineLink || null;
    if (Number.isFinite(maxCapacity)) data.max_capacity = maxCapacity;
    if (isTeamEvent !== null) data.is_team_event = isTeamEvent;
    if (Number.isFinite(minTeamSize)) data.min_team_size = minTeamSize;
    if (Number.isFinite(maxTeamSize)) data.max_team_size = maxTeamSize;
    if (isPaid !== null) data.is_paid = isPaid;
    if (isPaid === false) data.entry_fee = null;
    if (entryFeeRaw !== undefined) {
        const parsedEntryFee = entryFeeRaw === null || entryFeeRaw === "" ? null : Number(entryFeeRaw);
        if (parsedEntryFee !== null && !Number.isFinite(parsedEntryFee)) {
            throw new ApiError(400, "entryFee must be a valid number");
        }
        data.entry_fee = parsedEntryFee;
    }
    if (typeof req.body.currency === "string" && currency) data.currency = currency;
    if (waitlistEnabled !== null) data.waitlist_enabled = waitlistEnabled;
    if (hasMultiRounds !== null) data.has_multi_rounds = hasMultiRounds;
    if (typeof req.body.bannerUrl === "string" || typeof req.body.banner_url === "string") data.banner_url = bannerUrl || null;
    if (typeof req.body.posterUrl === "string" || typeof req.body.poster_url === "string") data.poster_url = posterUrl || null;
    if (typeof req.body.documentUrl === "string" || typeof req.body.document_url === "string") data.document_url = documentUrl || null;
    if (typeof req.body.tags !== "undefined") {
        data.tags = Array.isArray(req.body.tags)
            ? req.body.tags.map((tag) => trim(tag)).filter(Boolean)
            : typeof req.body.tags === "string"
                ? req.body.tags.split(",").map((tag) => trim(tag)).filter(Boolean)
                : [];
    }
    if (status) data.status = status;
    if (isFeatured !== null) data.is_featured = isFeatured;

    if (Object.keys(data).length === 0) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    const nextStart = data.start_datetime ?? existingEvent.start_datetime;
    const nextEnd = data.end_datetime ?? existingEvent.end_datetime;
    const nextDeadline = data.registration_deadline ?? existingEvent.registration_deadline;

    if (nextEnd <= nextStart) {
        throw new ApiError(400, "endDatetime must be after startDatetime");
    }

    if (nextDeadline > nextStart) {
        throw new ApiError(400, "registrationDeadline must be on or before startDatetime");
    }

    if (data.is_paid === true && (data.entry_fee === null || data.entry_fee === undefined)) {
        throw new ApiError(400, "entryFee is required for paid events");
    }

    if (data.is_team_event === false) {
        data.min_team_size = null;
        data.max_team_size = null;
    }

    const updated = await prisma.event.update({
        where: { id: eventId },
        data,
        include: {
            organizer: true,
            college: true,
        },
    });

    return res.status(200).json(new ApiResponse(200, updated, "Event updated successfully"));
});

const setEventStatus = asyncHandler(async (req, res) => {
    const eventId = resolveEventId(req);
    const status = normalizeEnum(req.body.status, EVENT_STATUSES, "status", true);

    if (!eventId) {
        throw new ApiError(400, "eventId is required");
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            id: true,
            college_id: true,
            organizer_id: true,
        },
    });

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    await assertManageAccess(req, event);

    const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
            status,
            rejection_reason: status === "rejected" ? trim(req.body.rejectionReason) || trim(req.body.rejection_reason) || null : null,
        },
        include: {
            organizer: true,
            college: true,
        },
    });

    return res.status(200).json(new ApiResponse(200, updated, "Event status updated successfully"));
});

const setEventFeaturedState = asyncHandler(async (req, res) => {
    const eventId = resolveEventId(req);
    const isFeatured = parseBoolean(req.body.isFeatured ?? req.body.is_featured);

    if (!eventId) {
        throw new ApiError(400, "eventId is required");
    }

    if (isFeatured === null) {
        throw new ApiError(400, "isFeatured must be true or false");
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            id: true,
            college_id: true,
            organizer_id: true,
        },
    });

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    await assertManageAccess(req, event);

    const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
            is_featured: isFeatured,
        },
        include: {
            organizer: true,
            college: true,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updated,
            isFeatured ? "Event featured successfully" : "Event unfeatured successfully"
        )
    );
});

const deleteEvent = asyncHandler(async (req, res) => {
    const eventId = resolveEventId(req);

    if (!eventId) {
        throw new ApiError(400, "eventId is required");
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            id: true,
            college_id: true,
            organizer_id: true,
        },
    });

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    await assertManageAccess(req, event);

    await prisma.event.delete({
        where: { id: eventId },
    });

    return res.status(200).json(new ApiResponse(200, null, "Event deleted successfully"));
});

export {
    getAllEvents,
    eventById,
    createEvent,
    updateEvent,
    setEventStatus,
    setEventFeaturedState,
    deleteEvent,
};
