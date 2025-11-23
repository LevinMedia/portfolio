import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { listThemes } from '@/lib/themes/registry';
import { getActiveThemeId, setActiveTheme, syncThemesTable } from '@/lib/themes/theme-store';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    await syncThemesTable(supabase);
    const activeThemeId = await getActiveThemeId(supabase);

    return NextResponse.json({
      themes: listThemes(),
      activeThemeId
    });
  } catch (error) {
    console.error('Error in GET /api/admin/themes:', error);
    return NextResponse.json({ error: 'Unable to load themes' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const themeId: string | undefined = body?.themeId;

    if (!themeId) {
      return NextResponse.json({ error: 'themeId is required' }, { status: 400 });
    }

    await setActiveTheme(supabase, themeId);
    const activeThemeId = await getActiveThemeId(supabase);

    return NextResponse.json({ activeThemeId });
  } catch (error) {
    console.error('Error in PUT /api/admin/themes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update theme' },
      { status: 500 }
    );
  }
}

