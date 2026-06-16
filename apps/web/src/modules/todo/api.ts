import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import type { TodoItem, TodoSubtask } from '@family-hub/shared';
import type { CreateTodoInput, UpdateTodoInput, CreateSubtaskInput } from '@family-hub/shared';

export function useTodos(filters: { status?: string; assigneeId?: string; priority?: string; dueBefore?: number }) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => api.get<TodoItem[]>('/api/todo', { query: filters }),
  });
}

export function useTodo(id: string) {
  return useQuery({
    queryKey: ['todo', id],
    queryFn: () => api.get<TodoItem>(`/api/todo/${id}`),
    enabled: !!id,
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => api.post<TodoItem>('/api/todo', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTodoInput & { id: string }) => api.put<TodoItem>(`/api/todo/${id}`, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['todos'] }); qc.invalidateQueries({ queryKey: ['todo'] }); },
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/todo/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useSetTodoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.post<TodoItem>(`/api/todo/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['todos'] }); qc.invalidateQueries({ queryKey: ['todo'] }); },
  });
}

export function useAddSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, ...input }: CreateSubtaskInput & { todoId: string }) =>
      api.post<TodoSubtask>(`/api/todo/${todoId}/subtask`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todo'] }),
  });
}

export function useUpdateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, subId, ...input }: { todoId: string; subId: string; title?: string; done?: boolean }) =>
      api.put<TodoSubtask>(`/api/todo/${todoId}/subtask/${subId}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todo'] }),
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, subId }: { todoId: string; subId: string }) =>
      api.delete(`/api/todo/${todoId}/subtask/${subId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todo'] }),
  });
}
