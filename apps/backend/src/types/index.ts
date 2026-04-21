export interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  gender: 'male' | 'female' | 'other' | null;
  birthday: string | null;
  location: string | null;
  website: string | null;
  password_hash: string | null;
  wechat_openid: string | null;
  wechat_unionid: string | null;
  email_verified: boolean;
  status: 'active' | 'banned' | 'inactive';
  locked_until: Date | null;
  login_attempts: number;
  points: number;
  total_recharge: number;
  total_earnings: number;
  referral_code: string | null;
  referred_by: string | null;
  created_at: Date;
  last_login: Date | null;
}

export interface RechargeOrder {
  id: string;
  order_no: string;
  user_id: number;
  amount: number;
  points: number;
  bonus_points: number;
  product_name: string;
  status: 'pending' | 'paid' | 'expired' | 'refunded';
  pay_method: 'wechat' | 'alipay';
  pay_time: Date | null;
  provider_transaction_id: string | null;
  provider_buyer_id: string | null;
  provider_status: string | null;
  payment_scene: string | null;
  paid_amount: number | null;
  currency: string | null;
  notify_time: Date | null;
  notify_payload: string | null;
  response_payload: string | null;
  expire_time: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PointsLog {
  id: number;
  user_id: number;
  type: 'recharge' | 'consume' | 'refund' | 'reward';
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id: string | null;
  description: string;
  election_id: string | null;
  created_at: Date;
}

export interface Novel {
  id: number;
  author_id: number;
  title: string;
  cover_url: string | null;
  description: string | null;
  genre: string | null;
  tags: string | null;
  status: 'ongoing' | 'completed' | 'paused';
  word_count: number;
  view_count: number;
  like_count: number;
  chapter_count: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Chapter {
  id: number;
  novel_id: number;
  chapter_number: number;
  title: string;
  content: string | null;
  word_count: number;
  status: 'draft' | 'published';
  created_at: Date;
  updated_at: Date;
}

export interface GenerationLog {
  id: number;
  user_id: number;
  type: 'image' | 'text' | 'audio' | 'video';
  input_tokens: number;
  output_tokens: number;
  points_cost: number;
  model: string;
  prompt: string;
  result_url: string | null;
  status: 'success' | 'failed';
  election_id: string | null;
  created_at: Date;
}

export interface ElectionLog {
  id: string;
  term: number;
  type: 'write' | 'read';
  key: string;
  value: string;
  client_id: string;
  status: 'pending' | 'committed' | 'applied';
  created_at: Date;
  committed_at: Date | null;
}

export interface ElectionNode {
  id: number;
  node_id: string;
  host: string;
  port: number;
  role: 'leader' | 'follower' | 'candidate';
  last_active_at: Date;
  vote_count: number;
  created_at: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
