export const normalizeAccounts = (data) => {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.Data)
        ? data.Data
        : [];

  return raw
    .map((account) => ({
      id: String(account?.id || account?.accountId || account?.Id || ''),
      name: String(account?.name || account?.accountName || account?.Name || ''),
      balance: Number(
        account?.balance ??
          account?.Balance ??
          account?.currentBalance ??
          account?.CurrentBalance ??
          0
      ),
      goal: Number(account?.goal ?? account?.Goal ?? 0),
    }))
    .filter((account) => account.id);
};

export const hasAnyAccount = (data) => normalizeAccounts(data).length > 0;
