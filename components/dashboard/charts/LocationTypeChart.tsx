'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface LocationTypeChartProps {
  data: {
    name: string
    value: number
  }[]
}

// Custom colors for different location types
const COLORS = {
  'INT': '#4F46E5',       // Indigo
  'EST': '#10B981',       // Emerald
  'INT/EST': '#8B5CF6',   // Purple
  'EST/INT': '#6EE7B7',   // Green
  // Default color for any other values
  'DEFAULT': '#9CA3AF'    // Gray
}

export default function LocationTypeChart({ data }: LocationTypeChartProps) {
  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Nessun dato disponibile
      </div>
    )
  }

  // Get color for each location type
  const getColor = (name: string) => {
    return COLORS[name as keyof typeof COLORS] || COLORS.DEFAULT
  }

  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value)

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={60}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} scene`, 'Quantità']}
            labelFormatter={(name) => `${name}`}
          />
          <Bar dataKey="value">
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
