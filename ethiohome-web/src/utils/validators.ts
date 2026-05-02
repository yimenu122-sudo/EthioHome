export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidEthiopianPhone = (phone: string): boolean => {
  // Supports +251, 251, or 09/07 formats
  const re = /^(?:\+251|251|0)?(?:9|7)\d{8}$/;
  return re.test(phone);
};

export const isStrongPassword = (password: string): boolean => {
  // Min 8 chars, at least one letter and one number
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};
