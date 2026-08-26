/**
 * Message from a caught value, or a fallback.
 *
 * Every catch block in this app used `catch (err: any)` and then
 * `err.message || 'fallback'`. Typing the catch variable as `any` silences the
 * compiler rather than handling the case, and `err.message` throws outright if
 * something threw a null. This narrows properly and keeps the same behaviour:
 * an Error with a non-empty message wins, everything else falls back.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
