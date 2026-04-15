import type { LucideIcon } from 'lucide-react'

interface DashboardStatCardProps {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  colorClass: string
}

export default function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  colorClass,
}: DashboardStatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClass} w-12 h-12 rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{label}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-xs text-gray-400">{hint}</p>
    </div>
  )
}