'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="rounded-full hover:bg-primary/10 hover:text-primary"
    >
      <ArrowLeft className="w-4 h-4" />
    </Button>
  )
}
