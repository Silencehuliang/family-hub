import { useMobile } from '@/hooks/useMobile';
import { ShopListDetailPageMobile } from './ShopListDetailPageMobile';
import { ShopListDetailPageDesktop } from './ShopListDetailPageDesktop';

export function ShopListDetailPage() {
  return useMobile() ? <ShopListDetailPageMobile /> : <ShopListDetailPageDesktop />;
}
