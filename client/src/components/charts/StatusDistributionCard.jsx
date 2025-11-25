import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

// Blue shades only - matching reference image
const STATUS_COLORS = {
  Completed: "#1e40af",      // Dark blue
  "In Progress": "#3b82f6",  // Medium blue
  "Not Started": "#60a5fa",  // Light blue
  Overdue: "#93c5fd",        // Very light blue
};

function formatData(distribution) {
  return [
    { name: "Completed", value: distribution.completed },
    { name: "In Progress", value: distribution.inProgress },
    { name: "Not Started", value: distribution.notStarted },
    { name: "Overdue", value: distribution.overdue },
  ].filter(item => item.value > 0); // Only show segments with values
}

// Custom label component to position percentages outside the pie
const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent }) => {
  if (percent === 0) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30; // Position labels outside the pie
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="#1e40af" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="15px"
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function StatusDistributionCard({ statusDistribution }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statusDistribution.map((group, index) => {
        const data = formatData(group);
        return (
          <div 
            key={group.groupName} 
            className="flex flex-col items-center space-y-4 bg-gray-50 p-6 rounded-lg shadow-md border-2 border-gray-200"
            style={{
              animation: 'fadeInUp 0.5s ease-out forwards',
              opacity: 0,
              animationDelay: `${index * 0.1}s`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12), 0 6px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div className="font-bold text-gray-800 text-lg mb-2">{group.groupName}</div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 50, bottom: 20, left: 50 }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={0}
                  label={renderCustomLabel}
                  labelLine={false}
                  stroke="white"
                  strokeWidth={1.5}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} items`} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend - 2 columns layout */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
              {data.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: STATUS_COLORS[entry.name] }}
                  />
                  <span className="text-xs text-gray-700">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
