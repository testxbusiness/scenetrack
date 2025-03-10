'use client'

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'

interface LocationHeatmapProps {
  data: {
    name: string
    value: number
  }[]
}

// Generate a color based on the value (higher values = darker colors)
const getColor = (value: number, max: number) => {
  // Calculate a percentage (0-100) of this value compared to the max
  const percentage = (value / max) * 100
  
  // Base color: indigo
  const r = Math.round(79 - (percentage * 0.3)) // 79 -> darker
  const g = Math.round(70 - (percentage * 0.3)) // 70 -> darker
  const b = Math.round(229 - (percentage * 0.1)) // 229 -> slightly darker
  
  return `rgb(${r}, ${g}, ${b})`
}

export default function LocationHeatmap({ data }: LocationHeatmapProps) {
  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Nessun dato disponibile
      </div>
    )
  }

  // Find the maximum value for color scaling
  const maxValue = Math.max(...data.map(item => item.value))
  
  // Format data for treemap
  const formattedData = data.map(item => ({
    name: item.name,
    size: item.value,
    fill: getColor(item.value, maxValue)
  }))

  // Prepare data structure for Treemap
  const treeMapData = {
    name: 'locations',
    children: formattedData
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={formattedData}
          dataKey="size"
          nameKey="name"
          aspectRatio={4/3}
          stroke="#fff"
        >
          <Tooltip
            formatter={(value: number) => [`${value} scene`, 'Quantità']}
            labelFormatter={(name) => `Location: ${name}`}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}
