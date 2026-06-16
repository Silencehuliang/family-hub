import { useMobile } from '@/hooks/useMobile';
import { WorkspacePageMobile } from './WorkspacePageMobile';
import { WorkspacePageDesktop } from './WorkspacePageDesktop';

export function WorkspacePage() {
  return useMobile() ? <WorkspacePageMobile /> : <WorkspacePageDesktop />;
}
