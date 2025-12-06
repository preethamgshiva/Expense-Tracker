import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {

  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Legend,
  Sector
} from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, CreditCard, DollarSign, Plus, Settings, User, Trash2, Edit2, Check, X, LogOut, Download, ChevronLeft, ChevronRight } from "lucide-react";

export default function Dashboard() {
  // Dashboard Component
  const navigate = useNavigate();
  const PieAny = Pie as any;
  const [open, setOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingCategory, setEditingCategory] = useState<{index: number, value: string} | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "",
    type: "expense",
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD in local time
  });

  // Theme State
  const [theme, setTheme] = useState<'light' | 'black'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'black') || 'black';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'black') {
      root.classList.add('dark');
      root.classList.add('black-mode');
    } else {
      root.classList.remove('dark');
      root.classList.remove('black-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);



  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const API_URL = import.meta.env.VITE_API_URL || "";
        
        // Fetch User
        const userRes = await fetch(`${API_URL}/api/auth/me`, { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          setCategories(userData.categories || []);
        } else {
          // If token is invalid, redirect to login
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        // Fetch Transactions
        const transRes = await fetch(`${API_URL}/api/transactions`, { headers });
        if (transRes.ok) {
          const transData = await transRes.json();
          const formattedTrans = transData.map((t: any) => ({
            ...t,
            date: new Date(t.date),
            timestamp: new Date(t.date)
          }));
          setTransactions(formattedTrans);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const updateCategoriesOnServer = async (newCategories: string[]) => {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || "";
    try {
      await fetch(`${API_URL}/api/auth/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories: newCategories })
      });
      setCategories(newCategories);
    } catch (error) {
      console.error("Error updating categories:", error);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const updated = [...categories, newCategory.trim()];
      updateCategoriesOnServer(updated);
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    updateCategoriesOnServer(updated);
  };

  const startEditing = (index: number, value: string) => {
    setEditingCategory({ index, value });
  };

  const saveCategoryEdit = () => {
    if (editingCategory && editingCategory.value.trim()) {
      const updated = [...categories];
      updated[editingCategory.index] = editingCategory.value.trim();
      updateCategoriesOnServer(updated);
      setEditingCategory(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || !formData.category || !formData.date) {
      return;
    }

    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || "";
    
    // Add current time if the selected date is today
    let finalDate = new Date(formData.date);
    const today = new Date();
    if (finalDate.toDateString() === today.toDateString()) {
        finalDate = new Date(); // Use current full timestamp
    }

    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name || "Untitled",
          amount: formData.type === "expense" ? -Math.abs(amount) : Math.abs(amount),
          category: formData.category,
          type: formData.type,
          date: finalDate // Send full date object
        })
      });

      if (res.ok) {
        const newTrans = await res.json();
        setTransactions([{ ...newTrans, date: new Date(newTrans.date) }, ...transactions]);
        setFormData({ ...formData, name: "", amount: "" });
        setOpen(false);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || "";
    try {
      await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTransactions(transactions.filter(t => t._id !== id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Expense Tracker Report", 14, 22);
    
    // Add user info and date
    doc.setFontSize(11);
    doc.text(`User: ${user?.username || "User"}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
    
    // Add summary
    doc.text(`Total Balance: ₹${balance.toLocaleString('en-IN')}`, 14, 46);
    doc.text(`Total Income: ₹${totalIncome.toLocaleString('en-IN')}`, 14, 52);
    doc.text(`Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`, 14, 58);

    // Add table
    const tableColumn = ["Date", "Name", "Category", "Type", "Amount"];
    const tableRows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.name,
      t.category,
      t.type,
      `₹${Math.abs(t.amount).toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
    });

    doc.save("expense-report.pdf");
  };

  const totalIncome = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
  const totalExpenses = transactions.reduce((sum, t) => t.type === 'expense' ? sum + Math.abs(t.amount) : sum, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0.0";

  // Process monthly data
  const monthlyDataMap = new Map();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthIndex = date.getMonth();
    const month = monthNames[monthIndex];
    
    if (!monthlyDataMap.has(month)) {
      monthlyDataMap.set(month, { month, income: 0, expenses: 0, balance: 0, index: monthIndex });
    }
    const data = monthlyDataMap.get(month);
    if (t.type === 'income') data.income += t.amount;
    else data.expenses += Math.abs(t.amount);
    data.balance = data.income - data.expenses;
  });

  const monthlyData = Array.from(monthlyDataMap.values())
    .sort((a: any, b: any) => a.index - b.index)
    .map(({ index, ...rest }: any) => rest);

  // Active Shape for Pie Chart
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xl font-bold fill-foreground">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`₹${value.toLocaleString('en-IN')}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`(${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  // Process category data
  const categoryColors: Record<string, string> = {
    "Food": "#8b5cf6",
    "Transport": "#06b6d4",
    "Entertainment": "#f59e0b",
    "Bills": "#ef4444",
    "Shopping": "#10b981",
    "Healthcare": "#ec4899",
    "Education": "#3b82f6",
    "Other": "#6b7280"
  };

  const categoryDataMap = new Map();
  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!categoryDataMap.has(t.category)) {
      categoryDataMap.set(t.category, { 
        name: t.category, 
        value: 0, 
        color: categoryColors[t.category] || "#" + Math.floor(Math.random()*16777215).toString(16) 
      });
    }
    categoryDataMap.get(t.category).value += Math.abs(t.amount);
  });
  const categoryData = Array.from(categoryDataMap.values());

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const currentMonthIncome = currentMonthTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
  const currentMonthExpenses = currentMonthTransactions.reduce((sum, t) => t.type === 'expense' ? sum + Math.abs(t.amount) : sum, 0);

  const currentMonthData = {
    income: currentMonthIncome,
    expenses: currentMonthExpenses,
  };

  // Previous Month Calculations
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonth = prevMonthDate.getMonth();
  const prevMonthYear = prevMonthDate.getFullYear();

  const prevMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === prevMonth && date.getFullYear() === prevMonthYear;
  });

  const prevMonthIncome = prevMonthTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
  const prevMonthExpenses = prevMonthTransactions.reduce((sum, t) => t.type === 'expense' ? sum + Math.abs(t.amount) : sum, 0);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = calculateChange(currentMonthIncome, prevMonthIncome);
  const expenseChange = calculateChange(currentMonthExpenses, prevMonthExpenses);

  const formatDateDisplay = (dateInput: Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) {
        return `Today at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }
    if (isYesterday) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const statsCards = [
    {
      title: "Total Balance",
      icon: Wallet,
      amount: balance,
      subtext: `${savingsRate}% savings rate`,
      subtextColor: "text-green-600",
      subIcon: ArrowUpRight
    },
    {
      title: "Total Income",
      icon: TrendingUp,
      amount: totalIncome,
      subtext: `${Math.abs(incomeChange).toFixed(1)}% from last month`,
      subtextColor: incomeChange >= 0 ? "text-green-600" : "text-red-600",
      subIcon: incomeChange >= 0 ? ArrowUpRight : ArrowDownRight
    },
    {
      title: "Total Expenses",
      icon: CreditCard,
      amount: totalExpenses,
      subtext: `${Math.abs(expenseChange).toFixed(1)}% from last month`,
      subtextColor: expenseChange <= 0 ? "text-green-600" : "text-red-600",
      subIcon: expenseChange <= 0 ? ArrowDownRight : ArrowUpRight
    },
    {
      title: "This Month",
      icon: DollarSign,
      amount: currentMonthData.expenses,
      subtext: `of ₹${currentMonthData.income.toLocaleString('en-IN')} budget`,
      subtextColor: "text-muted-foreground",
      subIcon: null
    }
  ];

  // Pagination and Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const itemsPerPage = 5;

  // Filter Logic
  const filteredTransactionsList = transactions.filter(t => {
    if (selectedMonth === "all") return true;
    const date = new Date(t.date);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    return monthYear === selectedMonth;
  });

  const totalPages = Math.ceil(filteredTransactionsList.length / itemsPerPage);
  const paginatedTransactions = filteredTransactionsList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const availableMonths = Array.from(new Set(transactions.map(t => {
    const date = new Date(t.date);
    return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  })));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 } as const
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto mb-8 flex items-center justify-between border-b border-border/40 pb-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-2 rounded-b-lg"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/20">
            <User className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent truncate max-w-[120px] md:max-w-none">
              {user?.username || "User"}
            </h2>
            <p className="text-xs text-muted-foreground hidden md:block">Manage your expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleDownloadPDF} className="rounded-full hover:bg-primary/10 transition-colors" title="Download Report">
            <Download className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="rounded-full hover:bg-primary/10 transition-colors" title="Settings">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="rounded-full hover:bg-red-50 hover:text-red-600 transition-colors" title="Logout">
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </motion.header>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your preferences and categories.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Theme Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Appearance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-all ${theme === 'black' ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'}`}
                  onClick={() => setTheme('black')}
                >
                  <div className="h-10 w-full rounded bg-black border border-white/10 shadow-sm"></div>
                  <span className="text-sm font-medium">Midnight Black</span>
                </div>
                <div 
                  className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'}`}
                  onClick={() => setTheme('light')}
                >
                  <div className="h-10 w-full rounded bg-white border border-gray-200 shadow-sm"></div>
                  <span className="text-sm font-medium">Light Mode</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {categories.map((cat, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  {editingCategory?.index === index ? (
                    <Input
                      value={editingCategory.value}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, value: e.target.value })
                      }
                      className="h-8"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-between rounded-md border border-transparent px-2 py-1 hover:bg-muted/50 group-hover:border-border transition-colors">
                      <span className="text-sm">{cat}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {editingCategory?.index === index ? (
                      <>
                        <Button
                          size="icon"
                          onClick={saveCategoryEdit}
                          className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white shadow-sm"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => setEditingCategory(null)}
                          className="h-8 w-8 bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-sm"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(index, cat)}
                          className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(index)}
                          className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <Input
                placeholder="New Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                className="h-9"
              />
              <Button
                size="icon"
                onClick={handleAddCategory}
                className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                title="Add Category"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Track your expenses and manage your budget</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20" size="lg">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Add a new income or expense transaction to track your finances.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background dark:bg-muted px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    max={new Date().toLocaleDateString('en-CA')}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={formData.type === "expense" ? "default" : "secondary"}
                      onClick={() => setFormData({ ...formData, type: "expense" })}
                      className="w-full"
                    >
                      Expense
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === "income" ? "default" : "secondary"}
                      onClick={() => setFormData({ ...formData, type: "income" })}
                      className="w-full"
                    >
                      Income
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Transaction Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Grocery Shopping"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                  >
                    Add Transaction
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards - Desktop Grid */}
        <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <motion.div key={index} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 bg-primary/5 rounded-full">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">₹{stat.amount.toLocaleString('en-IN')}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className={`${stat.subtextColor} inline-flex items-center font-medium`}>
                      {stat.subIcon && <stat.subIcon className="h-3 w-3 mr-1" />}
                      {stat.subtext}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Cards - Mobile Carousel */}
        <div className="md:hidden">
          <Carousel className="w-full max-w-xs mx-auto">
            <CarouselContent>
              {statsCards.map((stat, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card className="border-border/50 shadow-sm glass-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹{stat.amount.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className={`${stat.subtextColor} inline-flex items-center`}>
                            {stat.subIcon && <stat.subIcon className="h-3 w-3" />}
                            {stat.subtext}
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-7">
          {/* Income vs Expenses Chart */}
          <motion.div variants={itemVariants} className="md:col-span-4">
            <Card className="h-full glass-card hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>Monthly comparison of your income and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs text-muted-foreground" 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground" 
                      tickLine={false} 
                      axisLine={false} 
                      dx={-10}
                      tickFormatter={(value) => `₹${value/1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                      }}
                      itemStyle={{ fontSize: '12px' }}
                      labelStyle={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}
                      formatter={(value: number, name: string) => [
                        `₹${value.toLocaleString('en-IN')}`,
                        name === 'balance' ? 'Net Balance' : name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-xs font-medium text-muted-foreground ml-1">{value === 'balance' ? 'Net Balance' : value.charAt(0).toUpperCase() + value.slice(1)}</span>}
                    />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.8} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.8} />
                    <Line type="monotone" dataKey="balance" name="Balance" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div variants={itemVariants} className="md:col-span-3">
            <Card className="h-full glass-card hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Your expense distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <PieAny
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                      animationDuration={1500}
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </PieAny>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {categoryData.slice(0, 6).map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="truncate text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activities</CardDescription>
              </div>
              <Select value={selectedMonth} onValueChange={(val) => { setSelectedMonth(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <SelectValue placeholder="Filter by Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction._id || transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors gap-3 border border-transparent hover:border-border/50 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`h-9 w-9 md:h-10 md:w-10 flex-shrink-0 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                          transaction.amount > 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate group-hover:text-primary transition-colors">{transaction.name}</p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {transaction.category} • {formatDateDisplay(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-base md:text-lg font-semibold flex-shrink-0 ${
                          transaction.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        ₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransaction(transaction._id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {paginatedTransactions.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No transactions found for this period.
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="hover:bg-primary/5"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="hover:bg-primary/5"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
