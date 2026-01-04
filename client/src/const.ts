export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "http://localhost:4000";
  const appId = import.meta.env.VITE_APP_ID || "test-app-id";
  
  // Validate URL
  if (!oauthPortalUrl || typeof oauthPortalUrl !== "string") {
    console.error("[OAuth] Missing VITE_OAUTH_PORTAL_URL environment variable");
    return "/";
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("[OAuth] Invalid OAuth URL:", error);
    return "/";
  }
};
