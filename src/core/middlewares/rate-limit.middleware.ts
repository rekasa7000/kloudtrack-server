import rateLimit from "express-rate-limit";

export const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again later.",
});

export default signinLimiter;
