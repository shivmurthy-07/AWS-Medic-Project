const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});

export const formatCurrency = (amount) => {
    const numericAmount = Number(amount);

    return amount == null || !Number.isFinite(numericAmount)
        ? '—'
        : inrFormatter.format(numericAmount);
};
