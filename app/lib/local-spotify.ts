import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type PendingSpotifyAuth = {
  state: string;
  verifier: string;
  redirectUri: string;
  expiresAt: number;
};

export type LocalSpotifySession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

const authFile = path.join(process.cwd(), ".spotify-auth.json");
const sessionFile = path.join(process.cwd(), ".spotify-session.json");

function base64Url(bytes: Buffer) {
  return bytes.toString("base64url");
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function createSpotifyAuthorization(redirectUri: string) {
  const verifier = base64Url(randomBytes(64));
  return {
    state: randomUUID(),
    verifier,
    redirectUri,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
}

export async function savePendingSpotifyAuth(auth: PendingSpotifyAuth) {
  await writeFile(authFile, JSON.stringify(auth), { encoding: "utf8", mode: 0o600 });
}

export async function takePendingSpotifyAuth() {
  const pending = await readJson<PendingSpotifyAuth>(authFile);
  await rm(authFile, { force: true });
  if (!pending || pending.expiresAt < Date.now()) return null;
  return pending;
}

export async function readLocalSpotifySession() {
  return readJson<LocalSpotifySession>(sessionFile);
}

export async function saveLocalSpotifySession(session: LocalSpotifySession) {
  await writeFile(sessionFile, JSON.stringify(session), { encoding: "utf8", mode: 0o600 });
}

export async function clearLocalSpotifySession() {
  await rm(sessionFile, { force: true });
}
