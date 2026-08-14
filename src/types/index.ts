export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "admin" | "staff";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain?: string | null;
  plan_tier: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}
