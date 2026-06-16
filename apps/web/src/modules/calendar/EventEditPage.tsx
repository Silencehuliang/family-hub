import { useMobile } from '@/hooks/useMobile';
import { EventEditPageMobile } from './EventEditPageMobile';
import { EventEditPageDesktop } from './EventEditPageDesktop';

export function EventEditPage() {
  return useMobile() ? <EventEditPageMobile /> : <EventEditPageDesktop />;
}
