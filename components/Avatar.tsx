import { cn } from "@/lib/utils"

interface AvatarProps {
  firstName: string
  lastName: string
  photoUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-20 h-20 text-2xl",
}

const colors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function Avatar({ firstName, lastName, photoUrl, size = "md", className }: AvatarProps) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  const colorClass = getColor(firstName + lastName)

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white font-bold flex-shrink-0",
        colorClass,
        sizeClasses[size],
        className
      )}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  )
}
