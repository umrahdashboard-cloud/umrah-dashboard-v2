import { BackupClient } from './backup-client'

export const metadata = {
  title: 'Backup & Restore | Settings',
}

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backup & Restore</h1>
        <p className="text-muted-foreground mt-2">
          Manage backups of all your CRM data with strong security protections
        </p>
      </div>

      <BackupClient />
    </div>
  )
}
