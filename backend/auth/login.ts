import { api, Cookie } from "encore.dev/api";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";
import { getUserByUsername } from "./user";
import { APIError } from "encore.dev/api";

const jwtSecret = secret("JWTSecret");

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: number;
    username: string;
    role: string;
  };
  session: Cookie<"session">;
}

// Authenticates user and returns session cookie
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/api/auth/login" },
  async (req) => {
    const user = await getUserByUsername(req.username);
    
    if (!user) {
      throw APIError.unauthenticated("invalid credentials");
    }

    const isValid = await bcrypt.compare(req.password, user.password_hash);
    if (!isValid) {
      throw APIError.unauthenticated("invalid credentials");
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      jwtSecret(),
      { expiresIn: "24h" }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      session: {
        value: token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }
    };
  }
);
