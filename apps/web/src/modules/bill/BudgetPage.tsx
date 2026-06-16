import { useMobile } from '@/hooks/useMobile';
import { BudgetPageMobile } from './BudgetPageMobile';
import { BudgetPageDesktop } from './BudgetPageDesktop';

export function BudgetPage() {
  return useMobile() ? <BudgetPageMobile /> : <BudgetPageDesktop />;
}
