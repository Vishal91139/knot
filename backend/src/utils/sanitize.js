import { ApiError } from "./ApiError.js";

// Removes spaces only from string
export const trim = (value) => {
    return typeof value === "string" ? value.trim() : null;
};

// Removes spaces and convert to lowercase
export const trimLower = (value) => {
    const normalized = trim(value);
    return typeof normalized === "string" ? normalized.toLowerCase() : null;
};

// Parses only integer-like values and returns NaN for invalid inputs.
export const toInt = (value) => {
    if (typeof value === "number") {
        return Number.isInteger(value) ? value : Number.NaN;
    }

    if (typeof value !== "string") {
        return Number.NaN;
    }

    const normalized = value.trim();
    if (!normalized || !/^-?\d+$/.test(normalized)) {
        return Number.NaN;
    }

    return Number(normalized);
};

// checks if value is a valid number
export const isNumber = (value) => {
    if (value === null || value === undefined) return false;

    if (typeof value === "string") {
        const normalized = value.trim();
        if (!normalized) return false;
        return Number.isFinite(Number(normalized));
    }

    return Number.isFinite(Number(value));
};

// checks if value is within a range (for year_of_study)
export const isInRange = (value, min, max) => {
    const num = toInt(value);
    return !Number.isNaN(num) && num >= min && num <= max;
};

// checks if given value is empty or not
export const requireNonEmpty = (value, fieldName) => {
    if (!trim(value)) {
        throw new ApiError(400, `${fieldName} is required`);
    }
};