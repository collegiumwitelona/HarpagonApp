/**
 * Mirrors backend validation (ASP.NET Identity defaults + DTO/domain MaxLength).
 * Update here when API rules change.
 */
export const PASSWORD_RULES = {
  minLength: 6,
  maxLength: 100,
  requireDigit: true,
  requireLowercase: true,
  requireUppercase: true,
  requireNonAlphanumeric: true,
};

export const EMAIL_MAX_LENGTH = 256;

export const TRANSACTION_DESCRIPTION_MAX_LENGTH = 100;

export const USER_NAME_MAX_LENGTH = 50;
