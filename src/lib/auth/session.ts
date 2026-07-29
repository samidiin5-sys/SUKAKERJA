export function shouldRedirectToLogin({
  session,
  user,
}: {
  session: unknown
  user: unknown
}) {
  return !session && !user
}
