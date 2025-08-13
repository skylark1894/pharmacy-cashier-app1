import { authHandler } from "encore.dev/auth";
import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { secret } from "encore.dev/config";
import jwt from "jsonwebtoken";
import { getUserById } from "./user";

const jwtSecret = secret("JWTSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  username: string;
  role: "admin" | "kasir";
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const payload = jwt.verify(token, jwtSecret()) as any;
      const user = await getUserById(payload.userId);
      
      if (!user) {
        throw APIError.unauthenticated("user not found");
      }

      return {
        userID: user.id.toString(),
        username: user.username,
        role: user.role as "admin" | "kasir"
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });
