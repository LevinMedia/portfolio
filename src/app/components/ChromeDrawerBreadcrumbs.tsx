'use client'

export type ChromeDrawerBreadcrumb = {
  label: string
  onClick?: () => void
  /** Marks the current page (not interactive). */
  current?: boolean
  /** When false, crumb is not rendered. Defaults to true. */
  visible?: boolean
}

interface ChromeDrawerBreadcrumbsProps {
  items: ChromeDrawerBreadcrumb[]
}

export default function ChromeDrawerBreadcrumbs({
  items,
}: ChromeDrawerBreadcrumbsProps) {
  const visibleItems = items.filter(
    (crumb) => crumb.visible !== false && crumb.label.trim().length > 0,
  )
  if (visibleItems.length === 0) return null

  const collapseMiddleOnSmall = visibleItems.length === 3

  return (
    <nav
      aria-label="Breadcrumb"
      className={`chrome-drawer-breadcrumbs min-w-0${
        collapseMiddleOnSmall ? ' chrome-drawer-breadcrumbs--triple' : ''
      }`}
    >
      <ol className="chrome-drawer-breadcrumbs__list">
        {visibleItems.map((crumb, index) => {
          const isCurrent =
            crumb.current ||
            (index === visibleItems.length - 1 &&
              !crumb.onClick)
          const isMiddleCrumb = collapseMiddleOnSmall && index === 1

          return (
            <li
              key={`${crumb.label}-${index}`}
              className="chrome-drawer-breadcrumbs__item"
            >
              {index > 0 ? (
                <span className="chrome-drawer-breadcrumbs__sep" aria-hidden>
                  /
                </span>
              ) : null}
              {isCurrent ? (
                <span
                  className="chrome-drawer-breadcrumbs__current"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <button
                  type="button"
                  className={`chrome-drawer-breadcrumbs__link${
                    isMiddleCrumb ? ' chrome-drawer-breadcrumbs__link--middle' : ''
                  }`}
                  onClick={crumb.onClick}
                  aria-label={isMiddleCrumb ? crumb.label : undefined}
                >
                  {isMiddleCrumb ? (
                    <>
                      <span className="chrome-drawer-breadcrumbs__label-full">
                        {crumb.label}
                      </span>
                      <span className="chrome-drawer-breadcrumbs__label-short" aria-hidden>
                        …
                      </span>
                    </>
                  ) : (
                    crumb.label
                  )}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
