import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none',
  {
    variants: {
      variant: {
        default:        'bg-rim text-slate',
        preferred:      'bg-emerald/10 text-emerald border border-emerald/25',
        level:          'bg-emerald/10 text-emerald border border-emerald/25',
        'standard-plus':'bg-cyan/10 text-cyan border border-cyan/25',
        standard:       'bg-rim/50 text-slate border border-rim',
        graded:         'bg-amber/10 text-amber border border-amber/25',
        table:          'bg-amber/10 text-amber border border-amber/25',
        modified:       'bg-tangerine/10 text-tangerine border border-tangerine/25',
        guaranteed:     'bg-rose/10 text-rose border border-rose/25',
        am:             'bg-rim text-slate',
        high:           'bg-emerald/10 text-emerald border border-emerald/25',
        medium:         'bg-amber/10 text-amber border border-amber/25',
        low:            'bg-rose/10 text-rose border border-rose/25',
        term:           'bg-violet/10 text-violet-muted border border-violet/25',
        wl:             'bg-cyan/10 text-cyan border border-cyan/25',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { badgeVariants }
