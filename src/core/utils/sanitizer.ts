export const sanitizePathComponent = (input: string): string => {
  if (!input) return "";
  return input
    .replace(/\.\./g, "")
    .replace(/[/\\:*?"<>|]/g, "_")
    .trim();
};
