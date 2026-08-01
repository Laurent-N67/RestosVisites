import { ApiError } from '../api/client.ts'

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? (err.detail ?? err.message) : fallback
}
