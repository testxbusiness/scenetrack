'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface TimeOfDayChartProps {
  data: {
    name: string
    value: number
  }[]
}

// Custom colors for different times of day
const COLORS = {
  'GIORNO': '#FFD700',      // Gold
  'NOTTE': '#1E3A8A',       // Dark blue
  'ALBA': '#FFA07A',        // Light salmon
  'TRAMONTO': '#FF4500',    // Orange red
  'CREPUSCOLO': '#6A5ACD',  // Slate blue
  'MATTINA': '#87CEEB',     // Sky blue
  'POMERIGGIO': '#FF8C00',  // Dark orange
  'SERA': '#483D8B',        // Dark slate blue
  // Default color for any other values
  'DEFAULT': '#9CA3AF'      // Gray
}

export default function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Nessun dato disponibile
      </div>
    )
  }

  // Get color for each time of day
  const getColor = (name: string) => {
    return COLORS[name as keyof typeof COLORS] || COLORS.DEFAULT
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} scene`, 'Quantità']}
            labelFormatter={(name) => `${name}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
