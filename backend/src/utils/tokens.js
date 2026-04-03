import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) => {
    return jwt.sign(
        { sub: user.id, role: user.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1d" }
    );
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");  
};

export const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

export const getRefreshExpiryDate = () => {
    const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
};