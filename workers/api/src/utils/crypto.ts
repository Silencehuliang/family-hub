/**
 * 加密与随机工具
 */
import bcrypt from 'bcryptjs';

/** SHA-256 哈希,返回十六进制字符串 */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** bcrypt 哈希 PIN */
export function hashPin(pin: string): string {
  return bcrypt.hashSync(pin, 10);
}

/** 校验 PIN */
export function verifyPin(pin: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(pin, hash);
  } catch {
    return false;
  }
}

/** 生成随机 token(URL-safe) */
export function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 生成 nanoid 风格的短 ID */
export function nanoid(size = 21): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => alphabet[b % alphabet.length]).join('');
}
