import { cn } from "@/lib/utils"

type AvatarProps = {
  firstName: string
  lastName: string
  photoUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
}

const colors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-amber-500",
]

function getColor(name: string): string {
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
