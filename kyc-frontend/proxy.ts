import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Backend URLs - loaded from environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const KYC_AGENT_URL = process.env.KYC_AGENT_URL;

// Named export 'proxy' for Next.js 16+
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle API requests to Java Backend
  if (pathname.startsWith('/api/')) {
    const url = new URL(pathname, BACKEND_URL);
    url.search = request.nextUrl.search;
    
    return NextResponse.rewrite(url, {
      headers: {
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!,
        }),
        // Add CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Handle KYC Agent Service requests
  if (pathname.startsWith('/agent/')) {
    const agentPath = pathname.replace('/agent', '');
    const url = new URL(agentPath || '/', KYC_AGENT_URL);
    url.search = request.nextUrl.search;
    
    return NextResponse.rewrite(url, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return NextResponse.next();
}

// Configure which paths the proxy runs on
export const config = {
  matcher: [
    // Match API routes
    '/api/:path*',
    // Match Agent routes
    '/agent/:path*',
  ],
};
