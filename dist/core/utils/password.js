"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPasswordStrength = exports.generateRandomPassword = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(12);
    return bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
/**
 * Compare a password with a hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored hashed password
 * @returns Boolean indicating if password matches
 */
const comparePassword = async (password, hashedPassword) => {
    return bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
/**
 * Generate a random password meeting strength requirements
 * @param length - Length of password (default: 12)
 * @returns Strong random password
 */
const generateRandomPassword = (length = 12) => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    const allChars = lowercase + uppercase + numbers + symbols;
    // Ensure at least one of each character type
    let password = lowercase[Math.floor(Math.random() * lowercase.length)] +
        uppercase[Math.floor(Math.random() * uppercase.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        symbols[Math.floor(Math.random() * symbols.length)];
    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    // Shuffle the password
    return password
        .split("")
        .sort(() => 0.5 - Math.random())
        .join("");
};
exports.generateRandomPassword = generateRandomPassword;
/**
 * Check password strength
 * @param password - Password to check
 * @returns Object with strength score and feedback
 */
const checkPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];
    // Length check
    if (password.length < 8) {
        feedback.push("Password should be at least 8 characters long");
    }
    else if (password.length >= 12) {
        score += 1;
    }
    // Complexity checks
    if (/[a-z]/.test(password))
        score += 0.5;
    if (/[A-Z]/.test(password))
        score += 0.5;
    if (/[0-9]/.test(password))
        score += 0.5;
    if (/[^a-zA-Z0-9]/.test(password))
        score += 0.5;
    // Pattern checks
    if (!/(.)\1{2,}/.test(password))
        score += 0.5; // No character repeated 3+ times in a row
    if (!/^(?:123456|password|qwerty)/.test(password.toLowerCase()))
        score += 0.5; // Not common pattern
    // Provide feedback based on score
    if (score < 2) {
        feedback.push("Consider using a mix of lowercase and uppercase letters, numbers, and symbols");
    }
    // Round and cap the score
    score = Math.min(4, Math.round(score));
    const feedbackMessage = feedback.length > 0 ? feedback.join(". ") : "Password strength is good";
    return {
        score,
        feedback: feedbackMessage,
    };
};
exports.checkPasswordStrength = checkPasswordStrength;
