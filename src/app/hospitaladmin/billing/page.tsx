"use client";
import BillingModule from "@/components/BillingModule";

export default function BillingPage() {
  return (
    <div data-ui="hospitaladmin.billing" style={{ padding: "32px 24px" }}>
      <BillingModule uiPrefix="hospitaladmin" />
    </div>
  );
}
