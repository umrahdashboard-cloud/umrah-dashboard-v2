import { store } from '@/lib/demo-store'
import { QuotePreviewClient } from './quote-preview-client'

export default function QuotePreviewPage() {
  return <QuotePreviewClient branding={store.branding} />
}
