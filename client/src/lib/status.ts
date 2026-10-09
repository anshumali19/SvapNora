export type CapabilityStatus = "IMPLEMENTED" | "IN_PROGRESS" | "PLANNED" | "RESEARCH";

export const CAPABILITY_LABELS: Record<CapabilityStatus, string> = {
  IMPLEMENTED: "Implemented",
  IN_PROGRESS: "In progress",
  PLANNED: "Planned",
  RESEARCH: "Research / exploration",
};

export const CAPABILITY_CLASSES: Record<CapabilityStatus, string> = {
  IMPLEMENTED: "badge-implemented",
  IN_PROGRESS: "badge-in-progress",
  PLANNED: "badge-planned",
  RESEARCH: "badge-research",
};

export type PaymentStatus =
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "CANCELLED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  SUCCESSFUL: "Successful",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  PARTIALLY_REFUNDED: "Partially refunded",
  REFUNDED: "Refunded",
};

export const PAYMENT_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "badge-planned",
  SUCCESSFUL: "badge-implemented",
  FAILED: "badge-research",
  CANCELLED: "badge-research",
  PARTIALLY_REFUNDED: "badge-in-progress",
  REFUNDED: "badge-in-progress",
};
