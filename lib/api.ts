export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  baseUrl: string,
  token: string,
  organizationId: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Organization-Id', organizationId);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(new URL(path, baseUrl), { ...init, headers, credentials: 'omit' });
  } catch {
    throw new ApiError(0, 'The IPTIRS API could not be reached. Check the API URL and network connection.');
  }

  const payload = await response.json().catch(() => ({})) as {
    data?: T;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new ApiError(response.status, payload.error?.message ?? `The API request failed (${response.status}).`);
  }
  return payload as T;
}
