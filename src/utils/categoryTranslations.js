const CATEGORY_TRANSLATIONS = {
  food: { pl: 'Jedzenie', en: 'Food' },
  jedzenie: { pl: 'Jedzenie', en: 'Food' },
  groceries: { pl: 'Zakupy spożywcze', en: 'Groceries' },
  'zakupy spozywcze': { pl: 'Zakupy spożywcze', en: 'Groceries' },
  shopping: { pl: 'Zakupy', en: 'Shopping' },
  zakupy: { pl: 'Zakupy', en: 'Shopping' },
  transport: { pl: 'Transport', en: 'Transport' },
  salary: { pl: 'Pensja', en: 'Salary' },
  pensja: { pl: 'Pensja', en: 'Salary' },
  freelance: { pl: 'Freelance', en: 'Freelance' },
  gifts: { pl: 'Prezenty', en: 'Gifts' },
  prezenty: { pl: 'Prezenty', en: 'Gifts' },
  dividends: { pl: 'Dywidendy', en: 'Dividends' },
  dywidendy: { pl: 'Dywidendy', en: 'Dividends' },
  entertainment: { pl: 'Rozrywka', en: 'Entertainment' },
  rozrywka: { pl: 'Rozrywka', en: 'Entertainment' },
  bills: { pl: 'Rachunki', en: 'Bills' },
  rachunki: { pl: 'Rachunki', en: 'Bills' },
  health: { pl: 'Zdrowie', en: 'Health' },
  zdrowie: { pl: 'Zdrowie', en: 'Health' },
  education: { pl: 'Edukacja', en: 'Education' },
  edukacja: { pl: 'Edukacja', en: 'Education' },
  rent: { pl: 'Czynsz', en: 'Rent' },
  czynsz: { pl: 'Czynsz', en: 'Rent' },
  home: { pl: 'Dom', en: 'Home' },
  dom: { pl: 'Dom', en: 'Home' },
  travel: { pl: 'Podróże', en: 'Travel' },
  podroze: { pl: 'Podróże', en: 'Travel' },
  subscriptions: { pl: 'Subskrypcje', en: 'Subscriptions' },
  subskrypcje: { pl: 'Subskrypcje', en: 'Subscriptions' },
  investment: { pl: 'Inwestycje', en: 'Investments' },
  investments: { pl: 'Inwestycje', en: 'Investments' },
  inwestycje: { pl: 'Inwestycje', en: 'Investments' },
  savings: { pl: 'Oszczędności', en: 'Savings' },
  oszczednosci: { pl: 'Oszczędności', en: 'Savings' },
  car: { pl: 'Samochód', en: 'Car' },
  samochod: { pl: 'Samochód', en: 'Car' },
  housing: { pl: 'Mieszkanie', en: 'Housing' },
  mieszkanie: { pl: 'Mieszkanie', en: 'Housing' },
  utilities: { pl: 'Media', en: 'Utilities' },
  media: { pl: 'Media', en: 'Utilities' },
  income: { pl: 'Przychody', en: 'Income' },
  przychody: { pl: 'Przychody', en: 'Income' },
  expense: { pl: 'Wydatki', en: 'Expenses' },
  wydatki: { pl: 'Wydatki', en: 'Expenses' },
  'rental income': { pl: 'Przychód z najmu', en: 'Rental Income' },
  'przychod z najmu': { pl: 'Przychód z najmu', en: 'Rental Income' },
  royalties: { pl: 'Honoraria', en: 'Royalties' },
  honoraria: { pl: 'Honoraria', en: 'Royalties' },
  business: { pl: 'Biznes', en: 'Business' },
  biznes: { pl: 'Biznes', en: 'Business' },
  interest: { pl: 'Odsetki', en: 'Interest' },
  odsetki: { pl: 'Odsetki', en: 'Interest' },
  other: { pl: 'Inne', en: 'Other' },
  inne: { pl: 'Inne', en: 'Other' },
};

const normalizeCategoryKey = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const translateCategoryName = (name, language = 'pl') => {
  const normalizedKey = normalizeCategoryKey(name);
  const match = CATEGORY_TRANSLATIONS[normalizedKey];
  if (!match) {
    return name;
  }

  return match[language === 'en' ? 'en' : 'pl'] || name;
};

export const isBuiltInCategoryName = (name) => Boolean(CATEGORY_TRANSLATIONS[normalizeCategoryKey(name)]);