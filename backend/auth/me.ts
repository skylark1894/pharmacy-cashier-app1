import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

interface UserProfile {
  id: string;
  username: string;
  role: string;
}

// Returns current user profile
export const me = api<void, UserProfile>(
  { auth: true, expose: true, method: "GET", path: "/api/auth/me" },
  async () => {
    const auth = getAuthData()!;
    return {
      id: auth.userID,
      username: auth.username,
      role: auth.role
    };
  }
);
