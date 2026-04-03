import { ApiError } from "./ApiError";

// Removes spaces only from string
export const trim = (value) => {
    return typeof value === "string" ? value.trim() : "";
};

// Removes spaces and convert to lowercase
export const trimLower = (value) => {
    return typeof value === "string" ? value?.trim().toLowerCase() : "";
};

// checks if value is a valid number
export const isNumber = (value) => {
    if (value === null || value === undefined || value === "") return false;
    return Number.isFinite(Number(value));
};

// checks if value is within a range (for year_of_study)
export const isInRange = (value, min, max) => {
    const num = Number(value);
    return !Number.isNaN(num) && num >= min && num <= max;
};

// checks if given value is empty or not
export const requireNonEmpty = (value, fieldName) => {
    if (!trim(value)) {
        throw new ApiError(400, fieldName + " is required");
    }
};