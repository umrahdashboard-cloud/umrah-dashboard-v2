import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { ContactsClient } from './contacts-client'

export default async function ContactsPage() {
  await requireRole('admin')

  return (
    <ContactsClient
      hotels={store.hotels}
      hotelContacts={store.hotelContacts ?? []}
      transportContacts={store.transportContacts ?? []}
    />
  )
}
