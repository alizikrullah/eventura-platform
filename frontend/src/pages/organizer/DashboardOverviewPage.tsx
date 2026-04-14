import { TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';

export default function DashboardOverviewPage() {
  // Placeholder data - nanti diganti dengan real data dari API
  const stats = [
    { label: 'Total Events', value: '12', icon: Calendar, color: 'bg-blue-500', change: '+2 this month' },
    { label: 'Active Events', value: '5', icon: TrendingUp, color: 'bg-green-500', change: 'Currently running' },
    { label: 'Total Revenue', value: 'Rp 45.2M', icon: DollarSign, color: 'bg-purple-500', change: '+12% from last month' },
    { label: 'Total Attendees', value: '1,234', icon: Users, color: 'bg-orange-500', change: 'All time' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2">Monitor performa event dan transaksi kamu</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Placeholder for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trends</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-400 text-sm">Chart akan ditambahkan nanti (Recharts)</p>
          </div>
        </div>

        {/* Tickets Sold Chart Placeholder */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tickets Sold</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-400 text-sm">Chart akan ditambahkan nanti (Recharts)</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-900" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Transaction #{i}234</p>
                  <p className="text-xs text-gray-400">Music Festival 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">Rp 150.000</p>
                <p className="text-xs text-green-600">Confirmed</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}