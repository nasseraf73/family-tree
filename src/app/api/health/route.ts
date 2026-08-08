import { NextResponse } from 'next/server';

// Ultra-lightweight health check endpoint - responds instantly
// Used by external cron services (e.g., cron-job.org) to keep Vercel warm
export async function GET() {
  return NextResponse.json(
    { status: 'ok', ts: Date.now() },
    { status: 200 }
  );
}

// Force edge runtime for instant cold-start (no Node.js boot delay)
export const runtime = 'edge';
