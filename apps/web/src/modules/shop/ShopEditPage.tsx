import { useMobile } from '@/hooks/useMobile';
import { ShopEditPageMobile } from './ShopEditPageMobile';
import { ShopEditPageDesktop } from './ShopEditPageDesktop';

export function ShopEditPage() {
  return useMobile() ? <ShopEditPageMobile /> : <ShopEditPageDesktop />;
}
