"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { NavItem, PermissionKey, Role } from "./types";
import {
  can as checkCan,
  canAll as checkCanAll,
  canAny as checkCanAny,
  getNavForRole,
} from "./permissions";
import { DEMO_USER_ID, STUDENT_PROFILE, TEAM_MEMBERS } from "./data";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "hb_crm_demo_role";
const DEFAULT_ROLE: Role = "super_admin";

export const ALL_ROLES: Role[] = [
  "super_admin",
  "admin",
  "team_lead",
  "marketing",
  "sales_executive",
  "support_agent",
  "student",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && (ALL_ROLES as string[]).includes(value);
}

/**
 * Read the persisted role from localStorage.
 * Called once as a lazy useState initializer — never runs on the server.
 */
function readStoredRole(): Role {
  if (typeof window === "undefined") return DEFAULT_ROLE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isValidRole(stored) ? stored : DEFAULT_ROLE;
  } catch {
    // localStorage may be blocked in some environments.
    return DEFAULT_ROLE;
  }
}

// ─── Context Shape ────────────────────────────────────────────────────────────

export interface RoleContextValue {
  /** The currently active demo role. */
  activeRole: Role;

  /** Switch to a different role. Persists to localStorage. */
  setActiveRole: (role: Role) => void;

  /** ID of the user representing the active role in the demo. */
  currentUserId: string;

  /** Display name of the current demo user. */
  currentUserName: string;

  /** Email of the current demo user. */
  currentUserEmail: string;

  /** True when the active role is 'student'. Useful for layout decisions. */
  isStudent: boolean;

  /** Nav items filtered to only those allowed for the active role. */
  navItems: NavItem[];

  /**
   * Check if the active role has a specific permission.
   * Usage: can('leads.view_all')
   */
  can: (permission: PermissionKey) => boolean;

  /**
   * Check if the active role has ANY of the provided permissions.
   * Usage: canAny(['leads.view_team', 'leads.view_all'])
   */
  canAny: (permissions: PermissionKey[]) => boolean;

  /**
   * Check if the active role has ALL of the provided permissions.
   * Usage: canAll(['imports.upload', 'imports.approve'])
   */
  canAll: (permissions: PermissionKey[]) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RoleContext = createContext<RoleContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CRMRoleProviderProps {
  children: React.ReactNode;
}

export function CRMRoleProvider({ children }: CRMRoleProviderProps) {
  // Lazy initializer: reads localStorage once, never on server.
  const [activeRole, setActiveRoleState] = useState<Role>(readStoredRole);

  const setActiveRole = useCallback((role: Role) => {
    setActiveRoleState(role);
    try {
      window.localStorage.setItem(STORAGE_KEY, role);
    } catch {
      // Fail silently if storage is unavailable.
    }
  }, []);

  // Derive current user identity from the active role.
  const currentUserId = DEMO_USER_ID[activeRole];

  const { currentUserName, currentUserEmail } = useMemo(() => {
    if (activeRole === "student") {
      return {
        currentUserName: STUDENT_PROFILE.name,
        currentUserEmail: STUDENT_PROFILE.email,
      };
    }
    const member = TEAM_MEMBERS.find((m) => m.id === currentUserId);
    return {
      currentUserName: member?.name ?? "Unknown User",
      currentUserEmail: member?.email ?? "",
    };
  }, [activeRole, currentUserId]);

  // Bind permission checks to the active role so call sites are clean.
  const can = useCallback(
    (permission: PermissionKey) => checkCan(activeRole, permission),
    [activeRole],
  );

  const canAny = useCallback(
    (permissions: PermissionKey[]) => checkCanAny(activeRole, permissions),
    [activeRole],
  );

  const canAll = useCallback(
    (permissions: PermissionKey[]) => checkCanAll(activeRole, permissions),
    [activeRole],
  );

  const navItems = useMemo(() => getNavForRole(activeRole), [activeRole]);

  const value = useMemo<RoleContextValue>(
    () => ({
      activeRole,
      setActiveRole,
      currentUserId,
      currentUserName,
      currentUserEmail,
      isStudent: activeRole === "student",
      navItems,
      can,
      canAny,
      canAll,
    }),
    [
      activeRole,
      setActiveRole,
      currentUserId,
      currentUserName,
      currentUserEmail,
      navItems,
      can,
      canAny,
      canAll,
    ],
  );

  return (
    <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the active role and all permission helpers.
 * Must be called inside <CRMRoleProvider>.
 */
export function useCRMRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error(
      "useCRMRole must be called inside <CRMRoleProvider>. " +
        "Wrap your CRM layout in <CRMRoleProvider> to fix this.",
    );
  }
  return ctx;
}

// ─── PermissionGate ───────────────────────────────────────────────────────────

/**
 * Render children only if the active role has the required permission.
 * Optionally render a fallback for the denied state.
 *
 * Usage:
 *   <PermissionGate permission="leaderboard.view">
 *     <LeaderboardSection />
 *   </PermissionGate>
 *
 *   <PermissionGate permission="leads.delete" fallback={<ReadOnlyBadge />}>
 *     <DeleteButton />
 *   </PermissionGate>
 */
interface PermissionGateProps {
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = useCRMRole();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}