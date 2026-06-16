import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import type { ShopList, ShopItem } from '@family-hub/shared';
import type { CreateShopListInput, CreateShopItemInput, UpdateShopItemInput, BuyShopItemInput, ShopToBillInput } from '@family-hub/shared';

export function useShopLists() {
  return useQuery({
    queryKey: ['shopLists'],
    queryFn: () => api.get<(ShopList & { itemCount: number; boughtCount: number })[]>('/api/shop/list'),
  });
}

export function useCreateShopList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShopListInput) => api.post<ShopList>('/api/shop/list', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopLists'] }),
  });
}

export function useShopItems(listId: string) {
  return useQuery({
    queryKey: ['shopItems', listId],
    queryFn: () => api.get<ShopItem[]>(`/api/shop/list/${listId}/item`),
    enabled: !!listId,
  });
}

export function useAddShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, ...input }: CreateShopItemInput & { listId: string }) =>
      api.post<ShopItem>(`/api/shop/list/${listId}/item`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopItems'] }),
  });
}

export function useUpdateShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, itemId, ...input }: UpdateShopItemInput & { listId: string; itemId: string }) =>
      api.put<ShopItem>(`/api/shop/list/${listId}/item/${itemId}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopItems'] }),
  });
}

export function useDeleteShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      api.delete(`/api/shop/list/${listId}/item/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopItems'] }),
  });
}

export function useBuyShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, itemId, ...input }: BuyShopItemInput & { listId: string; itemId: string }) =>
      api.post<ShopItem>(`/api/shop/list/${listId}/item/${itemId}/buy`, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopItems'] }); qc.invalidateQueries({ queryKey: ['shopLists'] }); },
  });
}

export function useShopListToBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, ...input }: ShopToBillInput & { listId: string }) =>
      api.post<unknown>(`/api/shop/list/${listId}/to-bill`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopLists'] }),
  });
}
