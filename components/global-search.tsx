'use client'

import { useState, useCallback, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { globalSearch, type SearchFilters } from '@/lib/search'

interface SearchResult {
  id: string
  type: 'booking' | 'invoice' | 'payment'
  title: string
  description: string
  date: string
  amount?: number
  status: string
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
  })

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = useCallback((searchQuery: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!searchQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const searchFilters: SearchFilters = {
          ...filters,
          query: searchQuery,
        }
        const found = await globalSearch(searchFilters)
        setResults(found)
      } catch (error) {
        console.error('[v0] Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [filters])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    if (query.trim()) {
      handleSearch(query)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'text-blue-400'
      case 'invoice':
        return 'text-green-400'
      case 'payment':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅'
      case 'invoice':
        return '📄'
      case 'payment':
        return '💳'
      default:
        return '📌'
    }
  }

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-400 transition-all"
      >
        <Search size={16} />
        <span>Search...</span>
        <span className="ml-2 text-xs bg-white/5 px-2 py-1 rounded">Ctrl K</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20">
          <div className="w-full max-w-2xl rounded-lg bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search size={20} className="text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search bookings, invoices, payments..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
              />
              <button
                onClick={() => {
                  setIsOpen(false)
                  setQuery('')
                  setResults([])
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 text-xs">
              <span className="text-gray-400">Filter:</span>
              <select
                value={filters.type || 'all'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded px-2 py-1 text-xs cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="booking">Bookings</option>
                <option value="invoice">Invoices</option>
                <option value="payment">Payments</option>
              </select>

              <select
                value={filters.paymentStatus || ''}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value || undefined)}
                className="bg-white/5 border border-white/10 text-white rounded px-2 py-1 text-xs cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Searching...</div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  {query ? 'No results found' : 'Start typing to search'}
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${getTypeColor(result.type)}`}>
                            {result.title}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">{result.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>{result.date}</span>
                            {result.amount && <span>• PKR {(result.amount / 1000).toFixed(1)}K</span>}
                            <span className="capitalize">• {result.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
