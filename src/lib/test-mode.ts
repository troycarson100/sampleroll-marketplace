export const TEST_MODE_COOKIE = "sr_test_mode";

export function isTestModeAllowed() {
  return (
    process.env.ENABLE_TEST_MODE_CHECKOUT === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

export function isTestModeCookieOn(value: string | null | undefined) {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}
