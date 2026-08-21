'use client'

import { useState, useRef } from 'react'
import { Download, Upload, Lock } from 'lucide-react'
import { GlassCard, GlassButton } from '@/components/glass'
import { useToast } from '@/components/toast'

export function BackupClient() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [restorePassword, setRestorePassword] = useState('')
  const [puzzleAnswer, setPuzzleAnswer] = useState('')
  const [showPuzzle, setShowPuzzle] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportBackup = async () => {
    // Dates are optional - if not provided, backup all data
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      toast('Start date must be before end date', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timelineFrom: dateFrom,
          timelineTo: dateTo,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export backup')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast('Backup exported successfully')
    } catch (error) {
      console.error('[v0] Export error:', error)
      toast(error instanceof Error ? error.message : 'Failed to export backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const backupData = JSON.parse(content)
        setShowPuzzle(true)
      } catch (error) {
        toast('Invalid backup file format', 'error')
      }
    }
    reader.readAsText(file)
  }

  const handleRestoreBackup = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast('Please select a backup file', 'error')
      return
    }

    if (!restorePassword) {
      toast('Please enter the backup password', 'error')
      return
    }

    if (!puzzleAnswer) {
      toast('Please answer the security puzzle', 'error')
      return
    }

    setLoading(true)
    try {
      const content = await file.text()
      const backupData = JSON.parse(content)

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupData,
          password: restorePassword,
          puzzleAnswer,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to restore backup')
      }

      toast('Backup restored successfully')
      setRestorePassword('')
      setPuzzleAnswer('')
      setShowPuzzle(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('[v0] Restore error:', error)
      toast(error instanceof Error ? error.message : 'Failed to restore backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-muted rounded-full p-1">
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 px-4 py-2 rounded-full cursor-pointer text-sm font-medium transition-colors ${activeTab === 'export'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Download className="h-4 w-4 inline mr-2" />
          Export Backup
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 px-4 py-2 rounded-full cursor-pointer text-sm font-medium transition-colors ${activeTab === 'import'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Restore Backup
        </button>
      </div>

      {activeTab === 'export' && (
        <GlassCard blur className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Export CRM Data Backup</h3>
          <p className="text-sm text-muted-foreground">
            Create a complete backup of all CRM data including bookings, invoices, ledgers, expenses, and hotel vouchers.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Backup From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Backup To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                />
              </div>
            </div>

            <GlassButton
              onClick={handleExportBackup}
              disabled={loading}
              className="w-full rounded-full"
            >
              <Download className="h-4 w-4" />
              {loading ? 'Exporting...' : 'Export Backup Now'}
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {activeTab === 'import' && (
        <GlassCard blur className="p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Restore CRM Data Backup
          </h3>
          <p className="text-sm text-muted-foreground">
            Restore data from a previously exported backup. This action requires authentication.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Backup File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 rounded-full cursor-pointer bg-background border border-border text-foreground text-sm"
              />
            </div>

            {showPuzzle && (
              <>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Security Verification Required</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    To restore your backup, please complete the security verification.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Backup Password</label>
                      <input
                        type="password"
                        value={restorePassword}
                        onChange={(e) => setRestorePassword(e.target.value)}
                        placeholder="Enter backup password"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Security Puzzle</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        What is the action you&apos;re performing? (Hint: It rhymes with "restore")
                      </p>
                      <input
                        type="text"
                        value={puzzleAnswer}
                        onChange={(e) => setPuzzleAnswer(e.target.value)}
                        placeholder="Your answer"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <GlassButton
                  onClick={handleRestoreBackup}
                  disabled={loading || !restorePassword || !puzzleAnswer}
                  className="w-full"
                >
                  <Upload className="h-4 w-4" />
                  {loading ? 'Restoring...' : 'Restore Backup Now'}
                </GlassButton>

                <p className="text-xs text-destructive">
                  ⚠️ Warning: Restoring a backup will overwrite all current data. This action cannot be undone.
                </p>
              </>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
