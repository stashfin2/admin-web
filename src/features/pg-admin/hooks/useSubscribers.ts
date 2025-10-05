import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  listSubscribers, 
  createSubscriber, 
  getSubscriber, 
  updateSubscriber, 
  rotateClientSecret 
} from '../api/pgAdminEndpoints'

export const SK = {
  list: (p: any) => ['pg-admin', 'subscribers', 'list', p] as const,
  byId: (id: string) => ['pg-admin', 'subscribers', 'id', id] as const,
}

export function useSubscribersList(params: {
  status?: string
  query?: string
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: SK.list(params),
    queryFn: async () => (await listSubscribers(params)).data
  })
}

export function useSubscriber(id: string) {
  return useQuery({
    queryKey: SK.byId(id),
    queryFn: async () => (await getSubscriber(id)).data,
    enabled: !!id
  })
}

export function useSubscriberMutations() {
  const qc = useQueryClient()
  
  const create = useMutation({
    mutationFn: createSubscriber,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pg-admin', 'subscribers'] })
  })
  
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      updateSubscriber(id, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: SK.byId(vars.id) })
      qc.invalidateQueries({ queryKey: ['pg-admin', 'subscribers'] })
    }
  })
  
  const rotateSecret = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      rotateClientSecret(id, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: SK.byId(vars.id) })
      qc.invalidateQueries({ queryKey: ['pg-admin', 'subscribers'] })
    }
  })
  
  return { create, update, rotateSecret }
}
