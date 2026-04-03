import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_VERIFICATION_METHODS = new Set(["email_otp", "id_card", "manual"]);

const isVerificationMethodPassed = async (userId, collegeId, verificationMethod) => {
  if (!verificationMethod) return false;

  if (!ALLOWED_VERIFICATION_METHODS.has(verificationMethod)) {
    throw new ApiError(400, "Invalid verificationMethod. Allowed values: email_otp, id_card, manual");
  }

  if (verificationMethod === "email_otp") {
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        user_id: userId,
        verified: true,
      },
      orderBy: { created_at: "desc" },
    });

    return Boolean(otpRecord);
  }

  if (verificationMethod === "id_card") {
    const idCardRecord = await prisma.idCardVerification.findFirst({
      where: {
        student_id: userId,
        college_id: collegeId,
        status: "approved",
      },
      orderBy: { submitted_at: "desc" },
    });

    return Boolean(idCardRecord);
  }

  if (verificationMethod === "manual") {
    const manualRecord = await prisma.idCardVerification.findFirst({
      where: {
        student_id: userId,
        college_id: collegeId,
        manual_verified_by: {
          not: null,
        },
      },
      orderBy: { submitted_at: "desc" },
    });

    return Boolean(manualRecord);
  }

  return false;
};

const applyVerificationIfPassed = async ({ userId, collegeId, verificationMethod }) => {
  const passed = await isVerificationMethodPassed(userId, collegeId, verificationMethod);

  if (!passed) {
    throw new ApiError(400, "Verification is not completed yet");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      is_verified: true,
      verification_method: verificationMethod,
    },
  });
};

export { isVerificationMethodPassed, applyVerificationIfPassed };