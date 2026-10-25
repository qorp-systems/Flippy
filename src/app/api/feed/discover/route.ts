import { NextResponse } from 'next/server';
import { discoverFeedFromUrl } from '@/lib/news-engine/discovery';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`discover:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas. Aguarde um instante.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Digite o domínio ou nome do portal.' },
        { status: 400 }
      );
    }

    const discovered = await discoverFeedFromUrl(query);

    if (!discovered) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não encontramos o feed para este site ou termo. Tente digitar o link direto ou o domínio principal.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feed: discovered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno ao descobrir feed.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  if (!query.trim()) {
    return NextResponse.json({ success: false, error: 'Query ausente' }, { status: 400 });
  }

  const discovered = await discoverFeedFromUrl(query);
  if (!discovered) {
    return NextResponse.json({ success: false, error: 'Feed não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true, feed: discovered });
}
