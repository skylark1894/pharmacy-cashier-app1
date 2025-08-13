import { useAuth } from "../contexts/AuthContext";
import backend from "~backend/client";

export function useBackend() {
  const { user } = useAuth();
  
  if (!user) {
    return backend;
  }

  return backend.with({
    auth: async () => {
      // Since we're using httpOnly cookies, we don't need to manually set auth headers
      return {};
    }
  });
}
