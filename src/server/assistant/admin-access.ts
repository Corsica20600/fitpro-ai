import { getAuthenticatedUserProfile } from "@/src/server/fitness-queries";

export class AssistantAdminAccessError extends Error {
  constructor(public readonly code: "AUTH_REQUIRED" | "ADMIN_REQUIRED") {
    super(code);
  }
}

export function parseTraknioAdminEmails(value = process.env.TRAKNIO_ADMIN_EMAILS) {
  return new Set(
    (value ?? "")
      .split(/[,;\n]/)
      .map((email) => email.trim().toLocaleLowerCase("fr-FR"))
      .filter(Boolean),
  );
}

export function isTraknioAdminEmail(email: string | null | undefined, adminEmails = parseTraknioAdminEmails()) {
  return Boolean(email && adminEmails.has(email.trim().toLocaleLowerCase("fr-FR")));
}

export async function requireTraknioAssistantAdmin() {
  const profile = await getAuthenticatedUserProfile().catch(() => null);
  if (!profile) throw new AssistantAdminAccessError("AUTH_REQUIRED");
  if (!isTraknioAdminEmail(profile.email)) throw new AssistantAdminAccessError("ADMIN_REQUIRED");
  return profile;
}
