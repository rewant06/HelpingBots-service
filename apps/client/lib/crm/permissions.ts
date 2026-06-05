
import type { NavItem, PermissionKey, PermissionMatrix, Role } from './types';

// ─── Permission Matrix ────────────────────────────────────────────────────────
// Each role maps to the exact set of actions it is allowed to perform.
// When in doubt, omit the permission — deny by default.

const PERMISSIONS: PermissionMatrix = {
  super_admin: [
    'dashboard.view',
    'dashboard.view_team',
    'dashboard.view_global',
    'leads.bulk_assign',
    'leads.view_own',
    'leads.view_team',
    'leads.view_all',
    'leads.create',
    'leads.edit_own',
    'leads.edit_all',
    'leads.delete',
    'leads.assign',
    'tasks.view_own',
    'tasks.view_team',
    'tasks.view_all',
    'tasks.create',
    'tasks.complete',
    'payments.view_own',
    'payments.view_team',
    'payments.view_all',
    'payments.edit',
    'imports.upload',
    'imports.approve',
    'team.view',
    'team.manage',
    'leaderboard.view',
    'analytics.view',
    'settings.view',
    'settings.manage',
    'student_portal.view',
  ],

  admin: [
    'dashboard.view',
    'dashboard.view_team',
    'dashboard.view_global',
    'leads.bulk_assign',
    'leads.view_own',
    'leads.view_team',
    'leads.view_all',
    'leads.create',
    'leads.edit_own',
    'leads.edit_all',
    'leads.delete',
    'leads.assign',
    'tasks.view_own',
    'tasks.view_team',
    'tasks.view_all',
    'tasks.create',
    'tasks.complete',
    'payments.view_own',
    'payments.view_team',
    'payments.view_all',
    'payments.edit',
    'imports.upload',
    'imports.approve',
    'team.view',
    'team.manage',
    // NO leaderboard.view — leaderboard is founder-only
    'analytics.view',
    'settings.view',
    'settings.manage',
  ],

  team_lead: [
    'dashboard.view',
    'dashboard.view_team',
    'leads.bulk_assign',
    'leads.view_own',
    'leads.view_team',
    'leads.view_all',
    'leads.create',
    'leads.edit_own',
    'leads.edit_all',
    'leads.assign',
    'tasks.view_own',
    'tasks.view_team',
    'tasks.view_all',
    'tasks.create',
    'tasks.complete',
    'payments.view_own',
    'payments.view_team',
    'imports.upload',
    // NO imports.approve — team_lead submits for approval, cannot self-approve
    'team.view',
    // NO leaderboard, NO analytics, NO settings
  ],

  // In PERMISSIONS matrix, add:
marketing: [

  'dashboard.view',
  'leads.view_own',
  'leads.create',
  'leads.edit_own',
  'tasks.view_own',
  'tasks.create',

],

  sales_executive: [
    'dashboard.view',
    'leads.view_own',
    'leads.create',
    'leads.edit_own',
    'tasks.view_own',
    'tasks.create',
    'leads.edit_own',
    'tasks.complete',
    'payments.view_own',
    // NO team, NO imports, NO leaderboard, NO analytics, NO settings
  ],

  support_agent: [
    'dashboard.view',
    'leads.view_own',
    'leads.edit_own',
    'tasks.view_own',
    'tasks.create',
    'tasks.complete',
    'payments.view_own',
    'payments.view_team',
    'payments.edit',
    // Support agent handles enrolled fee follow-up — needs payment edit
    // NO imports, NO team.manage, NO leaderboard, NO analytics, NO settings
  ],

  student: [
    'dashboard.view',
    'student_portal.view',
    'payments.view_own',
    // Student sees only their own portal + payment status
  ],
};

// ─── Core Permission Check ────────────────────────────────────────────────────
// Usage: can('team_lead', 'imports.approve') → false
// Usage: can('super_admin', 'leaderboard.view') → true

export function can(role: Role, permission: PermissionKey): boolean {
  return PERMISSIONS[role].includes(permission);
}

// Checks if a role has ANY of the provided permissions.
// Useful for: show a section if the user can do at least one thing in it.
export function canAny(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.some((p) => can(role, p));
}

// Checks if a role has ALL of the provided permissions.
// Useful for: show an advanced action that requires multiple permissions.
export function canAll(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.every((p) => can(role, p));
}

// ─── Role Metadata ────────────────────────────────────────────────────────────
// Used by the demo role switcher UI.

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  team_lead: 'Team Lead',
  marketing: 'Marketing Exec',
  sales_executive: 'Sales Executive',
  support_agent: 'Support Agent',
  student: 'Student',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: 'Full system access — founder / owner view',
  admin: 'Full CRM operations, no leaderboard',
  team_lead: 'Team management, assignment, import upload',
  marketing: 'Generates leads from campaigns and outreach activities',
  sales_executive: 'Own assigned leads and tasks only',
  support_agent: 'Enrolled leads, onboarding and fee follow-up',
  student: 'Read-only self-service portal',
};

// Role display order for the switcher (most privileged → least)
export const ROLE_ORDER: Role[] = [
  'super_admin',
  'admin',
  'team_lead',
  'marketing',
  'sales_executive',
  'support_agent',
  'student',
];

// ─── Navigation Items ─────────────────────────────────────────────────────────
// Each item declares which roles can see it.
// The sidebar and bottom nav filter this list by the active role.
// iconName must match a valid Lucide icon name exactly.

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/crm/dashboard',
    iconName: 'LayoutDashboard',
    allowedRoles: [
      'super_admin',
      'admin',
      'team_lead',
      'sales_executive',
      'support_agent',
    ],
  },
  {
    id: 'portal',
    label: 'My Portal',
    href: '/crm/portal',
    iconName: 'GraduationCap',
    allowedRoles: ['student'],
  },
  {
    id: 'leads',
    label: 'Leads',
    href: '/crm/leads',
    iconName: 'Users',
    allowedRoles: [
      'super_admin',
      'admin',
      'team_lead',
      'sales_executive',
      'support_agent',
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    href: '/crm/tasks',
    iconName: 'CheckSquare',
    allowedRoles: [
      'super_admin',
      'admin',
      'team_lead',
      'sales_executive',
      'support_agent',
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/crm/payments',
    iconName: 'CreditCard',
    allowedRoles: [
      'super_admin',
      'admin',
      'team_lead',
      'sales_executive',
      'support_agent',
      'student',
    ],
  },
  {
    id: 'imports',
    label: 'Import Center',
    href: '/crm/imports',
    iconName: 'Upload',
    allowedRoles: ['super_admin', 'admin', 'team_lead'],
  },
  {
    id: 'team',
    label: 'Team',
    href: '/crm/team',
    iconName: 'Users2',
    allowedRoles: ['super_admin', 'admin', 'team_lead'],
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    href: '/crm/leaderboard',
    iconName: 'Trophy',
    allowedRoles: ['super_admin'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/crm/analytics',
    iconName: 'BarChart3',
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/crm/settings',
    iconName: 'Settings',
    allowedRoles: ['super_admin', 'admin'],
  },
];

// Returns only the nav items visible to the given role.
export function getNavForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));
}