import { useMobile } from '@/hooks/useMobile';
import { TodoListPageMobile } from './TodoListPageMobile';
import { TodoListPageDesktop } from './TodoListPageDesktop';

export function TodoListPage() {
  return useMobile() ? <TodoListPageMobile /> : <TodoListPageDesktop />;
}
