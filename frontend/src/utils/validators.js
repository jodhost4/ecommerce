export function isEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value) {
  if (!value) return false;
  return /^\+?[\d\s\-()]{7,20}$/.test(value);
}

export function isUrl(value) {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isStrongPassword(value) {
  if (!value || value.length < 8) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return false;
  return true;
}

export function isPositiveNumber(value) {
  return typeof value === 'number' && value > 0;
}

export function isNonNegativeNumber(value) {
  return typeof value === 'number' && value >= 0;
}

export function isInRange(value, min, max) {
  return typeof value === 'number' && value >= min && value <= max;
}

export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim().length === 0) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export function minLength(value, min) {
  return typeof value === 'string' && value.trim().length >= min;
}

export function maxLength(value, max) {
  return typeof value === 'string' && value.trim().length <= max;
}

export function matchesField(value, matchValue) {
  return value === matchValue;
}

export function isZipCode(value) {
  if (!value) return false;
  return /^\d{5}(-\d{4})?$/.test(value);
}

export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  url: 'Please enter a valid URL',
  positiveNumber: 'Value must be a positive number',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be no more than ${max} characters`,
  match: 'Fields do not match',
  zipCode: 'Please enter a valid zip code',
};

export function getErrorMessage(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.details) {
    return Array.isArray(error.response.data.details)
      ? error.response.data.details.map((d) => d.message).join(', ')
      : error.response.data.details;
  }
  return 'An unexpected error occurred';
}
