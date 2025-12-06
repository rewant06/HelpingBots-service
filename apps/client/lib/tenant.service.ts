import api from "./api";
import {
  Tenant,
  ApiKeyDisplay,
  ApiKeyCreationResponse,
  CreateApiKeyPayload,
} from "@/types/index";

export interface CreateTenantPayload {
  name: string;
  slug?: string;
  type?: "ORGANIZATION" | "PERSONAL";
  jobTitle: string;
  isAuthorized: boolean;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  rawKey: string;
  createdAt: string;
}

export const getMyTenants = async () => {
  const { data } = await api.get<Tenant[]>("/tenants");
  return data;
};

export const createTenant = async (payload: CreateTenantPayload) => {
  const { data } = await api.post<Tenant>("/tenants", payload);
  return data;
};

export const getTenant = async (tenantId: string) => {
  const { data } = await api.get<Tenant>(`/tenants/${tenantId}`);
  return data;
};

export const getTenantKeys = async (tenantId: string) => {
  const { data } = await api.get<ApiKeyDisplay[]>(`/tenants/${tenantId}/keys`);
  return data;
};

export const generateApiKey = async (
  tenantId: string,
  payload: CreateApiKeyPayload
) => {
  const scopes =
    payload.service === "VEIL"
      ? ["posts:read", "posts:write", "analytics:read"]
      : ["users:read"];

  const { data } = await api.post<ApiKeyCreationResponse>(
    `/tenants/${tenantId}/keys`,
    { name: payload.name, scopes }
  );
  return data;
};

export const revokeApiKey = async (tenantId: string, keyId: string) => {
  const { data } = await api.delete<void>(`/tenants/${tenantId}/keys/${keyId}`);
  return data;
};
