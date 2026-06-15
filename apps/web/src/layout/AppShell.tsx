/**
 * 响应式布局壳
 * 768px 以下:底部 Tab
 * 768px 以上:左侧导航
 */
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '@/core/hooks/useMediaQuery';
import { MobileTabBar } from './MobileTabBar';
import { SideNav } from './SideNav';
import { BREAKPOINT_MOBILE } from '@family-hub/shared';

export function AppShell() {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINT_MOBILE - 1}px)`);

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
        <MobileTabBar />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      <SideNav />
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
