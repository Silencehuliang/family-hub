/**
 * 应用根组件
 * 路由:公开页(Welcome/CreateFamily/RedeemInvite/Login) + 受保护页(AppShell)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { useAuthStore } from '@/core/auth/store';
import { RequireAuth } from '@/core/auth/RequireAuth';
import { AppShell } from '@/layout/AppShell';
import { Welcome } from '@/pages/Welcome';
import { CreateFamily } from '@/pages/CreateFamily';
import { RedeemInvite } from '@/pages/RedeemInvite';
import { Login } from '@/pages/Login';
import { SettingsPage } from '@/pages/SettingsPage';
import { WorkspacePage } from '@/modules/workspace/WorkspacePage';
import { NotFound } from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  const { init, isAuthenticated } = useAuthStore();

  // 应用启动时初始化认证状态
  useEffect(() => {
    init();
  }, [init]);

  // 已登录时如果访问公开页,重定向到首页
  const publicElement = isAuthenticated ? <Navigate to="/" replace /> : undefined;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* 公开页(未登录可访问) */}
            <Route path="/welcome" element={publicElement ?? <Welcome />} />
            <Route path="/create-family" element={publicElement ?? <CreateFamily />} />
            <Route path="/redeem" element={publicElement ?? <RedeemInvite />} />
            <Route path="/login" element={publicElement ?? <Login />} />

            {/* 受保护页(需登录) */}
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                {/* 工作台 */}
                <Route path="/" element={<WorkspacePage />} />
                {/* 设置 / 我的 */}
                <Route path="/me" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
