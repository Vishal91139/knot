import crypto from "crypto";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateQrCode = () => crypto.randomBytes(16).toString("hex");

async function createRegistrationWithUniqueQr(data) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.registration.create({
        data: {
          ...data,
          qr_code: generateQrCode(),
        },
      });
    } catch (err) {
      if (err?.code === "P2002" && Array.isArray(err?.meta?.target) && err.meta.target.includes("qr_code")) {
        continue;
      }
      throw err;
    }
  }

  throw new ApiError(500, "Failed to generate registration QR code");
}

const assertRegistrationOpen = (event) => {
  if (!event) throw new ApiError(404, "Event not found");

  if (!new Set(["approved", "live"]).has(event.status)) {
    throw new ApiError(400, "Event is not open for registration");
  }

  const now = new Date();
  if (event.registration_deadline && now > event.registration_deadline) {
    throw new ApiError(400, "Registration deadline has passed");
  }
};

const registerForEvent = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized request");

  const eventId = String(req.params.eventId || "").trim();
  if (!eventId) throw new ApiError(400, "eventId is required");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      status: true,
      max_capacity: true,
      waitlist_enabled: true,
      registration_deadline: true,
    },
  });

  assertRegistrationOpen(event);

  const existing = await prisma.registration.findFirst({
    where: { event_id: eventId, student_id: req.user.id },
    select: { id: true, status: true, registered_at: true },
  });

  if (existing) {
    return res.status(200).json(new ApiResponse(200, existing, "Already registered"));
  }

  const confirmedCount = await prisma.registration.count({
    where: { event_id: eventId, status: "confirmed" },
  });

  const isFull = Number.isFinite(event.max_capacity) && confirmedCount >= event.max_capacity;

  if (isFull && !event.waitlist_enabled) {
    throw new ApiError(400, "Event is full");
  }

  let status = "confirmed";
  let waitlist_position = null;

  if (isFull && event.waitlist_enabled) {
    status = "waitlisted";
    const waitlistedCount = await prisma.registration.count({
      where: { event_id: eventId, status: "waitlisted" },
    });
    waitlist_position = waitlistedCount + 1;
  }

  const created = await createRegistrationWithUniqueQr({
    event_id: eventId,
    student_id: req.user.id,
    status,
    waitlist_position,
  });

  return res.status(201).json(new ApiResponse(201, created, "Registration successful"));
});

const unregisterForEvent = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized request");

  const eventId = String(req.params.eventId || "").trim();
  if (!eventId) throw new ApiError(400, "eventId is required");

  const result = await prisma.registration.deleteMany({
    where: { event_id: eventId, student_id: req.user.id },
  });

  if (!result.count) {
    throw new ApiError(404, "Registration not found");
  }

  return res.status(200).json(new ApiResponse(200, { deleted: result.count }, "Unregistered successfully"));
});

const getMyEventRegistration = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized request");

  const eventId = String(req.params.eventId || "").trim();
  if (!eventId) throw new ApiError(400, "eventId is required");

  const registration = await prisma.registration.findFirst({
    where: { event_id: eventId, student_id: req.user.id },
    select: {
      id: true,
      status: true,
      registered_at: true,
      checked_in: true,
      waitlist_position: true,
    },
  });

  return res.status(200).json(new ApiResponse(200, registration, "Registration fetched successfully"));
});

export { registerForEvent, unregisterForEvent, getMyEventRegistration };
