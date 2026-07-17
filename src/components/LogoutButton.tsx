'use client';

import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth/actions';
import { PendingActionButton } from '@/components/PendingActionButton';
import { messages } from '@/lib/messages';
import { loginPath } from '@/lib/pathname';

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
      variant="ghost"
      size="sm"
      type="button"
      action={handleLogout}
      className="h-10 w-10 p-0 text-muted hover:text-danger"
      title={messages.common.logout}
      aria-label={messages.common.logout}
      idleContent={<LogOut className="h-5 w-5" />}
      pendingContent={<Loader2 className="h-5 w-5 animate-spin" />}
    />
  );
}
