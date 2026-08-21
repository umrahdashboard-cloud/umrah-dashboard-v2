'use client'

import { useState } from 'react'
import { Download, FileJson, FileText } from 'lucide-react'
import { GlassCard, GlassButton } from '@/components/glass'
import { getRevenueByPeriod, getAgentPerformanceReport, getHotelOccupancyReport } from '@/lib/reports'

export function ReportsExport() {
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<'revenue' | 'agents' | 'hotels'>('revenue')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')

  const handleExportRevenue = async () => {
    setLoading(true)
    try {
      if (!dateFrom || !dateTo) {
        alert('Please select date range')
        return
      }

      const reports = await getRevenueByPeriod(dateFrom, dateTo)
      downloadReport(reports, 'revenue-report', exportFormat)
    } catch (error) {
      console.error('[v0] Export error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportAgents = async () => {
    setLoading(true)
    try {
      const reports = await getAgentPerformanceReport()
      downloadReport(reports, 'agent-performance-report', exportFormat)
    } catch (error) {
      console.error('[v0] Export error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportHotels = async () => {
    setLoading(true)
    try {
      const reports = await getHotelOccupancyReport()
      downloadReport(reports, 'hotel-occupancy-report', exportFormat)
    } catch (error) {
      console.error('[v0] Export error:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (data: any, filename: string, format: 'json' | 'csv') => {
    let content: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      mimeType = 'application/json'
    } else {
      // Convert to CSV
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0])
        const rows = data.map((item: any) =>
          headers.map((h) => {
            const value = item[h]
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          })
        )
        content = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n')
      } else {
        content = JSON.stringify(data, null, 2)
      }
      mimeType = 'text/csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <GlassCard className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">Export Reports</h2>

      {/* Report Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-300">Select Report Type</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'revenue', label: 'Revenue Report', desc: 'Revenue, costs, and profit by period' },
            { id: 'agents', label: 'Agent Performance', desc: 'Commission and booking metrics' },
            { id: 'hotels', label: 'Hotel Occupancy', desc: 'Hotel performance and occupancy rates' },
          ].map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id as any)}
              className={`p-3 rounded-lg border transition-all text-left ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-semibold text-white text-sm">{report.label}</p>
              <p className="text-xs text-gray-400 mt-1">{report.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range (for revenue report) */}
      {selectedReport === 'revenue' && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-300">Date Range</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white/10 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white/10 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Export Format */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-300">Export Format</label>
        <div className="flex gap-3">
          {[
            { id: 'json', label: 'JSON', icon: FileJson },
            { id: 'csv', label: 'CSV (Excel)', icon: FileText },
          ].map((fmt) => {
            const Icon = fmt.icon
            return (
              <button
                key={fmt.id}
                onClick={() => setExportFormat(fmt.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  exportFormat === fmt.id
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-semibold">{fmt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Export Button */}
      <div className="pt-4 border-t border-white/10">
        <GlassButton
          onClick={
            selectedReport === 'revenue'
              ? handleExportRevenue
              : selectedReport === 'agents'
                ? handleExportAgents
                : handleExportHotels
          }
          disabled={loading || (selectedReport === 'revenue' && (!dateFrom || !dateTo))}
          className="w-full flex items-center justify-center gap-2"
        >
          <Download size={18} />
          {loading ? 'Generating...' : `Export as ${exportFormat.toUpperCase()}`}
        </GlassButton>
      </div>

      {/* Report Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-white/10">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-300">Revenue Report Includes:</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>✓ Monthly revenue totals</li>
            <li>✓ Cost analysis</li>
            <li>✓ Profit margins</li>
            <li>✓ Average booking value</li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-300">Agent Report Includes:</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>✓ Total bookings per agent</li>
            <li>✓ Revenue generated</li>
            <li>✓ Commission tracking</li>
            <li>✓ Payment status</li>
          </ul>
        </div>
      </div>
    </GlassCard>
  )
}
