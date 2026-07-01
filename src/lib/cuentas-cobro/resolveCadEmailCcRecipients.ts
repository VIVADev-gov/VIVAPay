import "server-only";

import { subareaHasSupervisor } from "@/constants/organizacionViva";
import { USER_ROLES } from "@/constants/userRoles";
import { connectDB } from "@/lib/db/mongoose";
import { getEmailCad } from "@/lib/email/getEmailCad";
import logger from "@/lib/logger";
import { User } from "@/models/user";
import {
  findReviewerEmail,
  type ReviewerOrgContractor,
} from "./findReviewerByOrg";

export type ResolveCadEmailCcRecipientsInput = {
  userId: string;
  contractor: ReviewerOrgContractor;
  to?: string | string[];
};

function normalizeEmailList(value: string | string[] | undefined) {
  if (!value) return new Set<string>();

  const items = Array.isArray(value) ? value : [value];
  const normalized = items
    .flatMap((item) => item.split(","))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return new Set(normalized);
}

export async function resolveCadEmailCcRecipients(
  input: ResolveCadEmailCcRecipientsInput
): Promise<string[]> {
  await connectDB();

  const excluded = normalizeEmailList(input.to);
  const cadEmail = getEmailCad()?.trim().toLowerCase();
  if (cadEmail) {
    excluded.add(cadEmail);
  }

  const cc: string[] = [];

  const contractor = await User.findById(input.userId).select("email name").exec();
  const contractorEmail = contractor?.email?.trim();
  if (contractorEmail) {
    if (!excluded.has(contractorEmail.toLowerCase())) {
      cc.push(contractorEmail);
    }
  } else {
    logger.warn("[cuentas-cobro/cad-package] Contratista sin email para CC al CAD");
  }

  const supervisor = await findReviewerEmail(USER_ROLES.SUPERVISOR, input.contractor);
  const director = await findReviewerEmail(USER_ROLES.DIRECTOR, input.contractor);
  const hasSupervisor = subareaHasSupervisor(
    input.contractor.organizationalUnitId,
    input.contractor.subareaId
  );

  const reviewerEmail = hasSupervisor ? supervisor?.email : director?.email;
  if (reviewerEmail) {
    if (!excluded.has(reviewerEmail.toLowerCase())) {
      cc.push(reviewerEmail);
    }
  } else {
    logger.warn(
      `[cuentas-cobro/cad-package] No se encontró ${hasSupervisor ? "supervisor" : "director"} activo para CC al CAD`
    );
  }

  return [...new Set(cc)];
}
