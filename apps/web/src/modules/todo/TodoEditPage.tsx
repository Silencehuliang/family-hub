import { useMobile } from '@/hooks/useMobile';
import { TodoEditPageMobile } from './TodoEditPageMobile';
import { TodoEditPageDesktop } from './TodoEditPageDesktop';

export function TodoEditPage() {
  return useMobile() ? <TodoEditPageMobile /> : <TodoEditPageDesktop />;
}
