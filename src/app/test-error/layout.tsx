/**
 * Forces the /test-error route to render at request time. Without this the
 * page's forced throw would run during `next build` prerendering and fail
 * the production build when `NEXT_PUBLIC_E2E_ERROR_ROUTE=1` is set.
 */
export const dynamic = 'force-dynamic'

export default function TestErrorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
