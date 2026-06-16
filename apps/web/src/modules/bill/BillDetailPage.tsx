import { useMobile } from '@/hooks/useMobile';
import { BillDetailPageMobile } from './BillDetailPageMobile';
import { BillDetailPageDesktop } from './BillDetailPageDesktop';

export function BillDetailPage() {
  return useMobile() ? <BillDetailPageMobile /> : <BillDetailPageDesktop />;
}
