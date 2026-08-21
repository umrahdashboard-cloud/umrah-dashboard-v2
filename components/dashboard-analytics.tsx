'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { GlassCard } from '@/components/glass'

interface DashboardMetrics {
  totalRevenue: number
  totalBookings: number
  averageBookingValue: number
  pendingPayments: number
  outstandingBalance: number
  activeAgents: number
  completedCommissions: number
  pendingCommissions: number
}

export function DashboardAnalytics({ data }: { data: DashboardMetrics }) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Simulate chart data - replace with actual API call
    setChartData([
      { name: 'Jan', revenue: 450000, bookings: 24 },
      { name: 'Feb', revenue: 520000, bookings: 28 },
      { name: 'Mar', revenue: 480000, bookings: 22 },
      { name: 'Apr', revenue: 610000, bookings: 32 },
      { name: 'May', revenue: 680000, bookings: 35 },
      { name: 'Jun', revenue: 720000, bookings: 38 },
    ])
  }, [])

  const paymentStats = [
    { name: 'Paid', value: data.totalRevenue - data.pendingPayments, color: '#10b981' },
    { name: 'Pending', value: data.pendingPayments, color: '#f59e0b' },
    { name: 'Outstanding', value: data.outstandingBalance, color: '#ef4444' },
  ]

  const commissionStats = [
    { name: 'Paid', value: data.completedCommissions, color: '#10b981' },
    { name: 'Pending', value: data.pendingCommissions, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6">
          <div className="text-sm font-semibold text-gray-400">Total Revenue</div>
          <div className="text-3xl font-bold text-white mt-2">PKR {(data.totalRevenue / 1000).toFixed(1)}K</div>
          <div className="text-xs text-green-400 mt-2">↑ 12% from last month</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm font-semibold text-gray-400">Total Bookings</div>
          <div className="text-3xl font-bold text-white mt-2">{data.totalBookings}</div>
          <div className="text-xs text-green-400 mt-2">↑ 5 new this month</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm font-semibold text-gray-400">Avg Booking Value</div>
          <div className="text-3xl font-bold text-white mt-2">PKR {(data.averageBookingValue / 1000).toFixed(1)}K</div>
          <div className="text-xs text-gray-500 mt-2">Per booking</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm font-semibold text-gray-400">Outstanding Balance</div>
          <div className="text-3xl font-bold text-white mt-2">PKR {(data.outstandingBalance / 1000).toFixed(1)}K</div>
          <div className="text-xs text-red-400 mt-2">⚠ Action needed</div>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Bookings Trend */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue & Bookings Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(11, 14, 20, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Payment Status Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: PKR ${(value / 1000).toFixed(0)}K`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Commission Status */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Commission Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">Commission Distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={commissionStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {commissionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-gray-400">Commission Paid</p>
              <p className="text-2xl font-bold text-green-400">PKR {(data.completedCommissions / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-gray-400">Commission Pending</p>
              <p className="text-2xl font-bold text-yellow-400">PKR {(data.pendingCommissions / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-gray-400">Active Agents</p>
              <p className="text-2xl font-bold text-blue-400">{data.activeAgents}</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
