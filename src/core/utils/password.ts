import bcrypt from "bcryptjs";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateRandomPassword = (length: number = 12): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  const allChars = lowercase + uppercase + numbers + symbols;

  let password =
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

export const checkPasswordStrength = (
  password: string
): {
  score: number; // 0-4 (0: very weak, 4: very strong)
  feedback: string;
} => {
  let score = 0;
  const feedback = [];

  if (password.length < 8) {
    feedback.push("Password should be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) score += 0.5;
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^a-zA-Z0-9]/.test(password)) score += 0.5;

  if (!/(.)\1{2,}/.test(password)) score += 0.5;
  if (!/^(?:123456|password|qwerty)/.test(password.toLowerCase())) score += 0.5;
  if (score < 2) {
    feedback.push("Consider using a mix of lowercase and uppercase letters, numbers, and symbols");
  }

  score = Math.min(4, Math.round(score));

  const feedbackMessage = feedback.length > 0 ? feedback.join(". ") : "Password strength is good";

  return {
    score,
    feedback: feedbackMessage,
  };
};
