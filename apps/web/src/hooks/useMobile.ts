import { useMediaQuery } from '@/core/hooks/useMediaQuery';
import { BREAKPOINT_MOBILE } from '@family-hub/shared';

export function useMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINT_MOBILE - 1}px)`);
}
