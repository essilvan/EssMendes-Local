"use server";

import { createClient } from "@/lib/supabase/server";

export type EventType =
  | "page_view"
  | "click_whatsapp"
  | "click_phone"
  | "click_directions"
  | "click_booking";

export async function recordAnalyticsEvent(
  tenantId: string,
  eventName: EventType,
  deviceType: "mobile" | "desktop" | "tablet" = "desktop"
) {
  if (!tenantId || !eventName) return;

  try {
    const supabase = await createClient();
    await supabase.from("analytics_events").insert({
      tenant_id: tenantId,
      event_name: eventName,
      device_type: deviceType,
    });
  } catch (error) {
    // Analytics não bloqueia a experiência do usuário
    console.error("Falha silenciosa ao registrar evento de analytics:", error);
  }
}
