import api from "./api";

export interface CreateTenantPayload {
  name: string;
  slug?: string;
  type?: "ORGANIZATION" | "PERSONAL";
}

export interface CreateApiKeyPayload {
  name: string;
  scopes: string[];
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  rawKey: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export const createTenant = async (payload: CreateTenantPayload) => {
  const { data } = await api.post<Tenant>("/tenants", payload);
  return data;
};

export const getTenant = async (tenantId: string) => {
  const { data } = await api.get<Tenant>(`/tenants/${tenantId}`);
  return data;
};

export const generateApiKey = async (tenantId: string, payload: CreateApiKeyPayload) => {
    const { data } = await api.post<ApiKeyResponse>(`/tenants/${tenantId}/keys`, payload);
    return data;
}
