import bcrypt from "bcryptjs";

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored hashed password
 * @returns Boolean indicating if password matches
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a random password meeting strength requirements
 * @param length - Length of password (default: 12)
 * @returns Strong random password
 */
export const generateRandomPassword = (length: number = 12): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  const allChars = lowercase + uppercase + numbers + symbols;

  // Ensure at least one of each character type
  let password =
    lowercase[Math.floor(Math.random() * lowercase.length)] +
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

/**
 * Check password strength
 * @param password - Password to check
 * @returns Object with strength score and feedback
 */
export const checkPasswordStrength = (
  password: string
): {
  score: number; // 0-4 (0: very weak, 4: very strong)
  feedback: string;
} => {
  let score = 0;
  const feedback = [];

  // Length check
  if (password.length < 8) {
    feedback.push("Password should be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 1;
  }

  // Complexity checks
  if (/[a-z]/.test(password)) score += 0.5;
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^a-zA-Z0-9]/.test(password)) score += 0.5;

  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) score += 0.5; // No character repeated 3+ times in a row
  if (!/^(?:123456|password|qwerty)/.test(password.toLowerCase())) score += 0.5; // Not common pattern

  // Provide feedback based on score
  if (score < 2) {
    feedback.push(
      "Consider using a mix of lowercase and uppercase letters, numbers, and symbols"
    );
  }

  // Round and cap the score
  score = Math.min(4, Math.round(score));

  const feedbackMessage =
    feedback.length > 0 ? feedback.join(". ") : "Password strength is good";

  return {
    score,
    feedback: feedbackMessage,
  };
};
