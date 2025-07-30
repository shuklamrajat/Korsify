export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function getUserInitials(user: any): string {
  if (!user) return 'U';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  
  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }
  
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
}

export function formatUserName(user: any): string {
  if (!user) return 'User';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'User';
}

export function getUserRole(user: any): 'creator' | 'learner' | null {
  if (!user) return null;
  return user.userType || 'learner';
}
