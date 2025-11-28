'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/app/components/Button';

interface ThemeSummary {
  id: string;
  name: string;
  description?: string;
  previewImage?: string;
  tags?: string[];
}

interface ThemeResponse {
  themes: ThemeSummary[];
  activeThemeId: string;
}

export default function ThemeAdminPage() {
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingThemeId, setSwitchingThemeId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    void loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/themes');
      if (!response.ok) {
        throw new Error('Failed to load themes');
      }

      const data = (await response.json()) as ThemeResponse;
      setThemes(data.themes);
      setActiveThemeId(data.activeThemeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeSwitch = async (themeId: string) => {
    if (themeId === activeThemeId) return;
    try {
      setSwitchingThemeId(themeId);
      setError(null);

      const response = await fetch('/api/admin/themes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Unable to switch theme');
      }

      setActiveThemeId(themeId);
      setLastUpdatedAt(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSwitchingThemeId(null);
    }
  };

  const activeTheme = useMemo(() => themes.find((theme) => theme.id === activeThemeId), [
    themes,
    activeThemeId
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin"
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          Admin
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-foreground">Themes</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">
          Theme Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Activate a theme to instantly change the entire site experience.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-300/50 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {lastUpdatedAt && (
        <div className="text-xs text-muted-foreground">
          Last updated <span className="text-foreground">{lastUpdatedAt}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="border border-border/40 rounded-lg p-5 bg-background shadow-sm flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{theme.name}</h2>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {theme.id}
                  </p>
                </div>
                {activeThemeId === theme.id && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Active
                  </span>
                )}
              </div>

              {theme.description && (
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              )}

              {theme.tags && theme.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {theme.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs uppercase tracking-wide px-2 py-1 rounded-md bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <Button
                style={activeThemeId === theme.id ? 'outline' : 'solid'}
                color="primary"
                size="small"
                disabled={switchingThemeId === theme.id}
                onClick={() => handleThemeSwitch(theme.id)}
              >
                {activeThemeId === theme.id
                  ? 'Currently Active'
                  : switchingThemeId === theme.id
                  ? 'Switching...'
                  : 'Activate Theme'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {activeTheme && (
        <div className="border border-border/40 rounded-lg p-6 bg-muted/20">
          <h3 className="text-md font-semibold text-foreground mb-2">Active Theme Details</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {activeTheme.description || 'No description provided'}
          </p>
          <div className="text-xs text-muted-foreground">
            Theme ID: <span className="text-foreground font-mono">{activeTheme.id}</span>
          </div>
        </div>
      )}
    </div>
  );
}

