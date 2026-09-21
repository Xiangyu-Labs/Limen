'use client';

import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth/actions';
import { PendingActionButton } from '@/components/PendingActionButton';
import { messages } from '@/lib/messages';
import { loginPath } from '@/lib/pathname';

/**
 * Lives on the settings page rather than the header, where it sat next to 新建
 * with no confirmation — an easy mis-tap on mobile that costs a password entry.
 */
export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const result = await logout();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('已退出');
      router.replace(loginPath());
      router.refresh();
    } catch {
      toast.error('退出失败，请重试');
    }
  }

  return (
    <PendingActionButton
      variant="secondary"
      type="button"
      action={handleLogout}
      idleContent={
        <>
          <LogOut className="h-4 w-4" />
          {messages.common.logout}
        </>
      }
      pendingContent={
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {messages.common.logout}
        </>
      }
    />
  );
}
