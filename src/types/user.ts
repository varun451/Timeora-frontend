export type UserRole = "customer" | "seller" | "super_admin" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: "active" | "blocked";
}

