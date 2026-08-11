"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function MonthlyTrendChart({ data }: { data: { label: string; appointments: number; patients: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0E898F" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#0E898F" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 11, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          labelStyle={{ fontWeight: 700, color: "#1e293b" }}
        />
        <Area type="monotone" dataKey="appointments" stroke="#0E898F" strokeWidth={2} fill="url(#apptGrad)" name="Appointments" dot={{ r: 3, fill: "#0E898F", strokeWidth: 0 }} activeDot={{ r: 5 }} />
        <Area type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={2} fill="url(#patGrad)" name="New Patients" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
