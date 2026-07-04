const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const responseCache = new Map();
const inflightRequests = new Map();

function buildUrl(path) {
  return `${API_BASE}${path}`;
}

function cloneValue(value) {
  if (value == null) {
    return value;
  }

  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function resolveCacheKey(path, cacheKey) {
  return cacheKey ?? path;
}

export async function requestJson(path, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(buildUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    throw new Error((await res.text()) || res.statusText);
  }

  return res.status === 204 ? null : res.json();
}

export async function cachedRequestJson(path, options = {}) {
  const {
    ttlMs = 30_000,
    cacheKey,
    force = false,
    ...requestOptions
  } = options;

  const resolvedCacheKey = resolveCacheKey(path, cacheKey);
  const now = Date.now();
  const cached = responseCache.get(resolvedCacheKey);
  if (!force && cached && cached.expiresAt > now) {
    return cloneValue(cached.value);
  }

  const inflight = inflightRequests.get(resolvedCacheKey);
  if (!force && inflight) {
    return cloneValue(await inflight);
  }

  const requestPromise = requestJson(path, requestOptions)
    .then((value) => {
      responseCache.set(resolvedCacheKey, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
      return value;
    })
    .finally(() => {
      inflightRequests.delete(resolvedCacheKey);
    });

  inflightRequests.set(resolvedCacheKey, requestPromise);
  return cloneValue(await requestPromise);
}

export function invalidateApiCache(matcher) {
  if (!matcher) {
    responseCache.clear();
    inflightRequests.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    if (typeof matcher === 'function' ? matcher(key) : key.startsWith(matcher)) {
      responseCache.delete(key);
    }
  }

  for (const key of inflightRequests.keys()) {
    if (typeof matcher === 'function' ? matcher(key) : key.startsWith(matcher)) {
      inflightRequests.delete(key);
    }
  }
}
