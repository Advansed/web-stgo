// types/User.ts
export interface User {
  id:               number;
  name:             string;
  role:             number;
  phone?:           string;
  permissions:      string[];
}

export interface LoginCredentials {
  username:         string;
  password:         string;
}

export interface AuthResponse {
  user:             User;
  token:            string;
  expiresIn:        number;
}

export interface AuthState {
  user:             User | null;
  token:            string | null;
  isAuthenticated:  boolean;
  isLoading:        boolean;
  error:            string | null;
}