import { useNavigate } from 'react-router-dom';
import { NavBar, Form, Input, Button, Toast } from 'antd-mobile';
import { useCreateShopList } from './api';
import { BRAND_COLOR } from '@family-hub/shared';

export function ShopEditPageMobile() {
  const navigate = useNavigate();
  const createList = useCreateShopList();
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (!values.name?.trim()) { Toast.show('请输入清单名称'); return; }
    try {
      const list = await createList.mutateAsync({ name: values.name.trim() });
      Toast.show('已创建');
      navigate(`/shop/${list.id}`);
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '创建失败');
    }
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }} onBack={() => navigate(-1)}>
        新建购物清单
      </NavBar>
      <div style={{ padding: 16 }}>
        <Form
          form={form}
          onFinish={handleSubmit}
          footer={
            <Button block color="primary" type="submit" loading={createList.isPending}>
              创建
            </Button>
          }
        >
          <Form.Item name="name" label="清单名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：超市采购" />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
