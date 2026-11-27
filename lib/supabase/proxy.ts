import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/login", "/signup"];

// Refreshes the Supabase session cookie on every request and guards protected routes.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Stops CDNs from caching a response that carries one user's session cookie.
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Must run before anything else: verifies the token and refreshes it if needed.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (!isLoggedIn && isProtected) {
    return redirectKeepingCookies(request, response, "/login");
  }

  if (isLoggedIn && AUTH_PAGES.includes(path)) {
    return redirectKeepingCookies(request, response, "/dashboard");
  }

  return response;
}

// A redirect must carry over any refreshed cookies, or the user is logged out unexpectedly.
function redirectKeepingCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const target = request.nextUrl.clone();
  target.pathname = pathname;
  target.search = "";

  const redirect = NextResponse.redirect(target);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") redirect.headers.set(key, value);
  });
  return redirect;
}
