import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  listRoutes, 
  createRoute, 
  updateRoute 
} from '../api/pgAdminEndpoints'

export const RK = {
  list: (p: any) => ['pg-admin', 'routes', 'list', p] as const,
  byId: (id: number) => ['pg-admin', 'routes', 'id', String(id)] as const,
}

export function useRoutesList(params: {
  subscriber_id: string
  txn_flow?: 'PAYIN' | 'PAYOUT'
  mode_code?: string
}) {
  return useQuery({
    queryKey: RK.list(params),
    queryFn: async () => (await listRoutes(params)).data,
    enabled: !!params.subscriber_id
  })
}

export function useRouteMutations() {
  const qc = useQueryClient()
  
  const create = useMutation({
    mutationFn: createRoute,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ 
        queryKey: RK.list({ 
          subscriber_id: vars.subscriber_id, 
          txn_flow: vars.txn_flow,
          mode_code: undefined // Clear mode filter after create
        }) 
      })
    }
  })
  
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      updateRoute(id, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: RK.byId(vars.id) })
      qc.invalidateQueries({ queryKey: ['pg-admin', 'routes'] })
    }
  })
  
  return { create, update }
}
