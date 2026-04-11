import type { Locale } from './config';
import { enMessages } from './messages/en';
import { zhMessages } from './messages/zh';

export function getMessages(locale: Locale) {
  return locale === 'zh' ? zhMessages : enMessages;
}
