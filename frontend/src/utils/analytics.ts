export const detectAnomalies = (transactions: any[]) => {
    if (transactions.length < 5) return [];

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .map(t => ({ ...t, amount: Math.abs(Number(t.amount)) }));

    if (expenses.length < 5) return [];

    // Group by category
    const categoryGroups: { [key: string]: number[] } = {};
    expenses.forEach(t => {
        if (!categoryGroups[t.category]) categoryGroups[t.category] = [];
        categoryGroups[t.category].push(t.amount);
    });

    const anomalies: string[] = [];

    // Stats Logic
    const calculateMean = (data: number[]) => data.reduce((a, b) => a + b, 0) / data.length;
    const calculateStdDev = (data: number[], mean: number) => {
        const sqDiffs = data.map(val => Math.pow(val - mean, 2));
        const avgSqDiff = calculateMean(sqDiffs);
        return Math.sqrt(avgSqDiff);
    };

    // Global Anomaly Detection (Z-Score)
    const allAmounts = expenses.map(t => t.amount);
    const mean = calculateMean(allAmounts);
    const stdDev = calculateStdDev(allAmounts, mean);

    const recentGlobalHigh = expenses.find(t => {
        const zScore = (t.amount - mean) / (stdDev || 1); // Avoid div by zero
        return zScore > 2.0; // > 2.0 std devs is significant
    });

    if (recentGlobalHigh) {
        anomalies.push(`High spending detected: ₹${recentGlobalHigh.amount.toLocaleString()} on ${recentGlobalHigh.name}`);
    }

    // Category Specific Detection
    // Placeholder for future more granular logic
    Object.entries(categoryGroups).forEach(([_, amounts]) => {
        if (amounts.length < 3) return;
        // const catMean = calculateMean(amounts);
        // const catStdDev = calculateStdDev(amounts, catMean);
    });

    // Add specific category check if global one isn't enough, but for UI space reasons, return max 1-2
    return anomalies.slice(0, 2);
};

export const calculateTrends = (transactions: any[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthExpenses = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
        })
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const lastMonthExpenses = transactions
        .filter(t => {
            const d = new Date(t.date);
            // Handle Jan case
            const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === targetMonth && d.getFullYear() === targetYear && t.type === 'expense';
        })
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    if (lastMonthExpenses === 0) {
        if (thisMonthExpenses > 0) return `Spending started at ₹${thisMonthExpenses.toLocaleString()}`;
        return "No spending data yet";
    }

    const diff = thisMonthExpenses - lastMonthExpenses;
    const percent = ((diff / lastMonthExpenses) * 100).toFixed(1);

    if (diff > 0) return `Spending up ${percent}% (₹${diff.toLocaleString()}) vs last month`;
    return `Spending down ${Math.abs(Number(percent))}% (₹${Math.abs(diff).toLocaleString()}) vs last month`;
};

export const predictMonthEnd = (transactions: any[]) => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();
    // Days in current month (e.g., 31)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayOfMonth = today.getDate(); // 1-31

    const thisMonthExpenses = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
        })
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    // If it's the very first day, just return actual or 0 to avoid huge scaling
    if (dayOfMonth <= 1) return thisMonthExpenses;

    const avgDaily = thisMonthExpenses / dayOfMonth;

    // Simple linear projection
    const projectTotal = avgDaily * daysInMonth;

    return Math.round(projectTotal);
};
