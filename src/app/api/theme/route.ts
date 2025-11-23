import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { defaultThemeId, getThemeDefinition } from '@/lib/themes/registry';
import { getActiveThemeId, syncThemesTable } from '@/lib/themes/theme-store';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    await syncThemesTable(supabase);
    const activeThemeId = await getActiveThemeId(supabase);
    const definition = getThemeDefinition(activeThemeId) ?? getThemeDefinition(defaultThemeId);

    return NextResponse.json({
      activeThemeId,
      theme: definition
    });
  } catch (error) {
    console.error('Error in GET /api/theme:', error);
    return NextResponse.json({ error: 'Unable to resolve active theme' }, { status: 500 });
  }
}

