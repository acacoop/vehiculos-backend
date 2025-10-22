import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import {
  ENTRA_TENANT_ID,
  ENTRA_API_AUDIENCE,
  ENTRA_EXPECTED_ISSUER,
  ENTRA_ALLOWED_CLIENT_IDS,
  ENTRA_REQUIRED_SCOPE,
} from "@/config/env.config";

let client: jwksClient.JwksClient | null = null;

function normalizeIssuer(issuer: string): string {
  return issuer.endsWith("/") ? issuer.slice(0, -1) : issuer;
}

function getIssuer(): string {
  if (ENTRA_EXPECTED_ISSUER) {
    return normalizeIssuer(ENTRA_EXPECTED_ISSUER);
  }
  if (!ENTRA_TENANT_ID) {
    throw new Error("ENTRA_TENANT_ID must be set to validate tokens");
  }
  return `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0`;
}

function getJwksClient(): jwksClient.JwksClient {
  if (client) return client;

  const issuer = getIssuer();

  // Azure AD JWKS endpoint construction
  // For v2.0: https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys
  // For v1.0: https://login.microsoftonline.com/{tenant}/discovery/keys
  let jwksUri: string;

  if (issuer.includes("/v2.0")) {
    // Remove /v2.0 from issuer and add proper discovery path
    const baseIssuer = issuer.replace(/\/v2\.0\/?$/, "");
    jwksUri = `${baseIssuer}/discovery/v2.0/keys`;
  } else {
    jwksUri = `${issuer}/discovery/keys`;
  }

  client = jwksClient({
    jwksUri,
    cache: true,
    cacheMaxAge: 600000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  return client;
}

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    getJwksClient().getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      const signingKey = key?.getPublicKey();
      if (!signingKey) return reject(new Error("Unable to get signing key"));
      resolve(signingKey);
    });
  });
}

export type EntraPayload = jwt.JwtPayload & {
  oid?: string;
  tid?: string;
  preferred_username?: string;
  name?: string;
  roles?: string[];
  groups?: string[];
  appid?: string;
  azp?: string;
  scp?: string;
};

export interface VerifiedEntraToken {
  header: jwt.JwtHeader;
  payload: EntraPayload;
  token: string;
}

export async function verifyEntraAccessToken(
  token: string,
): Promise<VerifiedEntraToken> {
  // Decode token to get header
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid token format");
  }

  if (!decoded.header.kid) {
    throw new Error("Token missing kid in header");
  }

  // Get signing key and prepare verification options
  const signingKey = await getSigningKey(decoded.header.kid);
  const verifyOptions = buildVerifyOptions();

  // Verify token signature and claims
  const verifiedPayload = jwt.verify(
    token,
    signingKey,
    verifyOptions,
  ) as EntraPayload;

  // Validate additional claims
  validateTenant(verifiedPayload);
  validateClient(verifiedPayload);
  validateScope(verifiedPayload);

  return { header: decoded.header, payload: verifiedPayload, token };
}

function buildVerifyOptions(): jwt.VerifyOptions {
  const options: jwt.VerifyOptions = { algorithms: ["RS256"] };

  // Build accepted issuers
  const baseIssuer = getIssuer();
  const issuers = [baseIssuer];
  if (ENTRA_TENANT_ID) {
    issuers.push(`https://sts.windows.net/${ENTRA_TENANT_ID}`);
  }

  // Add both with and without trailing slash for compatibility
  const issuerVariants = new Set<string>();
  for (const iss of issuers) {
    const normalized = normalizeIssuer(iss);
    issuerVariants.add(normalized);
    issuerVariants.add(`${normalized}/`);
  }

  const acceptedIssuers = Array.from(issuerVariants);
  options.issuer =
    acceptedIssuers.length === 1
      ? acceptedIssuers[0]
      : (acceptedIssuers as [string, ...string[]]);

  // Build accepted audiences
  if (ENTRA_API_AUDIENCE) {
    const audiences = ENTRA_API_AUDIENCE.split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    // Add api:// prefix variants for GUID audiences
    const audienceVariants = new Set<string>();
    for (const aud of audiences) {
      audienceVariants.add(aud);
      if (/^[0-9a-fA-F-]{36}$/.test(aud)) {
        audienceVariants.add(`api://${aud}`);
      } else if (aud.startsWith("api://")) {
        const guid = aud.slice(6);
        if (/^[0-9a-fA-F-]{36}$/.test(guid)) {
          audienceVariants.add(guid);
        }
      }
    }

    const acceptedAudiences = Array.from(audienceVariants);
    if (acceptedAudiences.length > 0) {
      options.audience =
        acceptedAudiences.length === 1
          ? acceptedAudiences[0]
          : (acceptedAudiences as [string, ...string[]]);
    }
  }

  return options;
}

function validateTenant(payload: EntraPayload): void {
  if (ENTRA_TENANT_ID && payload.tid && payload.tid !== ENTRA_TENANT_ID) {
    throw new Error("Token tenant mismatch");
  }
}

function validateClient(payload: EntraPayload): void {
  if (!ENTRA_ALLOWED_CLIENT_IDS) return;

  const allowedClients = ENTRA_ALLOWED_CLIENT_IDS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowedClients.length === 0) return;

  const clientId = payload.azp || payload.appid;
  if (!clientId || !allowedClients.includes(clientId)) {
    throw new Error("Client not allowed");
  }
}

function validateScope(payload: EntraPayload): void {
  if (!ENTRA_REQUIRED_SCOPE) return;

  const scopes = typeof payload.scp === "string" ? payload.scp.split(" ") : [];

  if (!scopes.includes(ENTRA_REQUIRED_SCOPE)) {
    throw new Error("Token missing required scope");
  }
}

export function extractBearer(authHeader: string | undefined) {
  if (!authHeader) return undefined;
  if (!authHeader.startsWith("Bearer ")) return undefined;
  return authHeader.slice(7).trim();
}
