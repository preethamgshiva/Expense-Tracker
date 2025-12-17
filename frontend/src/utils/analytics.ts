export const detectAnomalies = (transactions: any[]) => {
    if (transactions.length < 5) return [];

    // Group by category to find category-specific outliers
    const categoryGroups: { [key: string]: number[] } = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
            if (!categoryGroups[t.category]) categoryGroups[t.category] = [];
            categoryGroups[t.category].push(Number(t.amount));
        }
    });

    const anomalies: string[] = [];

    // Category-specific outlier detection logic paused for now
    // Object.entries(categoryGroups).forEach(([_, amounts]) => { ... });

    // Simple heuristic for now: Transactions > 2x average expense
    const expenses = transactions.filter(t => t.type === 'expense').map(t => Number(t.amount));
    const avgExpense = expenses.reduce((a, b) => a + b, 0) / expenses.length || 0;

    const recentHigh = transactions.find(t => t.type === 'expense' && Number(t.amount) > avgExpense * 3);
    if (recentHigh) {
        anomalies.push(`Detected unusual high spending: ₹${recentHigh.amount} on ${recentHigh.name}`);
    }

    return anomalies;
};

export const calculateTrends = (transactions: any[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthExpenses = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastMonthExpenses = transactions
        .filter(t => {
            const d = new Date(t.date);
            // Handle Jan case
            const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === targetMonth && d.getFullYear() === targetYear && t.type === 'expense';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

    if (lastMonthExpenses === 0) return "Spending data gathering...";

    const diff = thisMonthExpenses - lastMonthExpenses;
    const percent = ((diff / lastMonthExpenses) * 100).toFixed(1);

    return diff > 0 ? `Spending is up ${percent}% vs last month` : `Spending is down ${Math.abs(Number(percent))}% vs last month`;
};

export const predictMonthEnd = (transactions: any[]) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
    const dayOfMonth = today.getDate();

    const thisMonthExpenses = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === today.getFullYear() && t.type === 'expense';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

    if (dayOfMonth === 0) return thisMonthExpenses;

    const avgDaily = thisMonthExpenses / dayOfMonth;
    const projectTotal = avgDaily * daysInMonth;

    return Math.round(projectTotal);
};
