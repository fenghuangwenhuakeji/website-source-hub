export interface User {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  nickname: string;
  avatar?: string;
  role: 'user' | 'admin';
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  location?: string;
  website?: string;
  points: number;
  totalRecharge: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RechargeProduct {
  id: number;
  name: string;
  amount: number;
  points: number;
  bonusPoints: number;
  description: string;
  isPopular?: boolean;
}

export interface RechargeOrder {
  orderId: string;
  orderNo: string;
  amount: number;
  points: number;
  bonusPoints: number;
  productName: string;
  status: 'pending' | 'paid' | 'expired' | 'refunded';
  payMethod: 'wechat' | 'alipay';
  paidAt?: string;
  createdAt: string;
  expireTime?: string;
  qrCodeUrl?: string;
}

export interface PointsLog {
  id: number;
  type: 'recharge' | 'consume' | 'refund' | 'reward';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface Novel {
  id: number;
  title: string;
  coverUrl?: string;
  description?: string;
  genre?: string;
  tags?: string[];
  status: 'ongoing' | 'completed' | 'paused';
  wordCount: number;
  viewCount: number;
  likeCount: number;
  chapterCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: number;
  novelId: number;
  chapterNumber: number;
  title: string;
  content?: string;
  wordCount: number;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface ElectionStatus {
  term: number;
  leaderId: string | null;
  state: 'leader' | 'follower' | 'candidate';
  commitIndex: number;
}

export interface ElectionSubmitResponse {
  electionId: string;
  term: number;
  status: 'pending' | 'committed' | 'applied';
}
