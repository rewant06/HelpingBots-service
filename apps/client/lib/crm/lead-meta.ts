import type { LeadPriority, LeadStatus } from './types';

export const STATUS_BADGE: Record<LeadStatus, string> = {
  new:                   'bg-slate-100    text-slate-700  dark:bg-slate-800/60     dark:text-slate-300',
  contacted:             'bg-blue-100     text-blue-700   dark:bg-blue-900/40      dark:text-blue-300',
  interested:            'bg-amber-100    text-amber-700  dark:bg-amber-900/40     dark:text-amber-300',
  follow_up:             'bg-orange-100   text-orange-700 dark:bg-orange-900/40    dark:text-orange-300',
  application_started:   'bg-violet-100   text-violet-700 dark:bg-violet-900/40    dark:text-violet-300',
  application_submitted: 'bg-indigo-100   text-indigo-700 dark:bg-indigo-900/40    dark:text-indigo-300',
  admission_confirmed:   'bg-teal-100     text-teal-700   dark:bg-teal-900/40      dark:text-teal-300',
  enrolled:              'bg-emerald-100  text-emerald-700 dark:bg-emerald-900/40  dark:text-emerald-300',
  lost:                  'bg-red-100      text-red-700    dark:bg-red-900/40       dark:text-red-300',
  on_hold:               'bg-gray-100     text-gray-600   dark:bg-gray-800/60      dark:text-gray-400',
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new:                   'New',
  contacted:             'Contacted',
  interested:            'Interested',
  follow_up:             'Follow-up',
  application_started:   'App Started',
  application_submitted: 'Submitted',
  admission_confirmed:   'Confirmed',
  enrolled:              'Enrolled',
  lost:                  'Lost',
  on_hold:               'On Hold',
};

export const PRIORITY_BADGE: Record<LeadPriority, string> = {
  high:   'bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low:    'bg-gray-100  text-gray-600  dark:bg-gray-800/60  dark:text-gray-400',
};

export const PRIORITY_LABEL: Record<LeadPriority, string> = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
};