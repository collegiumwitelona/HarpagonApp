import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, Tooltip 
} from 'recharts';


const getDaysInMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

const generateMonthlyData = (transactions, type) => {
  const daysCount = getDaysInMonth();
  const data = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (let i = 1; i <= daysCount; i++) {
    data.push({ 
      day: i < 10 ? `0${i}` : `${i}`, 
      amount: 0 
    });
  }

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    if (
      t.type === type && 
      tDate.getMonth() === currentMonth && 
      tDate.getFullYear() === currentYear
    ) {
      const dayIndex = tDate.getDate() - 1;
      if (data[dayIndex]) {
        data[dayIndex].amount += t.amount;
      }
    }
  });

  return data;
};

const DashboardPage = () => {
  const [balance, setBalance] = useState(10500);
  const [goal, setGoal] = useState(100000);
  const [tempBalance, setTempBalance] = useState("");
  const [tempGoal, setTempGoal] = useState("");

  const [transactions, setTransactions] = useState([
    { id: 1, type: 'wydatek', category: 'Zakupy', amount: 450, date: '2026-03-30' },
    { id: 2, type: 'wpływ', category: 'Pensja', amount: 6000, date: '2026-03-28' },
    { id: 3, type: 'wydatek', category: 'Auto', amount: 1200, date: '2026-03-25' },
  ]);

  const expensesBarData = useMemo(() => generateMonthlyData(transactions, 'wydatek'), [transactions]);
  const incomesBarData = useMemo(() => generateMonthlyData(transactions, 'wpływ'), [transactions]);
  
  const pieData = [
    { name: 'Stan konta', value: balance },
    { name: 'Pozostało', value: Math.max(0, goal - balance) },
  ];
  const PIE_COLORS = ['#7c3aed', '#60a5fa'];

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const type = formData.get('type');
    
    if (isNaN(amount) || amount <= 0) return;

    const newTransaction = {
      id: Date.now(),
      type: type,
      category: formData.get('category'),
      amount: amount,
      date: new Date().toISOString().split('T')[0]
    };

    setTransactions([newTransaction, ...transactions]);
    setBalance(prev => type === 'wpływ' ? prev + amount : prev - amount);
    e.target.reset();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar>
        <div className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors group">
          <div className="w-6 h-0.5 bg-slate-900 mb-1.5 group-hover:bg-violet-700 transition-colors"></div>
          <div className="w-6 h-0.5 bg-slate-900 mb-1.5 group-hover:bg-violet-700 transition-colors"></div>
          <div className="w-6 h-0.5 bg-slate-900 group-hover:bg-violet-700 transition-colors"></div>
        </div>
      </Navbar>

<main className="grow pt-0 px-4 pb-4 lg:pt-0 lg:px-6 lg:pb-6 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto w-full min-h-0">        
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 flex flex-col min-h-0">
          <h2 className="text-xl font-bold mb-4 tracking-tight">Transakcje</h2>
          
          <form onSubmit={handleAddTransaction} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <div className="flex gap-2">
              <select name="type" className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-violet-500">
                <option value="wydatek">Wydatek</option>
                <option value="wpływ">Wpływ</option>
              </select>
              <select name="category" className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-violet-500">
                <option value="Zakupy">Zakupy</option>
                <option value="Hobby">Hobby</option>
                <option value="Rachunki">Rachunki</option>
                <option value="Auto">Auto</option>
                <option value="Inne">Inne</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input name="amount" type="number" placeholder="Kwota zł" className="grow p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-violet-500" required />
              <button type="submit" className="bg-violet-600 text-white px-5 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors">Dodaj</button>
            </div>
          </form>

          <div className="grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {transactions.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div>
                  <p className="font-bold text-sm">{t.category}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{t.date}</p>
                </div>
                <span className={`font-bold text-sm ${t.type === 'wpływ' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {t.type === 'wpływ' ? '+' : '-'}{t.amount.toLocaleString()} zł
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 flex flex-col min-h-0 text-center">
          
          <div className="grid grid-cols-1 gap-2 mb-4"> 
            <div className="bg-violet-50 p-3 rounded-2xl border border-violet-100">
              <p className="text-[9px] font-bold text-violet-600 uppercase tracking-widest">Stan konta</p>
              <h3 className="text-xl font-black text-slate-900">{balance.toLocaleString()} zł</h3>
              <div className="flex gap-2 mt-1 max-w-50 mx-auto">
                <input 
                  value={tempBalance} 
                  onChange={(e) => setTempBalance(e.target.value)} 
                  type="number" 
                  className="flex-1 text-[10px] p-1 rounded-lg border border-violet-200 outline-none" 
                  placeholder="Zmień..." 
                />
                <button 
                  onClick={() => {setBalance(parseFloat(tempBalance) || balance); setTempBalance("")}} 
                  className="bg-violet-600 text-white px-2 rounded-lg text-[9px] font-bold hover:bg-violet-700"
                >
                  OK
                </button>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Cel oszczędzania</p>
              <h3 className="text-xl font-black text-slate-900">{goal.toLocaleString()} zł</h3>
              <div className="flex gap-2 mt-1 max-w-50 mx-auto">
                <input 
                  value={tempGoal} 
                  onChange={(e) => setTempGoal(e.target.value)} 
                  type="number" 
                  className="flex-1 text-[10px] p-1 rounded-lg border border-blue-200 outline-none" 
                  placeholder="Zmień..." 
                />
                <button 
                  onClick={() => {setGoal(parseFloat(tempGoal) || goal); setTempGoal("")}} 
                  className="bg-blue-600 text-white px-2 rounded-lg text-[9px] font-bold hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>

          <div className="grow relative min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  innerRadius="75%" 
                  outerRadius="95%" 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip cornerRadius={10} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900">{Math.round((balance/goal)*100)}%</span>
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-tight">Realizacji</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 flex flex-col gap-6 min-h-0">
          <div className="h-1/2 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Wydatki (Dni)</h3>
            <div className="grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesBarData}>
                  <XAxis dataKey="day" fontSize={9} axisLine={false} tickLine={false} interval={4} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="amount" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="h-1/2 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Wpływy (Dni)</h3>
            <div className="grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomesBarData}>
                  <XAxis dataKey="day" fontSize={9} axisLine={false} tickLine={false} interval={4} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="amount" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;