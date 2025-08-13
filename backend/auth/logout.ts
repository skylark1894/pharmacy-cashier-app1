import { api, Cookie } from "encore.dev/api";

interface LogoutResponse {
  session: Cookie<"session">;
}

// Logs out user by clearing session cookie
export const logout = api<void, LogoutResponse>(
  { expose: true, method: "POST", path: "/api/auth/logout" },
  async () => {
    return {
      session: {
        value: "",
        expires: new Date(0),
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }
    };
  }
);
