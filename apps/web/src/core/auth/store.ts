/**
 * 认证状态(Zustand)
 * Cookie 鉴权，不再管理 token
 */
import { create } from 'zustand';
import type { SessionInfo, Member, Family } from '@family-hub/shared';
import { api } from '../api/client';
import { getFingerprint, getDeviceName } from './fingerprint';

interface AuthState {
  member: Member | null;
  family: Family | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** 初始化:尝试拉取 /auth/me */
  init: () => Promise<void>;
  /** 创建家庭 */
  createFamily: (input: { familyName: string; nickname: string; pin: string }) => Promise<void>;
  /** 兑换邀请码 */
  redeemInvite: (input: { code: string; nickname: string; pin: string }) => Promise<void>;
  /** PIN 登录 */
  login: (pin: string) => Promise<void>;
  /** 登出 */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  member: null,
  family: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    try {
      const info = await api.get<SessionInfo>('/auth/me');
      set({
        member: info.member,
        family: info.family,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // 未登录或会话失效
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  createFamily: async (input) => {
    const fingerprint = await getFingerprint();
    const deviceName = getDeviceName();
    await api.post<{ memberId: string }>('/auth/create-family', {
      ...input,
      fingerprint,
      deviceName,
    });
    // cookie 已自动下发，拉取完整信息
    const info = await api.get<SessionInfo>('/auth/me');
    set({
      member: info.member,
      family: info.family,
      isAuthenticated: true,
    });
  },

  redeemInvite: async (input) => {
    const fingerprint = await getFingerprint();
    const deviceName = getDeviceName();
    await api.post<{ memberId: string }>('/auth/invite/redeem', {
      ...input,
      fingerprint,
      deviceName,
    });
    // cookie 已自动下发
    const info = await api.get<SessionInfo>('/auth/me');
    set({
      member: info.member,
      family: info.family,
      isAuthenticated: true,
    });
  },

  login: async (pin: string) => {
    const fingerprint = await getFingerprint();
    const deviceName = getDeviceName();
    await api.post<{ memberId: string }>('/auth/login', {
      fingerprint,
      pin,
      deviceName,
    });
    // cookie 已自动下发
    const info = await api.get<SessionInfo>('/auth/me');
    set({
      member: info.member,
      family: info.family,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // 忽略错误,本地清理
    }
    set({ member: null, family: null, isAuthenticated: false });
  },
}));
