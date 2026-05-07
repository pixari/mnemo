export async function fetchUrl(url: string): Promise<{ content: string; title: string }> {
  const { default: fetch } = await import('node-fetch')

  const response = await fetch(url, {
    headers: { 'User-Agent': 'mnemo/0.1 (+https://github.com/pixari/mnemo)' },
    redirect: 'follow',
  })

  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`)

  const contentType = response.headers.get('content-type') ?? ''
  const body = await response.text()

  if (!contentType.includes('text/html')) {
    return { content: body.trim(), title: titleFromUrl(url) }
  }

  const content = stripHtml(body)
  const title = extractTitle(body) ?? titleFromUrl(url)
  return { content: `# ${title}\n\n${content}`, title }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? m[1].trim() : null
}

function titleFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/$/, '').split('/').filter(Boolean).pop() ?? ''
    return path ? `${u.hostname} — ${decodeURIComponent(path)}` : u.hostname
  } catch {
    return url
  }
}
