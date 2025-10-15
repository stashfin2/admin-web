import { pgAdmin } from './pgAdminClient'

// Vendors
export const listVendors = (p:{status?:string; code?:string; page?:number; size?:number; sort?:string}) =>
  pgAdmin.get('/vendors', { params: p })
export const createVendor = (b:{code:string; name:string; status:string; capabilities?:string}) =>
  pgAdmin.post('/vendors', b)
export const getVendor = (id:number|string) => pgAdmin.get(`/vendors/${id}`)
export const updateVendor = (id:number|string, b:Partial<{name:string; status:string; capabilities:string}>) =>
  pgAdmin.put(`/vendors/${id}`, b)

// Merchants
export const listMerchants = (p:{vendor_id?:number; status?:string; merchant_ref?:string; page?:number; size?:number}) =>
  pgAdmin.get('/merchants', { params: p })
export const createMerchant = (b:{vendor_id:number; merchant_ref:string; display_name:string; creds_json:string; status:string}) =>
  pgAdmin.post('/merchants', b)
export const getMerchant = (id:number|string) => pgAdmin.get(`/merchants/${id}`)
export const updateMerchant = (id:number|string, b:Partial<{display_name:string; status:string}>) =>
  pgAdmin.put(`/merchants/${id}`, b)
export const rotateMerchantCreds = (id:number|string, b:{creds_json:string; activation_ts?:string}) =>
  pgAdmin.post(`/merchants/${id}/credentials:rotate`, b)

// Payment Modes
export const listPaymentModes = (p:{category?:string; page?:number; size?:number}) =>
  pgAdmin.get('/payment-modes', { params: p })
export const getPaymentMode = (id:number|string) => pgAdmin.get(`/payment-modes/${id}`)

// Subscribers
export const listSubscribers = (p:{status?:string; query?:string; page?:number; size?:number}) =>
  pgAdmin.get('/subscribers', { params: p })
export const createSubscriber = (b:{id:string; name:string; client_id:string; webhook_url?:string; allow_domains?:string[]; status:string}) =>
  pgAdmin.post('/subscribers', b)
export const getSubscriber = (id:string) => pgAdmin.get(`/subscribers/${id}`)
export const updateSubscriber = (id:string, b:Partial<{name:string; webhook_url?:string; allow_domains?:string[]; status:string}>) =>
  pgAdmin.put(`/subscribers/${id}`, b)
export const rotateClientSecret = (id:string, b:{note?:string}) =>
  pgAdmin.post(`/subscribers/${id}/client-secret:rotate`, b)

// SPMC
export const listSpmc = (p:{subscriber_id:string; txn_flow?:'PAYIN'|'PAYOUT'}) =>
  pgAdmin.get('/spmc', { params: p })
export const upsertSpmc = (b:{subscriber_id:string; mode_id:number; txn_flow:'PAYIN'|'PAYOUT'; enabled:boolean; ui_order:number; constraints_json?:string}) =>
  pgAdmin.post('/spmc', b)
export const patchSpmc = (b:{subscriber_id:string; mode_id:number; txn_flow:'PAYIN'|'PAYOUT'; enabled?:boolean; ui_order?:number; constraints_json?:string}) =>
  pgAdmin.patch('/spmc', b)
export const deleteSpmc = (p:{subscriber_id:string; mode_id:number; txn_flow:'PAYIN'|'PAYOUT'; force?:boolean}) =>
  pgAdmin.delete('/spmc', { params: p })

// Routes
export const listRoutes = (p:{subscriber_id:string; txn_flow?:'PAYIN'|'PAYOUT'; mode_code?:string}) =>
  pgAdmin.get('/routes', { params: p })
export const createRoute = (b:{subscriber_id:string; txn_flow:'PAYIN'|'PAYOUT'; mode_id:number; merchant_id:number; priority:number; weight:number; enabled:boolean; circuit_cfg_json?:string}) =>
  pgAdmin.post('/routes', b)
export const updateRoute = (id:number, b:Partial<{priority:number; weight:number; enabled:boolean; circuit_cfg_json:string}>) =>
  pgAdmin.put(`/routes/${id}`, b)
