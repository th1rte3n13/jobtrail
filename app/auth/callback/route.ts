import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The email-confirmation link lands here with a one-time code, which we swap for a session cookie.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Always a fixed internal path, so the link can't be abused as an open redirect.
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}
