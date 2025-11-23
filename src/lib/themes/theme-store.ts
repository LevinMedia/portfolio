import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultThemeId, getThemeDefinition, listThemes } from './registry';
import type { ThemeId } from './types';

const SITE_SETTINGS_ID = 1;

export async function syncThemesTable(client: SupabaseClient) {
  const summaries = listThemes();
  const payload = summaries.map((theme) => ({
    theme_id: theme.id,
    display_name: theme.name,
    description: theme.description ?? null
  }));

  const { error } = await client.from('themes').upsert(payload, { onConflict: 'theme_id' });
  if (error) {
    throw new Error(`Failed to sync themes: ${error.message}`);
  }
}

async function ensureSiteSettingsRow(client: SupabaseClient, activeThemeId: string) {
  const { error } = await client.from('site_settings').upsert(
    {
      id: SITE_SETTINGS_ID,
      active_theme_id: activeThemeId,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(`Failed to update site settings: ${error.message}`);
  }
}

export async function getActiveThemeId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client
    .from('site_settings')
    .select('active_theme_id')
    .eq('id', SITE_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read active theme: ${error.message}`);
  }

  const themeId = data?.active_theme_id ?? defaultThemeId;
  await ensureSiteSettingsRow(client, themeId);
  return themeId;
}

export async function setActiveTheme(client: SupabaseClient, themeId: ThemeId) {
  const themeDefinition = getThemeDefinition(themeId);
  if (!themeDefinition) {
    throw new Error(`Unknown theme: ${themeId}`);
  }

  await ensureSiteSettingsRow(client, themeDefinition.id);

  await client.from('themes').update({ is_active: false }).neq('theme_id', themeDefinition.id);

  const { error } = await client.from('themes').upsert(
    {
      theme_id: themeDefinition.id,
      display_name: themeDefinition.name,
      description: themeDefinition.description ?? null,
      is_active: true,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'theme_id' }
  );

  if (error) {
    throw new Error(`Failed to activate theme: ${error.message}`);
  }
}

