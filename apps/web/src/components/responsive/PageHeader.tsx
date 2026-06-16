import type { ReactNode } from 'react';
import { useMobile } from '@/hooks/useMobile';
import { NavBar } from 'antd-mobile';
import { Typography } from 'antd';
import { BRAND_COLOR } from '@family-hub/shared';

const { Title } = Typography;

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function PageHeader({ title, onBack, right }: PageHeaderProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <NavBar
        style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }}
        onBack={onBack}
        right={right}
      >
        {title}
      </NavBar>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Title level={4} style={{ margin: 0 }}>{title}</Title>
      {right}
    </div>
  );
}
