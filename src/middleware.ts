import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map for local production environment
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests
const WINDOW_DURATION_MS = 60 * 1000; // per 1 minute (60,000 ms)

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Only apply rate limiting to API endpoints (/api/v1/*)
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    const now = Date.now();
    const clientData = rateLimitMap.get(ip);

    if (!clientData || now > clientData.resetTime) {
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + WINDOW_DURATION_MS,
      });
    } else {
      clientData.count += 1;

      if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json(
          {
            error: 'تم تجاوز الحد الأقصى المسموح به من الطلبات. يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً (Rate Limit Exceeded).',
          },
          {
            status: 429,
            headers: {
              'Retry-After': '60',
            },
          }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/v1/:path*',
};
