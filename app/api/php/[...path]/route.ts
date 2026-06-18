// app/api/php/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const PHP_BASE = "https://ccgnimex.my.id/v2/android/dokasah";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const search = new URL(req.url).search;
  const phpUrl = `${PHP_BASE}/${path.join("/")}${search}`;

  // Forward relevant headers
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  // Authorization header (critical for PHP middleware)
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth) {
    headers["Authorization"] = auth;
    headers["HTTP_AUTHORIZATION"] = auth; // Some PHP setups need this
  }

  // Read body for non-GET methods
  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  console.log(`[PHP Proxy] ${req.method} ${phpUrl}`);

  try {
    const phpRes = await fetch(phpUrl, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });

    const text = await phpRes.text();
    console.log(`[PHP Proxy] Response ${phpRes.status}: ${text.substring(0, 200)}`);

    // Handle empty body
    if (!text || !text.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: `PHP mengembalikan response kosong (HTTP ${phpRes.status}). Kemungkinan: PHP fatal error, tabel belum dibuat, atau file di server versi lama.`,
          phpUrl,
          hint: "Jalankan: https://ccgnimex.my.id/v2/android/dokasah/setup.php?key=DokasahSetup2024",
        },
        { status: 502 }
      );
    }

    // Handle non-JSON response (PHP error page HTML)
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return NextResponse.json(
        {
          success: false,
          message: "PHP mengembalikan non-JSON: " + trimmed.substring(0, 300),
          phpUrl,
        },
        { status: 502 }
      );
    }

    return new NextResponse(text, {
      status: phpRes.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[PHP Proxy] Error: ${msg}`);
    return NextResponse.json(
      {
        success: false,
        message: `Proxy error: ${msg}`,
        phpUrl,
      },
      { status: 502 }
    );
  }
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const DELETE  = handler;
export const OPTIONS = handler;
