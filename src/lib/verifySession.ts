export async function verifySession(token: string, secret: string) {
  if (!secret) throw new Error("Missing session secret");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid session");
  const decode = (value: string) =>
    Uint8Array.from(
      atob(
        value
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(Math.ceil(value.length / 4) * 4, "="),
      ),
      (c) => c.charCodeAt(0),
    );
  const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
  if (header.alg !== "HS256") throw new Error("Invalid session algorithm");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  if (
    !(await crypto.subtle.verify(
      "HMAC",
      key,
      decode(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    ))
  )
    throw new Error("Invalid session signature");
  const payload = JSON.parse(new TextDecoder().decode(decode(parts[1])));
  const now = Math.floor(Date.now() / 1000);
  if (
    typeof payload.id !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp <= now ||
    (typeof payload.nbf === "number" && payload.nbf > now)
  )
    throw new Error("Invalid or expired session");
  return payload;
}
