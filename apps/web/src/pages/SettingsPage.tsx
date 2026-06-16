import { useMobile } from '@/hooks/useMobile';
import { SettingsPageMobile } from './SettingsPageMobile';
import { SettingsPageDesktop } from './SettingsPageDesktop';

export function SettingsPage() {
  return useMobile() ? <SettingsPageMobile /> : <SettingsPageDesktop />;
}
