import { useState, useRef } from 'react';
import { Modal, Input, Avatar, Button, message } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { api } from '@/core/api/client';
import type { Member } from '@family-hub/shared';
import { BRAND_COLOR } from '@family-hub/shared';

interface Props {
  open: boolean;
  member: Member;
  onClose: () => void;
}

export function EditProfileModal({ open, member, onClose }: Props) {
  const [nickname, setNickname] = useState(member.nickname);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(member.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 200);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        setAvatarBase64(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      message.error('昵称不能为空');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (nickname !== member.nickname) body.nickname = nickname.trim();
      if (avatarBase64 !== member.avatarUrl) {
        body.avatarBase64 = avatarBase64 ?? '';
      }

      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }

      await api.patch<{ nickname: string; avatarUrl: string | null }>('/auth/me', body);
      message.success('已保存');
      onClose();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="编辑资料"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Avatar
            size={80}
            src={avatarBase64}
            icon={!avatarBase64 ? <UserOutlined /> : undefined}
            style={{ background: BRAND_COLOR, cursor: 'pointer' }}
            onClick={() => inputRef.current?.click()}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: BRAND_COLOR,
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => inputRef.current?.click()}
          >
            <CameraOutlined style={{ color: '#fff', fontSize: 14 }} />
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div style={{ marginTop: 8 }}>
          <Button type="link" size="small" onClick={() => inputRef.current?.click()}>
            更换头像
          </Button>
          {avatarBase64 && (
            <Button type="link" size="small" danger onClick={() => { setAvatarBase64(null); }}>
              清除头像
            </Button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <span>昵称</span>
        <span style={{ float: 'right', color: '#999' }}>{nickname.length}/30</span>
      </div>
      <Input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={30}
        placeholder="输入昵称"
      />
    </Modal>
  );
}
