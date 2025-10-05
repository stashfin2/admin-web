import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listVendors, createVendor, getVendor, updateVendor } from '../api/pgAdminEndpoints'

export const VK = {
  list: (p: any) => ['pg-admin', 'vendors', 'list', p] as const,
  byId: (id: number | string) => ['pg-admin', 'vendors', 'id', String(id)] as const,
}

export function useVendorsList(params: {
  status?: string
  code?: string
  page?: number
  size?: number
  sort?: string
}) {
  return useQuery({
    queryKey: VK.list(params),
    queryFn: async () => (await listVendors(params)).data
  })
}

export function useVendor(id: number | string) {
  return useQuery({
    queryKey: VK.byId(id),
    queryFn: async () => (await getVendor(id)).data,
    enabled: !!id
  })
}

export function useVendorMutations() {
  const qc = useQueryClient()
  
  const create = useMutation({
    mutationFn: createVendor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pg-admin', 'vendors'] })
  })
  
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: any }) =>
      updateVendor(id, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: VK.byId(vars.id) })
      qc.invalidateQueries({ queryKey: ['pg-admin', 'vendors'] })
    }
  })
  
  return { create, update }
}
