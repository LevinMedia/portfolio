'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Drawer from './Drawer'
import SelectedWorkDetail, { type SelectedWorkPreview } from './SelectedWorkDetail'
import FieldNoteDetail, { type FieldNotePreview } from './FieldNoteDetail'
import { applySiteSettingsToRoot } from '@/lib/site-settings'
import { loadAppSettings, resolveAppColorMode } from '@/lib/app-settings'
import { c64ProMono, vt323 } from '@/app/c64-fonts'

export async function confirmAdminPreview(): Promise<boolean> {
  const response = await fetch('/api/admin/session', { credentials: 'same-origin' })
  return response.ok
}

type AdminContentPreviewProps = {
  onClose: () => void
} & (
  | ({ kind: 'work' } & SelectedWorkPreview)
  | ({ kind: 'note' } & FieldNotePreview)
)

/**
 * Public drawer for the current editor form. Stays on the admin page: no public
 * slug, no query string, and no write. Chrome controls return to the editor.
 */
export default function AdminContentPreview(props: AdminContentPreviewProps) {
  const { kind, onClose, title: draftTitle, content, feature_image_url: featureImageUrl } = props
  const author = kind === 'note' ? props.author : ''
  const [title, setTitle] = useState(draftTitle)
  const [isTitleVisible, setIsTitleVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const chromeTheme = useMemo(
    () => resolveAppColorMode(loadAppSettings().colorMode),
    [],
  )

  const workPreview = useMemo(
    () =>
      kind === 'work'
        ? {
            title: draftTitle,
            content,
            feature_image_url: featureImageUrl,
          }
        : null,
    [kind, draftTitle, content, featureImageUrl],
  )

  const notePreview = useMemo(
    () =>
      kind === 'note'
        ? {
            title: draftTitle,
            content,
            feature_image_url: featureImageUrl,
            author,
          }
        : null,
    [kind, draftTitle, content, featureImageUrl, author],
  )

  useEffect(() => {
    if (rootRef.current) applySiteSettingsToRoot(rootRef.current)
  }, [])

  const listLabel = kind === 'work' ? 'Featured work' : 'Field notes'

  return createPortal(
    <div
      ref={rootRef}
      id="c64-site-root"
      className={`c64-site ${chromeTheme} ${vt323.variable} ${c64ProMono.variable}`}
      data-chrome-theme={chromeTheme}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        colorScheme: chromeTheme,
        backgroundColor: 'transparent',
      }}
    >
      <div className="chrome-standalone-page relative h-full min-h-full bg-[var(--chrome-bg-solid,#f5f5f7)]">
        <Drawer
          isOpen
          onClose={onClose}
          onLogoClick={onClose}
          breadcrumbs={[
            { label: 'Home', onClick: onClose },
            { label: listLabel, onClick: onClose },
            {
              label: title,
              current: true,
              visible: !!title && !isTitleVisible,
            },
          ]}
          contentPadding="p-0"
          maxWidth=""
        >
          <div className="px-4">
            {workPreview ? (
              <SelectedWorkDetail
                preview={workPreview}
                onTitleLoad={setTitle}
                onTitleVisibilityChange={setIsTitleVisible}
              />
            ) : notePreview ? (
              <FieldNoteDetail
                preview={notePreview}
                onTitleLoad={setTitle}
                onTitleVisibilityChange={setIsTitleVisible}
              />
            ) : null}
          </div>
        </Drawer>
      </div>
    </div>,
    document.body,
  )
}
