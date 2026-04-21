export type PaymentProvider = 'wechat' | 'alipay';
export type OrderTableName = 'recharge_orders' | 'orders';

export interface PaymentOrder {
  tableName: OrderTableName;
  id: string;
  orderNo: string;
  userId: string;
  amount: number;
  points: number;
  bonusPoints: number;
  productName: string;
  status: string;
  payMethod: string;
  createdAt: Date | null;
  payTime: Date | null;
  expireTime: Date | null;
  packageId: number | null;
  duration: number;
  durationUnit: string | null;
  providerTransactionId: string | null;
  providerStatus: string | null;
}

export interface GatewayIssueResult {
  qrCode: string;
  paymentScene: string;
  responsePayload: string;
}

export interface PaymentProcessPayload {
  providerTransactionId: string;
  providerBuyerId?: string | null;
  providerStatus?: string | null;
  paymentScene?: string | null;
  paidAmount?: number | null;
  currency?: string | null;
  paidAt?: Date | null;
  notifyTime?: Date | null;
  notifyPayload?: string | null;
  responsePayload?: string | null;
}

export interface WechatNotificationResource {
  algorithm: string;
  ciphertext: string;
  associated_data?: string;
  nonce: string;
  original_type?: string;
}

export interface WechatNotificationPayload {
  id: string;
  event_type: string;
  resource_type: string;
  create_time: string;
  summary?: string;
  resource: WechatNotificationResource;
}

export interface WechatTransactionData {
  appid?: string;
  mchid?: string;
  out_trade_no: string;
  transaction_id: string;
  trade_type?: string;
  trade_state?: string;
  payer?: {
    openid?: string;
  };
  amount?: {
    total?: number;
    payer_total?: number;
    currency?: string;
  };
  success_time?: string;
}

export interface AlipayTradeQueryResult {
  code?: string;
  msg?: string;
  sub_code?: string;
  sub_msg?: string;
  trade_status?: string;
  trade_no?: string;
  buyer_user_id?: string;
  total_amount?: string;
  receipt_amount?: string;
  send_pay_date?: string;
}

export interface PaymentCallbackResponse {
  statusCode: number;
  json?: {
    code: string;
    message: string;
  };
  text?: string;
  end?: boolean;
}
