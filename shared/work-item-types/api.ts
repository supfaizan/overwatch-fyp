import { api } from '@/shared/api/client';
import type { TypeFields, WorkItemType } from './types';

export const getTypes = () => api.get<WorkItemType[]>('/work-item-types');
export const createType = (body: TypeFields) => api.post<WorkItemType>('/work-item-types', body);
export const updateType = ({ id, ...body }: Partial<TypeFields> & { id: string }) => api.patch<WorkItemType>(`/work-item-types/${id}`, body);
/** A type in use needs `reassignTo`, the type its items take instead. */
export const deleteType = ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
  api.delete<null>(`/work-item-types/${id}`, { params: reassignTo ? { reassign_to: reassignTo } : undefined });
