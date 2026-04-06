import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-surface border border-rim rounded-[8px] p-6 text-white',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

export const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-[10px] uppercase tracking-[0.14em] text-stone font-medium mb-4', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

export const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardRow = forwardRef(({ label, value, accent, large, warn, success, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex justify-between items-baseline py-2 border-b border-rim', className)}
    {...props}
  >
    <span className="text-sm text-slate">{label}</span>
    <span className={cn(
      large ? 'text-xl' : 'text-sm',
      large || accent ? 'font-semibold' : 'font-normal',
      warn    ? 'text-amber'   :
      success ? 'text-emerald' :
      accent  ? 'text-cyan'    :
                'text-white',
    )}>
      {value}
    </span>
  </div>
))
CardRow.displayName = 'CardRow'
