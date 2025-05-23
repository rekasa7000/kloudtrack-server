export interface AuthUser {
  id: number;
  userName: string;
  email: string;
  role: string;
}

export interface RegisterData {
  userName: string;
  email: string;
  password: string;
  role?: string;
}
