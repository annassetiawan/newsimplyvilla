class ChannexError extends Error {
  constructor(
    public code: string,
    public title: string,
    public details?: string[]
  ) {
    super(`[Channex] ${code}: ${title}`)
  }
}

export class ChannexClient {
  private baseUrl: string

  constructor(
    private apiKey: string,
    env: 'staging' | 'production' = 'staging'
  ) {
    this.baseUrl =
      env === 'staging'
        ? 'https://staging.channex.io/api/v1'
        : 'https://app.channex.io/api/v1'
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`
    if (params && Object.keys(params).length > 0) {
      url += '?' + new URLSearchParams(params).toString()
    }

    const attempt = async (): Promise<Response> => {
      return fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'user-api-key': this.apiKey,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    }

    let res = await attempt()

    // Retry with exponential backoff on 429 (rate limit) and 5xx (transient errors)
    const retryDelays = [1000, 2000, 4000]
    for (const delay of retryDelays) {
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = res.headers.get('Retry-After')
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay
        await new Promise((r) => setTimeout(r, waitMs))
        res = await attempt()
      } else {
        break
      }
    }

    if (!res.ok) {
      let errCode = String(res.status)
      let errTitle = res.statusText
      let errDetails: string[] | undefined
      try {
        const errBody = await res.json()
        const e = errBody?.errors
        if (e) {
          errCode = e.code ?? errCode
          errTitle = e.title ?? errTitle
          errDetails = Array.isArray(e.details) ? e.details : undefined
        }
      } catch {}
      throw new ChannexError(errCode, errTitle, errDetails)
    }

    if (res.status === 204) return undefined as T

    const json = await res.json()
    return (json?.data ?? json) as T
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params)
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body)
  }

  async delete(path: string): Promise<void> {
    await this.request<void>('DELETE', path)
  }
}
