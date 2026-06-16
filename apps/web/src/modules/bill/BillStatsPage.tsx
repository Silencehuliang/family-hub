import { useMobile } from '@/hooks/useMobile';
import { BillStatsPageMobile } from './BillStatsPageMobile';
import { BillStatsPageDesktop } from './BillStatsPageDesktop';

export function BillStatsPage() {
  return useMobile() ? <BillStatsPageMobile /> : <BillStatsPageDesktop />;
}
