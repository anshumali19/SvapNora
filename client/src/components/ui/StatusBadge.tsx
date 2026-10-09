import {
  CAPABILITY_CLASSES,
  CAPABILITY_LABELS,
  type CapabilityStatus,
} from "../../lib/status";

export function StatusBadge({ status }: { status: CapabilityStatus }) {
  return <span className={CAPABILITY_CLASSES[status]}>{CAPABILITY_LABELS[status]}</span>;
}
