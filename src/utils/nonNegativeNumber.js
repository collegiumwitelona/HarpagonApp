export const NON_NEGATIVE_INPUT_PROPS = {
  min: '0',
  step: '0.01',
};

export const sanitizeNonNegativeInput = (value) => String(value ?? '').replace(/-/g, '');

export const parseNonNegativeNumber = (value, { allowEmpty = false } = {}) => {
  const normalized = sanitizeNonNegativeInput(value).trim().replace(',', '.');

  if (normalized === '') {
    return allowEmpty ? null : NaN;
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    return NaN;
  }

  return parsed;
};

export const isValidNonNegativeNumber = (value, { allowEmpty = false } = {}) => {
  const parsed = parseNonNegativeNumber(value, { allowEmpty });
  return allowEmpty ? parsed === null || !Number.isNaN(parsed) : !Number.isNaN(parsed);
};
