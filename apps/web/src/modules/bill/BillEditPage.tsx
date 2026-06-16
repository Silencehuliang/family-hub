import { useMobile } from '@/hooks/useMobile';
import { BillEditPageMobile } from './BillEditPageMobile';
import { BillEditPageDesktop } from './BillEditPageDesktop';

export function BillEditPage() {
  return useMobile() ? <BillEditPageMobile /> : <BillEditPageDesktop />;
}
