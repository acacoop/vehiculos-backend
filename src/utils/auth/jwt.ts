import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
  ProtectedHeaderParameters,
} from "jose";
import {
  ENTRA_TENANT_ID,
  ENTRA_API_AUDIENCE,
  ENTRA_EXPECTED_ISSUER,
  ENTRA_ALLOWED_CLIENT_IDS,
  ENTRA_REQUIRED_SCOPE,
} from "config/env.config";

function getIssuer() {
  if (ENTRA_EXPECTED_ISSUER) return ENTRA_EXPECTED_ISSUER.replace(/\/?$/, "/");
  if (!ENTRA_TENANT_ID)
    throw new Error("ENTRA_TENANT_ID must be set to validate tokens");
  return `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0/`;
}

let remoteJwksPromise: ReturnType<typeof createRemoteJWKSet> | null = null;

async function getRemoteJWKSVerified() {
  if (remoteJwksPromise) return remoteJwksPromise;
  const issuer = getIssuer();
  const openid = await fetch(`${issuer}.well-known/openid-configuration`);
  if (!openid.ok) throw new Error("Cannot fetch OpenID configuration");
  const conf = await openid.json();
  const jwksUri = conf.jwks_uri;
  remoteJwksPromise = createRemoteJWKSet(new URL(jwksUri));
  return remoteJwksPromise;
}

export type EntraPayload = JWTPayload & {
  oid?: string;
  tid?: string;
  preferred_username?: string;
  name?: string;
  roles?: string[];
  groups?: string[];
  appid?: string;
  azp?: string;
};

export interface VerifiedEntraToken {
  header: ProtectedHeaderParameters;
  payload: EntraPayload;
  token: string;
}

export async function verifyEntraAccessToken(
  token: string,
): Promise<VerifiedEntraToken> {
  const issuer = getIssuer();
  const audience = ENTRA_API_AUDIENCE;
  const allowedClients = (ENTRA_ALLOWED_CLIENT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const requiredScope = ENTRA_REQUIRED_SCOPE;

  const jwks = await getRemoteJWKSVerified();
  const baseIssuers: string[] = [issuer.replace(/\/+$/, "")];
  if (ENTRA_TENANT_ID)
    baseIssuers.push(`https://sts.windows.net/${ENTRA_TENANT_ID}`);
  const issuerSet = new Set<string>();
  for (const i of baseIssuers) {
    const trimmed = i.replace(/\/+$/, "");
    issuerSet.add(trimmed);
    issuerSet.add(`${trimmed}/`);
  }
  const acceptedIssuers = Array.from(issuerSet);
  const rawAudList = audience
    ? audience
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];
  const audSet = new Set<string>(rawAudList);
  for (const a of rawAudList) {
    if (/^[0-9a-fA-F-]{36}$/.test(a)) audSet.add(`api://${a}`);
    if (a.startsWith("api://")) {
      const tail = a.slice(6);
      if (/^[0-9a-fA-F-]{36}$/.test(tail)) audSet.add(tail);
    }
  }
  const acceptedAudiences = audSet.size ? Array.from(audSet) : undefined;

  const { payload, protectedHeader } = await jwtVerify(token, jwks, {
    issuer: acceptedIssuers,
    audience: acceptedAudiences,
  });

  if (payload.tid && ENTRA_TENANT_ID && payload.tid !== ENTRA_TENANT_ID) {
    throw new Error("Token tenant mismatch");
  }

  if (allowedClients.length) {
    const clientId = (payload.azp || payload.appid) as string | undefined;
    if (!clientId || !allowedClients.includes(clientId)) {
      throw new Error("Client not allowed");
    }
  }

  if (requiredScope) {
    const scopes =
      typeof payload.scp === "string" ? payload.scp.split(" ") : [];
    if (!scopes.includes(requiredScope)) {
      throw new Error("Token missing required scope");
    }
  }

  return { header: protectedHeader, payload: payload as EntraPayload, token };
}

export function extractBearer(authHeader: string | undefined) {
  if (!authHeader) return undefined;
  if (!authHeader.startsWith("Bearer ")) return undefined;
  return authHeader.slice(7).trim();
}
