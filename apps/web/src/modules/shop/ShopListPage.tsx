import { useMobile } from '@/hooks/useMobile';
import { ShopListPageMobile } from './ShopListPageMobile';
import { ShopListPageDesktop } from './ShopListPageDesktop';

export function ShopListPage() {
  return useMobile() ? <ShopListPageMobile /> : <ShopListPageDesktop />;
}
