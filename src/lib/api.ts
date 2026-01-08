export const getApiBase = (): string => {
  const envBase =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    '';
  if (envBase) return envBase.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const port = process.env.NEXT_PUBLIC_SERVER_PORT || '3001';
    return `${protocol}//${hostname}:${port}`;
  }
  return 'http://localhost:3001';
};
