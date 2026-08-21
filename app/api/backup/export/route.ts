import { NextRequest, NextResponse } from 'next/server'
import { exportBackup } from '@/lib/backup'

export async function POST(request: NextRequest) {
  try {
    const { timelineFrom, timelineTo } = await request.json()

    const backupData = await exportBackup(timelineFrom || '', timelineTo || '')

    // Send as downloadable file
    const fileName = `crm-backup-${new Date().toISOString().split('T')[0]}.json`
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('[v0] Backup export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Backup export failed' },
      { status: 500 }
    )
  }
}
