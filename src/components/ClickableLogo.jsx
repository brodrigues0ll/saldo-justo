'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ClickableLogo({ src, alt, width, height, className }) {
  const router = useRouter()

  function handleDoubleClick() {
    router.push('/login')
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onDoubleClick={handleDoubleClick}
      draggable={false}
    />
  )
}
