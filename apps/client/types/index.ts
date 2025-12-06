// --- Pagination Types ---

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  lastPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// --- User Types ---

export interface Role {
  name: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: "ORGANIZATION" | "PERSONAL";
  createdAt: string;
}

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
export interface User {
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
  ownedTenants?: Tenant[];
  isEmailVerified?: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

// --- API Key Types ---

export interface ApiKeyDisplay {
  id: string;
  name: string;
  prefix: string;
  last4: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
}

export interface ApiKeyCreationResponse {
  id: string;
  name: string;
  rawKey: string;
  createdAt: string;
}

export interface CreateApiKeyPayload {
  name: string;
  scopes: string[];
  service: "VEIL" | "IAM";
}

// --- Activity Log Types ---
export interface ActivityLogActorSnapshot {
  email: string;
  roles: { name: string }[];
}

export interface ActivityLogContext {
  ip?: string;
  userAgent?: string;
  [key: string]: unknown; // Allow other context properties
}

export type ActivityLogChanges = Record<string, unknown>;

export interface ActivityLog {
  id: string;
  actorId: string | null;
  actorSnapshot: ActivityLogActorSnapshot | null;
  actionType: string;
  status: string;
  entityType: string;
  entityId: string | null;
  changes: ActivityLogContext | null;
  context: ActivityLogContext | null;
  createdAt: string;
  failureReason: string | null;
}

// --- Auth Payloads ---

export type RegisterPayload = Pick<User, "email" | "name"> & {
  password: string;
};

export type LoginPayload = Pick<User, "email"> & {
  password: string;
};

// --- Auth Responses ---

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

// --- JWT "Smart" Token Payload ---

export interface JwtPayload {
  sub: string; // User ID
  name: string;
  jti: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

// --- Password Reset Payloads ---

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// --- User API Payloads ---

export interface UpdateProfilePayload {
  name?: string;
}
