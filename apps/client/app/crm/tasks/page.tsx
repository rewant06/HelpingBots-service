import type { Metadata } from 'next';
import { TasksView } from '@/components/crm/tasks/TasksView';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'Manage CRM tasks and follow-ups.',
};

export default function TasksPage() {
  return <TasksView />;
}