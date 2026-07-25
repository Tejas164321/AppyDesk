import { NextRequest, NextResponse } from "next/server";

export function corsHeaders(req?: NextRequest) {
  const origin = req?.headers.get("origin") || "*";
  const isExtension = origin.startsWith("chrome-extension://");
  
  return {
    "Access-Control-Allow-Origin": isExtension ? origin : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function handleCorsOptions(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(req),
  });
}

export function withCors(res: NextResponse, req?: NextRequest): NextResponse {
  const headers = corsHeaders(req);
  Object.entries(headers).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}
