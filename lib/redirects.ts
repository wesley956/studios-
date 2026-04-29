import { redirect } from 'next/navigation';

export function buildFeedbackUrl(path: string, key: 'success' | 'error', message: string) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

export function redirectWithError(path: string, message: string): never {
  redirect(buildFeedbackUrl(path, 'error', message));
}

export function redirectWithSuccess(path: string, message: string): never {
  redirect(buildFeedbackUrl(path, 'success', message));
}
