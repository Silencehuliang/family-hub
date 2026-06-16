import { useMobile } from '@/hooks/useMobile';
import { TodoDetailPageMobile } from './TodoDetailPageMobile';
import { TodoDetailPageDesktop } from './TodoDetailPageDesktop';

export function TodoDetailPage() {
  return useMobile() ? <TodoDetailPageMobile /> : <TodoDetailPageDesktop />;
}
