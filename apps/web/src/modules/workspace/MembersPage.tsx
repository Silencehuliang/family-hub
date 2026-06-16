import { useMobile } from '@/hooks/useMobile';
import { MembersPageMobile } from './MembersPageMobile';
import { MembersPageDesktop } from './MembersPageDesktop';

export function MembersPage() {
  return useMobile() ? <MembersPageMobile /> : <MembersPageDesktop />;
}
