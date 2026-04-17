import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardBarChart = ({ transactions, type, title, color }) => {
  const chartData = useMemo(() => {
    const daysCount = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysCount }, (_, i) => ({ 
      day: (i + 1).toString().padStart(2, '0'), 
      amount: 0 
    }));
    
    const currentMonth = new Date().getMonth();
    
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (t.type === type && tDate.getMonth() === currentMonth) {
        const dayIndex = tDate.getDate() - 1;
        if (data[dayIndex]) data[dayIndex].amount += t.amount;
      }
    });
    return data;
  }, [transactions, type]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</h3>
      <div className="grow min-h-30">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="day" fontSize={8} axisLine={false} tickLine={false} interval={6} />
            <Tooltip cursor={{ fill: '#f8fafc' }}
            formatter={(value) => [`${value.toLocaleString()} zł`, 'Kwota']} />
            <Bar dataKey="amount" fill={color} radius={[4, 4, 0, 0]} barSize={8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardBarChart;