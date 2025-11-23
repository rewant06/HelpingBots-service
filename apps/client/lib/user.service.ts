import api from "./api";
import {
  UpdateProfilePayload,
  User,
  PaginatedResponse,
  ActivityLog,
} from "@/types/index";

export const updateSelf = async (payload: UpdateProfilePayload) => {
  const { data } = await api.patch<{ user: User }>("/users/me", payload);
  return data.user;
};

// ----- Admin Only ---

export const getUserById = async (userId: string) => {
  const { data } = await api.get<{ user: User }>(`/users/${userId}`);
  return data.user;
};

export const updateUserRoles = async (userId: string, roles: string[]) => {
  const { data } = await api.patch<{ user: User }>(`/users/${userId}`, {
    roles: roles,
  });
  return data.user;
};

export const getUserActivity = async (userId: string, page = 1, limit = 10) => {
  const { data } = await api.get<PaginatedResponse<ActivityLog>>(
    `/activity-log/?actorId=${userId}&page=${page}&limit=${limit}`
  );
  return data;
};

export const manuallyVerifyUser = async (userId: string) => {
  const { data } = await api.patch<{ user: User }>(`/users/${userId}/verify`);
  return data.user;
};

export const getAllUsers = async (page = 1, limit = 10) => {
  const { data } = await api.get<PaginatedResponse<User>>(
    `/users/?page=${page}&limit=${limit}`
  );
  return data;
};
