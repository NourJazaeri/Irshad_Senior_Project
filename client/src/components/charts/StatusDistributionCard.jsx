import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  Completed: "#10b981",      // Green (matching Marketing Team)
  "In Progress": "#f97316",  // Orange (matching Sales Team)
  "Not Started": "#2563eb",  // Darker Blue
  Overdue: "#ec4899",        // Pink
};

function formatData(distribution) {
  return [
    { name: "Completed", value: distribution.completed },
    { name: "In Progress", value: distribution.inProgress },
    { name: "Not Started", value: distribution.notStarted },
    { name: "Overdue", value: distribution.overdue },
  ].filter(item => item.value > 0); // Only show segments with values
}

export default function StatusDistributionCard({ statusDistribution }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {statusDistribution.map(group => (
        <div key={group.groupName} className="flex flex-col items-center space-y-4">
          <div className="font-bold text-gray-800 text-lg">{group.groupName}</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={formatData(group)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={80}
                label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}
              >
                {formatData(group).map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={STATUS_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} items`} />
              <Legend 
                verticalAlign="bottom" 
                height={50}
                iconType="square"
                iconSize={12}
                wrapperStyle={{ 
                  fontSize: '13px',
                  paddingTop: '10px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
