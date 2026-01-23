'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AdminSalesChart({ data }: { data: any[] }) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }} 
            interval={4}
            angle={-25}
            textAnchor="end"
          />
          
          <YAxis 
            allowDecimals={false} 
            tick={{ fontSize: 12 }} 
          />
          
          <Tooltip />
          
          <Bar 
            dataKey="sales" 
            fill="#2563eb" 
            radius={[6, 6, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
