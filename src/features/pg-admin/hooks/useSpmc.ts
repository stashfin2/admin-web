import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  listSpmc, 
  upsertSpmc, 
  patchSpmc, 
  deleteSpmc 
} from '../api/pgAdminEndpoints'

export const SPK = {
  list: (p: any) => ['pg-admin', 'spmc', 'list', p] as const,
}

export function useSpmcList(params: {
  subscriber_id: string
  txn_flow?: 'PAYIN' | 'PAYOUT'
}) {
  return useQuery({
    queryKey: SPK.list(params),
    queryFn: async () => (await listSpmc(params)).data,
    enabled: !!params.subscriber_id
  })
}

export function useSpmcMutations() {
  const qc = useQueryClient()
  
  const upsert = useMutation({
    mutationFn: upsertSpmc,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ 
        queryKey: SPK.list({ 
          subscriber_id: vars.subscriber_id, 
          txn_flow: vars.txn_flow 
        }) 
      })
    }
  })
  
  const patch = useMutation({
    mutationFn: patchSpmc,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ 
        queryKey: SPK.list({ 
          subscriber_id: vars.subscriber_id, 
          txn_flow: vars.txn_flow 
        }) 
      })
    }
  })
  
  const remove = useMutation({
    mutationFn: deleteSpmc,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ 
        queryKey: SPK.list({ 
          subscriber_id: vars.subscriber_id, 
          txn_flow: vars.txn_flow 
        }) 
      })
    }
  })
  
  return { upsert, patch, remove }
}
