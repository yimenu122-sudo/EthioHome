import { UserRole } from './roleGuard';

export enum Action {
  LIST_PROPERTY = 'list_property',
  BOOK_VIEWING = 'book_viewing',
  VERIFY_AGENT = 'verify_agent',
  PROCESS_PAYMENT = 'process_payment',
  VIEW_REPORTS = 'view_reports',
  MANAGE_USERS = 'manage_users',
}

const rolePermissions: Record<UserRole, Action[]> = {
  renter: [Action.BOOK_VIEWING, Action.PROCESS_PAYMENT],
  buyer: [Action.BOOK_VIEWING, Action.PROCESS_PAYMENT],
  owner: [Action.LIST_PROPERTY, Action.PROCESS_PAYMENT],
  agent: [Action.LIST_PROPERTY, Action.BOOK_VIEWING],
  admin: Object.values(Action),
};

export const hasPermission = (role: UserRole, action: Action): boolean => {
  return rolePermissions[role]?.includes(action) || false;
};
