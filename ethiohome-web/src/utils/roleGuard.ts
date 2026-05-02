export type UserRole = 'renter' | 'buyer' | 'owner' | 'agent' | 'admin';

export const hasRole = (userRole: string | undefined, requiredRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as UserRole);
};

export const canAccessAdmin = (role: string | undefined): boolean => {
  return role === 'admin';
};

export const canManageProperties = (role: string | undefined): boolean => {
  return role === 'owner' || role === 'agent' || role === 'admin';
};
