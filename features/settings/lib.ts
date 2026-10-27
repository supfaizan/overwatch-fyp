const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** Token counts the way usage pages show them: 950, 12.3K, 4.1M. */
export const formatTokens = (count: number) => {
  return compact.format(count);
};

/** Dollars to the cent, or to four places below a cent so small calls don't read as free. */
export const formatCost = (usd: number) => {
  const digits = usd > 0 && usd < 0.01 ? 4 : 2;
  return `$${usd.toFixed(digits)}`;
};
