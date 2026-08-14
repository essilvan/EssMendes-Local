"use client";

import { useEffect } from "react";
import { recordAnalyticsEvent } from "@/actions/analytics";

interface PublicPageTrackerProps {
  tenantId: string;
}

export function PublicPageTracker({ tenantId }: PublicPageTrackerProps) {
  useEffect(() => {
    if (!tenantId) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    recordAnalyticsEvent(tenantId, "page_view", isMobile ? "mobile" : "desktop");
  }, [tenantId]);

  return null;
}
