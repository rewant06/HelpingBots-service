// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role =
  | 'super_admin'
  | 'admin'
  | 'team_lead'
  | 'marketing'
  | 'sales_executive'
  | 'support_agent'
  | 'student';

// ─── Lead ────────────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'follow_up'
  | 'application_started'
  | 'application_submitted'
  | 'admission_confirmed'
  | 'enrolled'
  | 'lost'
  | 'on_hold';

export type LeadPriority = 'high' | 'medium' | 'low';

export type LeadSource =
  | 'website'
  | 'referral'
  | 'social_media'
  | 'google_ads'
  | 'walk_in'
  | 'phone'
  | 'whatsapp'
  | 'email_campaign'
  | 'event'
  | 'other';

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  program: string;
  degree: string;
  college: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string;           // user id
  assignedToName: string;       // denormalized — avoids joins in list views
  nextFollowUp: string | null;  // ISO date string
  lostReason?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;            // ISO date string
  updatedAt: string;            // ISO date string
}

// ─── Lead Activity (timeline on lead detail drawer) ──────────────────────────

export type ActivityType =
  | 'status_change'
  | 'note_added'
  | 'task_created'
  | 'task_completed'
  | 'call_made'
  | 'email_sent'
  | 'payment_update'
  | 'assignment_change'
  | 'document_uploaded';

export interface LeadActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  description?: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;            // ISO date string
  metadata?: Record<string, unknown>;
}

// ─── Task / Follow-up ────────────────────────────────────────────────────────

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'cancelled';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskType =
  | 'call'
  | 'email'
  | 'whatsapp'
  | 'meeting'
  | 'document'
  | 'other';

export interface Task {
  id: string;
  leadId: string;
  leadName: string;             // denormalized for list display
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;           // user id
  assignedToName: string;
  dueDate: string;              // ISO date string
  completedAt?: string;         // ISO date string
  createdAt: string;
  updatedAt: string;
}

// ─── Team Member / User ──────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  status: UserStatus;
  department?: string;
  avatar?: string;              // initials fallback when undefined
  joinedAt: string;
  lastActiveAt: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'not_started'
  | 'pending'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod =
  | 'upi'
  | 'bank_transfer'
  | 'cash'
  | 'card'
  | 'cheque';

export interface Payment {
  id: string;
  leadId: string;
  leadName: string;
  program: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: PaymentStatus;
  dueDate: string;              // ISO date string
  lastPaymentDate?: string;
  invoiceNumber: string;
  assignedTo: string;           // user id of the counselor
  assignedToName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: string;                 // ISO date string
  note?: string;
}

// ─── Import ──────────────────────────────────────────────────────────────────

export type ImportStatus =
  | 'uploaded'
  | 'parsing'
  | 'needs_mapping'
  | 'validated'
  | 'validation_failed'
  | 'pending_approval'
  | 'approved'
  | 'partially_imported'
  | 'imported'
  | 'rejected'
  | 'rolled_back';

export type ImportRowStatus = 'valid' | 'invalid' | 'warning' | 'duplicate';

export interface ImportRow {
  rowIndex: number;
  rawData: Record<string, string>;
  mappedData: Partial<Lead>;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  status: ImportRowStatus;
}

export interface ImportJob {
  id: string;
  fileName: string;
  fileSize: number;             // bytes
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  status: ImportStatus;
  uploadedBy: string;           // user id
  uploadedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export type LeaderboardPeriod = 'week' | 'month' | 'quarter';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  enrollments: number;
  target: number;
  targetAchieved: number;       // percentage 0–100
  revenue: number;
  calls: number;
  meetings: number;
  delta: number;                // positive = rank improved vs last period
  period: LeaderboardPeriod;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsTrendPoint {
  label: string;                // e.g. "Week 1", "Jan"
  leads: number;
  enrolled: number;
  lost: number;
}

export interface AnalyticsSummary {
  period: string;
  totalLeads: number;
  newLeads: number;
  converted: number;
  lost: number;
  conversionRate: number;       // percentage
  avgResponseTimeHours: number;
  revenueCollected: number;
  revenuePending: number;
  topSources: { source: LeadSource; count: number }[];
  topPrograms: { program: string; count: number }[];
  statusDistribution: { status: LeadStatus; count: number }[];
  trend: AnalyticsTrendPoint[];
}

// ─── Student Portal ──────────────────────────────────────────────────────────

export type ApplicationStage =
  | 'application_received'
  | 'under_review'
  | 'documents_pending'
  | 'admission_confirmed'
  | 'fee_pending'
  | 'enrolled'
  | 'orientation';

export interface StudentMilestone {
  id: string;
  title: string;
  description: string;
  completedAt?: string;
  isCompleted: boolean;
  order: number;
}

export interface StudentProfile {
  id: string;
  leadId: string;
  name: string;
  email: string;
  mobile: string;
  program: string;
  college: string;
  degree: string;
  applicationStage: ApplicationStage;
  counselorName: string;
  counselorEmail: string;
  counselorMobile: string;
  pendingDocuments: string[];
  paymentStatus: PaymentStatus;
  totalFee: number;
  paidAmount: number;
  nextActionTitle: string;
  nextActionDescription: string;
  milestones: StudentMilestone[];
  enrolledAt?: string;
  createdAt: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export type AuditEntityType =
  | 'lead'
  | 'task'
  | 'payment'
  | 'import'
  | 'user'
  | 'settings';

export type AuditAction =
  | 'lead_created'
  | 'lead_updated'
  | 'lead_status_changed'
  | 'lead_assigned'
  | 'task_created'
  | 'task_completed'
  | 'payment_updated'
  | 'import_uploaded'
  | 'import_approved'
  | 'import_rejected'
  | 'user_created'
  | 'user_role_changed'
  | 'settings_changed';

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  beforeJson?: Record<string, unknown>;
  afterJson?: Record<string, unknown>;
  source: 'ui' | 'import' | 'api' | 'system';
  timestamp: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export type MetricFormat = 'number' | 'currency' | 'percentage' | 'duration';
export type MetricTrend = 'up' | 'down' | 'neutral';

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  change: number;               // percentage change vs previous period
  trend: MetricTrend;
  format: MetricFormat;
  allowedRoles: Role[];         // which roles see this metric
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName: string;             // Lucide icon name string
  badge?: number;
  allowedRoles: Role[];
}

// ─── RBAC ────────────────────────────────────────────────────────────────────

export type PermissionKey =
  | 'dashboard.view'
  | 'dashboard.view_team'
  | 'dashboard.view_global'
  | 'leads.view_own'
  | 'leads.view_team'
  | 'leads.view_all'
  | 'leads.create'
  | 'leads.edit_own'
  | 'leads.edit_all'
  | 'leads.delete'
  | 'leads.assign'
  | 'tasks.view_own'
  | 'tasks.view_team'
  | 'tasks.view_all'
  | 'tasks.create'
  | 'tasks.complete'
  | 'payments.view_own'
  | 'payments.view_team'
  | 'payments.view_all'
  | 'payments.edit'
  | 'imports.upload'
  | 'imports.approve'
  | 'team.view'
  | 'team.manage'
  | 'leaderboard.view'
  | 'analytics.view'
  | 'settings.view'
  | 'settings.manage'
  | 'leads.bulk_assign'
  | 'student_portal.view';

export type PermissionMatrix = Record<Role, PermissionKey[]>;