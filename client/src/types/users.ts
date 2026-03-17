export interface User {
  username: string;
  password_hash: string;
  role: string;
}

export interface CreateUserRequest {
  username: string;
  password_hash: string;
  role: string;
}
