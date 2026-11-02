import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: 'default' | 'outline' | 'ghost'; size?: 'default' | 'sm' | 'icon' };
export const Button = React.forwardRef<HTMLButtonElement, Props>(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn('button', `button-${variant}`, `button-${size}`, className)} {...props} />;
});
Button.displayName = 'Button';
