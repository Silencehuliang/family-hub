import { useMobile } from '@/hooks/useMobile';
import { BillImportPageMobile } from './BillImportPageMobile';
import { BillImportPageDesktop } from './BillImportPageDesktop';

export function BillImportPage() {
  return useMobile() ? <BillImportPageMobile /> : <BillImportPageDesktop />;
}
