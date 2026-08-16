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

export interface TenantProfile {
  id: string;
  tenant_id: string;
  description?: string | null;
  phone_whatsapp?: string | null;
  address?: string | null;
  logo_url?: string | null;
  template_id: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "canceled";

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  customer_id?: string | null;
  service_id?: string | null;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  start_time: string;
  end_time: string;
  total_duration: number;
  price: number;
  status: AppointmentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableSlot {
  time: string; // "09:00"
  available: boolean;
  reason?: string;
}

export interface PortfolioItem {
  id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  before_image_url: string;
  after_image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
