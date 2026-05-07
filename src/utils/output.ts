export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function success<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function failure(error: string): Result<never> {
  return { ok: false, error }
}

export function print<T>(result: Result<T>): void {
  if (!result.ok) {
    process.stderr.write(`Error: ${result.error}\n`)
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
}
