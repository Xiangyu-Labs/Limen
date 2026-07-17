'use client';

import { useTransition, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function PendingActionButton({
  action,
  idleContent,
  pendingContent,
  disabled = false,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  action: () => void | Promise<void>;
  idleContent: ReactNode;
  pendingContent: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      {...props}
      disabled={disabled || isPending}
      onClick={() => startTransition(async () => action())}
    >
      {isPending ? pendingContent : idleContent}
    </Button>
  );
}
