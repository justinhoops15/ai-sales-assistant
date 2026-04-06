import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-[8px] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/40 whitespace-nowrap',
  {
    variants: {
      variant: {
        default:     'bg-cyan text-ink hover:shadow-[0_0_0_4px_rgba(34,211,238,0.15)]',
        secondary:   'bg-transparent border border-rim text-white hover:bg-raised',
        ghost:       'bg-transparent border border-transparent text-slate hover:text-white hover:bg-raised',
        destructive: 'bg-rose text-white hover:opacity-90',
        success:     'bg-emerald text-white hover:opacity-90',
        outline:     'border border-rim text-white bg-transparent hover:bg-raised',
        link:        'bg-transparent text-cyan underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'px-6 py-2.5 text-sm',
        sm:      'px-4 py-2 text-xs',
        lg:      'px-8 py-3.5 text-base',
        icon:    'h-9 w-9 rounded-[6px]',
        full:    'w-full px-6 py-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
)

export const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { buttonVariants }
