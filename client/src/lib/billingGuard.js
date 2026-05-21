import { isNativeMobile } from "./platform";

export function canAccessNativeBilling() {
  if (
    import.meta.env.VITE_DISABLE_NATIVE_BILLING === "true" &&
    isNativeMobile
  ) {
    return false;
  }

  return true;
}
