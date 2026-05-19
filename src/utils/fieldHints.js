import {
  PASSWORD_RULES,
  TRANSACTION_DESCRIPTION_MAX_LENGTH,
} from '../constants/validationRules';

export const getEmailFieldHint = (t) => t('hints.email');

export const getPasswordRegisterHint = (t) =>
  t('hints.passwordRegister', {
    minLength: PASSWORD_RULES.minLength,
    maxLength: PASSWORD_RULES.maxLength,
  });

export const getPasswordLoginHint = (t) => t('hints.passwordLogin');

export const getCommentFieldHint = (t) =>
  t('hints.commentMax', { max: TRANSACTION_DESCRIPTION_MAX_LENGTH });
