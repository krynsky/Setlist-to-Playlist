export function isLoopbackHost(host: string | null) {
  if (!host) return false;
  const value = host.split(",")[0].trim().toLowerCase();
  const hostname = value.startsWith("[")
    ? value.slice(1, value.indexOf("]"))
    : value.split(":")[0];

  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
