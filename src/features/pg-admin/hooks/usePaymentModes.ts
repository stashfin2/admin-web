import { useQuery } from '@tanstack/react-query'
import { listPaymentModes, getPaymentMode } from '../api/pgAdminEndpoints'

export const PMK = {
  list: (p: any) => ['pg-admin', 'payment-modes', 'list', p] as const,
  byId: (id: number | string) => ['pg-admin', 'payment-modes', 'id', String(id)] as const,
}

export function usePaymentModesList(params: {
  category?: string
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: PMK.list(params),
    queryFn: async () => {
      // Convert "all" to undefined for API calls
      const apiParams = {
        ...params,
        category: params.category === 'all' ? undefined : params.category
      }
      const response = (await listPaymentModes(apiParams)).data
      // Map API response structure to expected UI structure
      return {
        content: response.items || [],
        meta: response.page || { number: 1, size: 20, total_elements: 0, total_pages: 0 }
      }
    }
  })
}

export function usePaymentMode(id: number | string) {
  return useQuery({
    queryKey: PMK.byId(id),
    queryFn: async () => (await getPaymentMode(id)).data,
    enabled: !!id
  })
}
