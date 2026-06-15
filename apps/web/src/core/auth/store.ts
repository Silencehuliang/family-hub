/**
 * 认证状态(Zustand)
 */
import { create } from 'zustand';
import type { SessionInfo, Member, Family } from '@family-hub/shared';
import { api, setToken, clearToken, getToken } from '../api/client';
import { getFingerprint, getDeviceName } from './fingerprint';

interface AuthState {
  token: string | null;
  member: Member | null;
  family: Family | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** 初始化:检查本地 token 并拉取 /auth/me */
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
  token: getToken(),
  member: null,
  family: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    const token = getToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const info = await api.get<SessionInfo>('/auth/me');
      set({
        token,
        member: info.member,
        family: info.family,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // token 失效
      clearToken();
      set({ token: null, isAuthenticated: false, isLoading: false });
    }
  },

  createFamily: async (input) => {
    const result = await api.post<{ token: string; memberId: string }>('/auth/create-family', input);
    setToken(result.token);
    // 拉取完整信息
    const info = await api.get<SessionInfo>('/auth/me');
    set({
      token: result.token,
      member: info.member,
      family: info.family,
      isAuthenticated: true,
    });
  },

  redeemInvite: async (input) => {
    const fingerprint = await getFingerprint();
    const deviceName = getDeviceName();
    const result = await api.post<{ token: string; memberId: string }>('/auth/invite/redeem', {
      ...input,
      fingerprint,
      deviceName,
    });
    setToken(result.token);
    const info = await api.get<SessionInfo>('/auth/me');
    set({
      token: result.token,
      member: info.member,
      family: info.family,
      isAuthenticated: true,
    });
  },

  login: async (pin: string) => {
    const fingerprint = await getFingerprint();
    const deviceName = getDeviceName();
    const result = await api.post<{ token: string; memberId: string }>('/auth/login', {
      fingerprint,
      pin,
      deviceName,
    });
    setToken(result.token);
    const info = await api.get<SessionInfo>('/auth/me');
    set({
      token: result.token,
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
    clearToken();
    set({ token: null, member: null, family: null, isAuthenticated: false });
  },
}));
