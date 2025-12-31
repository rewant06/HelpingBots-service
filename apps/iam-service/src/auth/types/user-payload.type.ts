export interface UserPayload {
  id: string;
  email: string;
  name: string | null;
  roles: { name: string }[];
  tenant_ids?: string[];
  active_tenant_id?: string | null;
  tenant_roles_by_tenant?: Record<string, string[]>;
}
