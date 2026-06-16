import { useMobile } from '@/hooks/useMobile';
import { CalendarPageMobile } from './CalendarPageMobile';
import { CalendarPageDesktop } from './CalendarPageDesktop';

export function CalendarPage() {
  return useMobile() ? <CalendarPageMobile /> : <CalendarPageDesktop />;
}
