'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PackageRedirect({ packageId }: { packageId: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/vpm?v=${packageId}`)
  }, [packageId, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="animate-spin text-fd-muted-foreground/50" />
    </div>
  )
}
