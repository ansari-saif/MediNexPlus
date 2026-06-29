import jwt from "jsonwebtoken";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

export interface JwtPayload {
  userId: string;
  role: string;
  hospitalId?: string;
}

export const generateToken = (payload: JwtPayload, expiresIn: string | number = "7d"): string => {
  return jwt.sign(payload as object, resolveJwtSecret(), { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, resolveJwtSecret()) as JwtPayload;
  } catch (error) {
    return null;
  }
};
