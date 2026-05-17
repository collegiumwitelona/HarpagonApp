import { normalizeDate, normalizeTransactionType } from './formatters';

export const extractTransactionsCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const transactionKeys = [
    'transactions',
    'transactionHistory',
    'userTransactions',
    'operations',
    'items',
    'records',
    'data',
    'Data',
  ];

  for (const key of transactionKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  const nestedCandidates = [payload.data, payload.Data, payload.result, payload.Result, payload.user, payload.User];

  for (const candidate of nestedCandidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === 'object') {
      for (const key of transactionKeys) {
        if (Array.isArray(candidate[key])) {
          return candidate[key];
        }
      }
    }
  }

  return [];
};

export const normalizeTransactionTypeFromPayload = (transactionOrType, fallbackAmount = 0) => {
  const isObjectPayload = transactionOrType && typeof transactionOrType === 'object';
  const rawType = isObjectPayload
    ? (
        transactionOrType.type ||
        transactionOrType.transactionType ||
        transactionOrType.kind ||
        transactionOrType.categoryType ||
        transactionOrType.category?.type ||
        transactionOrType.category?.categoryType ||
        ''
      )
    : transactionOrType;

  if (isObjectPayload) {
    if (
      transactionOrType.isIncome === true ||
      transactionOrType.income === true ||
      transactionOrType.isInflow === true
    ) {
      return 'wpływ';
    }

    if (
      transactionOrType.isExpense === true ||
      transactionOrType.expense === true ||
      transactionOrType.isOutflow === true
    ) {
      return 'wydatek';
    }
  }

  const value = String(rawType || '').trim().toLowerCase();
  if (
    [
      'wpływ',
      'wplyw',
      'income',
      'inflow',
      'credit',
      'przychod',
      'przychód',
      '1',
    ].includes(value)
  ) {
    return 'wpływ';
  }

  if (
    [
      'wydatek',
      'expense',
      'outflow',
      'debit',
      'koszt',
      '0',
    ].includes(value)
  ) {
    return 'wydatek';
  }

  const amount = Number(
    isObjectPayload
      ? (transactionOrType.amount ?? transactionOrType.value ?? fallbackAmount)
      : fallbackAmount
  );

  if (!Number.isNaN(amount) && amount > 0) {
    return 'wpływ';
  }

  return normalizeTransactionType(rawType);
};

export const normalizeTransactionRecord = (
  transaction,
  {
    index = 0,
    ownerId = 'user',
    categoriesList = [],
    includeDescription = true,
    normalizeDateValue = true,
    fallbackCategory = 'Inne',
  } = {}
) => {
  const transactionCategoryId =
    transaction?.categoryId || transaction?.categoryID || transaction?.category?.id || '';

  const matchedCategory = Array.isArray(categoriesList)
    ? categoriesList.find((category) => String(category.id) === String(transactionCategoryId))
    : null;

  const amount = Number(transaction?.amount || transaction?.value || 0);
  const rawDate = transaction?.date || transaction?.transactionDate || transaction?.createdAt || '';

  const normalized = {
    id: transaction?.id || transaction?.transactionId || `${ownerId}-${index}`,
    accountId:
      transaction?.accountId ||
      transaction?.accountID ||
      transaction?.account?.id ||
      transaction?.account?.accountId ||
      '',
    type: normalizeTransactionTypeFromPayload(transaction, amount),
    category: String(
      transaction?.categoryName ||
      transaction?.category?.categoryName ||
      transaction?.category?.name ||
      transaction?.category?.nazwaKategorii ||
      matchedCategory?.categoryName ||
      (typeof transaction?.category === 'string' ? transaction.category : null) ||
      transaction?.title ||
      fallbackCategory
    ),
    amount,
    date: normalizeDateValue ? normalizeDate(rawDate) : rawDate,
  };

  if (includeDescription) {
    normalized.description =
      transaction?.description ||
      transaction?.note ||
      transaction?.comment ||
      transaction?.category?.description ||
      '';
  }

  return normalized;
};
