import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ProgressByTraineeChart({ traineeStats }) {
  if (!traineeStats || traineeStats.length === 0) {
    return (
      <>
        <div className="font-semibold mb-2">Progress by Trainee</div>
        <div className="text-gray-500 text-center py-10">No trainee data available</div>
      </>
    );
  }

  console.log('📊 ProgressByTraineeChart - traineeStats:', traineeStats);

  const data = traineeStats.map(t => ({
    name: t.traineeName,
    Completed: t.completed || 0,
    "In Progress": t.inProgress || 0,
    "Not Started": t.notStarted || 0,
    Overdue: t.overdue || 0,
  }));

  console.log('📊 ProgressByTraineeChart - mapped data:', data);

  return (
    <>
      <div className="font-semibold mb-2">Progress by Trainee</div>
      <div className="text-gray-500 text-sm mb-4">Task completion status</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={22} barGap={2} barCategoryGap={30} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={100} 
            stroke="#000000"
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis allowDecimals={false} stroke="#000000" width={40} />
          <Tooltip />
          <Legend 
            wrapperStyle={{ color: '#000000' }}
            formatter={(value) => <span style={{ color: '#000000' }}>{value}</span>}
            layout="vertical"
            align="center"
            verticalAlign="bottom"
            content={({ payload }) => {
              if (!payload) return null;
              // Reorder: Completed, Not Started, In Progress, Overdue
              const order = ['Completed', 'Not Started', 'In Progress', 'Overdue'];
              const colorMap = {
                'Completed': '#1e40af',      // Dark blue
                'Not Started': '#60a5fa',    // Light blue
                'In Progress': '#3b82f6',    // Medium blue
                'Overdue': '#93c5fd'         // Very light blue
              };
              const orderedPayload = order.map(name => payload.find(p => p.value === name)).filter(Boolean);
              
              return (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '4px 16px',
                  justifyContent: 'center',
                  marginTop: '10px'
                }}>
                  {orderedPayload.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: colorMap[entry.value] || entry.color,
                        borderRadius: '2px'
                      }} />
                      <span style={{ color: '#000000', fontSize: '14px' }}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Bar dataKey="Completed" fill="#1e40af" />
          <Bar dataKey="Not Started" fill="#60a5fa" />
          <Bar dataKey="In Progress" fill="#3b82f6" />
          <Bar dataKey="Overdue" fill="#93c5fd" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
