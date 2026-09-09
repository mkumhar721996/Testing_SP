// Stands in for the not-yet-built login story's session verification: a
// browser that has logged in sends this cookie automatically on every
// same-origin request, so no client-side wiring is needed here.
export function isAuthenticated(req) {
  const cookieHeader = req.headers["cookie"] || "";
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  return Boolean(match && match[1].trim());
}
