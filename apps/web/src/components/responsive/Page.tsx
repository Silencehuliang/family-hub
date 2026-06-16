import type { ReactNode } from 'react';
import { useMobile } from '@/hooks/useMobile';

interface PageProps { children: ReactNode; style?: React.CSSProperties }

export function Page({ children, style }: PageProps) {
  const isMobile = useMobile();
  return (
    <div
      style={{
        padding: isMobile ? '0 16px 24px' : '0 24px',
        maxWidth: isMobile ? '100%' : 800,
        margin: '0 auto',
        minHeight: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
