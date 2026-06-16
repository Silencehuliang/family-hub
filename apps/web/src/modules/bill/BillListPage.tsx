import { useMobile } from '@/hooks/useMobile';
import { BillListPageMobile } from './BillListPageMobile';
import { BillListPageDesktop } from './BillListPageDesktop';

export function BillListPage() {
  return useMobile() ? <BillListPageMobile /> : <BillListPageDesktop />;
}
