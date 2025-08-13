import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import bcrypt from "bcrypt";
import { getAllUsers, createUser, updateUser, deleteUser } from "./user";

interface CreateUserRequest {
  username: string;
  password: string;
  role: "admin" | "kasir";
}

interface UpdateUserRequest {
  id: number;
  username: string;
  role: "admin" | "kasir";
}

interface DeleteUserRequest {
  id: number;
}

interface UserResponse {
  id: number;
  username: string;
  role: string;
  created_at: Date;
}

interface UsersListResponse {
  users: UserResponse[];
}

// Returns list of all users
export const listUsers = api<void, UsersListResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/users" },
  async () => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    const users = await getAllUsers();
    return {
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        created_at: u.created_at
      }))
    };
  }
);

// Creates a new user
export const createNewUser = api<CreateUserRequest, UserResponse>(
  { auth: true, expose: true, method: "POST", path: "/api/users" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    const passwordHash = await bcrypt.hash(req.password, 10);
    const user = await createUser(req.username, passwordHash, req.role);
    
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    };
  }
);

// Updates an existing user
export const updateExistingUser = api<UpdateUserRequest, UserResponse>(
  { auth: true, expose: true, method: "PUT", path: "/api/users/:id" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    const user = await updateUser(req.id, req.username, req.role);
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    };
  }
);

// Deletes a user
export const deleteExistingUser = api<DeleteUserRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/api/users/:id" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    await deleteUser(req.id);
  }
);
