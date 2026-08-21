import { NextRequest, NextResponse } from 'next/server'
import { restoreBackup, type BackupData } from '@/lib/backup'

export async function POST(request: NextRequest) {
  try {
    const { backupData, password, puzzleAnswer } = await request.json()

    if (!backupData || !password || !puzzleAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify puzzle answer (simple security check)
    const correctAnswer = 'RESTORE'
    if (puzzleAnswer.toUpperCase() !== correctAnswer) {
      return NextResponse.json(
        { error: 'Incorrect puzzle answer' },
        { status: 403 }
      )
    }

    await restoreBackup(backupData as BackupData, password)

    return NextResponse.json(
      { success: true, message: 'Backup restored successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Backup restore error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Backup restore failed' },
      { status: 500 }
    )
  }
}
