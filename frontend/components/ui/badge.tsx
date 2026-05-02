import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-violet-600/20 text-violet-400',
        secondary: 'border-zinc-700 bg-zinc-800 text-zinc-400',
        destructive: 'border-transparent bg-red-600/20 text-red-400',
        success: 'border-transparent bg-emerald-600/20 text-emerald-400',
        warning: 'border-transparent bg-yellow-600/20 text-yellow-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
