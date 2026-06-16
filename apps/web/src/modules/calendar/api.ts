import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import type { EventItem } from '@family-hub/shared';
import type { CreateEventInput, UpdateEventInput } from '@family-hub/shared';

export function useCalendar(month: string) {
  return useQuery({
    queryKey: ['calendar', month],
    queryFn: () => api.get<EventItem[]>(`/api/event/calendar?month=${month}`),
    enabled: !!month,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get<EventItem>(`/api/event/${id}`),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => api.post<EventItem>('/api/event', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEventInput & { id: string }) =>
      api.put<EventItem>(`/api/event/${id}`, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); qc.invalidateQueries({ queryKey: ['event'] }); },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/event/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}
