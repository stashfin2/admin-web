import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  listMerchants, 
  createMerchant, 
  getMerchant, 
  updateMerchant, 
  rotateMerchantCreds 
} from '../api/pgAdminEndpoints'

export const MK = {
  list: (p: Record<string, unknown>) => ['pg-admin', 'merchants', 'list', p] as const,
  byId: (id: number | string) => ['pg-admin', 'merchants', 'id', String(id)] as const,
}

export function useMerchantsList(params: {
  vendor_id?: number
  status?: string
  merchant_ref?: string
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: MK.list(params),
    queryFn: async () => {
      const response = (await listMerchants(params)).data
      // Map API response structure to expected UI structure
      return {
        content: response.items || [],
        meta: response.page || { number: 1, size: 20, total_elements: 0, total_pages: 0 }
      }
    }
  })
}

export function useMerchant(id: number | string) {
  return useQuery({
    queryKey: MK.byId(id),
    queryFn: async () => (await getMerchant(id)).data,
    enabled: !!id
  })
}

export function useMerchantMutations() {
  const qc = useQueryClient()
  
  const create = useMutation({
    mutationFn: createMerchant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pg-admin', 'merchants'] })
  })
  
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Record<string, unknown> }) =>
      updateMerchant(id, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: MK.byId(vars.id) })
      qc.invalidateQueries({ queryKey: ['pg-admin', 'merchants'] })
    }
  })
  
  const rotateCreds = useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: { creds_json: string; activation_ts?: string } }) =>
      rotateMerchantCreds(id, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: MK.byId(vars.id) })
      qc.invalidateQueries({ queryKey: ['pg-admin', 'merchants'] })
    }
  })
  
  return { create, update, rotateCreds }
}
