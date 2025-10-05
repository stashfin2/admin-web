export type Flow = 'PAYIN'|'PAYOUT'
export interface PageMeta { number:number; size:number; total_elements:number; total_pages:number }
export interface ApiErr { code:number; message:string; details?:string }

export interface Vendor { 
  id:number; 
  code:string; 
  name:string; 
  status:'ACTIVE'|'INACTIVE'|'DEPRECATED'; 
  capabilities?:string; 
  created_at:string; 
  updated_at:string 
}

export interface Merchant { 
  id:number; 
  vendor_id:number; 
  merchant_ref:string; 
  display_name:string; 
  status:'ACTIVE'|'INACTIVE'; 
  created_at:string; 
  updated_at:string 
}

export interface PaymentMode { 
  id:number; 
  code:string; 
  label:string; 
  category:string; 
  attrs?:any 
}

export interface Subscriber { 
  id:string; 
  name:string; 
  client_id:string; 
  webhook_url?:string; 
  allow_domains?:string[]; 
  status:'ACTIVE'|'INACTIVE'; 
  created_at:string; 
  updated_at:string 
}

export interface SpmcItem { 
  subscriber_id:string; 
  txn_flow:Flow; 
  mode_id:number; 
  mode_code?:string; 
  enabled:boolean; 
  ui_order:number; 
  constraints?:string; 
  created_at:string; 
  updated_at:string 
}

export interface RouteItem { 
  id:number; 
  subscriber_id:string; 
  txn_flow:Flow; 
  mode_id:number; 
  mode_code?:string; 
  merchant_id:number; 
  merchant_name?:string; 
  vendor_code?:string; 
  priority:number; 
  weight:number; 
  enabled:boolean; 
  circuit_cfg_json?:string; 
  created_at:string; 
  updated_at:string 
}

export const tryParse = (s?:string|null) => { 
  if (!s) return null; 
  try { 
    return JSON.parse(s) 
  } catch { 
    return { __raw:s, __parseError:true } 
  } 
}

export const tryStringify = (o:any) => { 
  if (o==null) return undefined; 
  if (typeof o==='string') return o; 
  try { 
    return JSON.stringify(o) 
  } catch { 
    return String(o) 
  } 
}
