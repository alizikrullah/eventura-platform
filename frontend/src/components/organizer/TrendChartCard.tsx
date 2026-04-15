import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { OrganizerChartPoint } from '@/types/organizerDashboard'

interface TrendChartCardProps {
  title: string
  description: string
  data: OrganizerChartPoint[]
  dataKey: string
  color: string
  emptyMessage: string
  formatValue?: (value: number) => string
}

export default function TrendChartCard({
  title,
  description,
  data,
  dataKey,
  color,
  emptyMessage,
  formatValue,
}: TrendChartCardProps) {
  const hasAnyValue = data.some((item) => item.value > 0)

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {!hasAnyValue ? (
        <div className="h-72 bg-gray-50 rounded-xl flex items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatValue ? (value) => formatValue(Number(value)) : undefined}
              />
              <Tooltip
                formatter={(value: number) => (formatValue ? formatValue(value) : value.toLocaleString('id-ID'))}
                contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="value" name={dataKey} fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}