import { Card, Button, Empty, SpinLoading, PullToRefresh, Toast } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useShopLists, useDeleteShopList } from './api';
import { BRAND_COLOR } from '@family-hub/shared';

export function ShopListPageMobile() {
  const navigate = useNavigate();
  const { data: lists, isLoading } = useShopLists();
  const deleteList = useDeleteShopList();

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>;

  const handleDelete = async (id: string) => {
    try {
      await deleteList.mutateAsync(id);
      Toast.show('已删除');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <PullToRefresh onRefresh={async () => {}}>
      <div style={{ padding: 16, minHeight: '100vh', background: '#FFF8F0' }}>
        {(!lists || lists.length === 0) ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Empty />
            <Button color="primary" style={{ marginTop: 16 }} onClick={() => navigate('/shop/new')}>新建清单</Button>
          </div>
        ) : (
          lists.map((list) => {
            const percent = list.itemCount > 0 ? Math.round((list.boughtCount / list.itemCount) * 100) : 0;
            return (
              <Card
                key={list.id}
                onClick={() => navigate(`/shop/${list.id}`)}
                style={{ marginBottom: 12, borderRadius: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{list.name}</span>
                    <br />
                    <span style={{ fontSize: 12, color: percent === 100 ? '#52C41A' : '#999' }}>
                      {percent === 100 ? '已完成' : '采购中'} · {list.boughtCount}/{list.itemCount}
                    </span>
                  </div>
                  <Button color="danger" fill="none" size="small" onClick={(e) => { e.stopPropagation(); handleDelete(list.id); }}>
                    删除
                  </Button>
                </div>
                <div style={{ marginTop: 8, height: 4, background: '#F0F0F0', borderRadius: 2 }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#52C41A' : BRAND_COLOR, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </Card>
            );
          })
        )}

        <Button
          color="primary"
          style={{ position: 'fixed', right: 16, bottom: 80, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 4px 12px rgba(255, 140, 66, 0.4)' }}
          onClick={() => navigate('/shop/new')}
        >
          <AddOutline style={{ fontSize: 24 }} />
        </Button>
      </div>
    </PullToRefresh>
  );
}
