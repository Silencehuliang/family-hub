/**
 * 主题 Provider(AntD ConfigProvider + 浅/深色)
 */
import { ConfigProvider, theme } from 'antd';
import { useEffect, useState } from 'react';
import { BRAND_COLOR } from '@family-hub/shared';

type ThemeMode = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('fh_theme') as ThemeMode) ?? 'system';
  });

  const resolvedMode = mode === 'system' ? getSystemTheme() : mode;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedMode);
  }, [resolvedMode]);

  useEffect(() => {
    localStorage.setItem('fh_theme', mode);
  }, [mode]);

  return (
    <ConfigProvider
      theme={{
        algorithm: resolvedMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: BRAND_COLOR,
          borderRadius: 10,
          colorBgLayout: resolvedMode === 'dark' ? '#141414' : '#F7F8FA',
          fontSize: 14,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
