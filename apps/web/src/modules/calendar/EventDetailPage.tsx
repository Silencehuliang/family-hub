import { useMobile } from '@/hooks/useMobile';
import { EventDetailPageMobile } from './EventDetailPageMobile';
import { EventDetailPageDesktop } from './EventDetailPageDesktop';

export function EventDetailPage() {
  return useMobile() ? <EventDetailPageMobile /> : <EventDetailPageDesktop />;
}
