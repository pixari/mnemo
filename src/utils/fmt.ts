import chalk from 'chalk'

export function isTTY(): boolean {
  return Boolean(process.stdout.isTTY)
}

export const ok = (s: string) => chalk.green('✓') + ' ' + s
export const err = (s: string) => chalk.red('✗') + ' ' + s
export const warn = (s: string) => chalk.yellow('⚠') + ' ' + s
export const bold = (s: string) => chalk.bold(s)
export const dim = (s: string) => chalk.dim(s)
export const accent = (s: string) => chalk.cyan(s)
export const muted = (s: string | number) => chalk.dim(String(s))

export function section(title: string): void {
  process.stdout.write(`\n${chalk.bold.underline(title)}\n`)
}

export function line(text = ''): void {
  process.stdout.write(text + '\n')
}

export function kv(key: string, value: string | number | null | undefined): void {
  process.stdout.write(`  ${chalk.dim(key + ':')} ${value ?? chalk.dim('—')}\n`)
}
