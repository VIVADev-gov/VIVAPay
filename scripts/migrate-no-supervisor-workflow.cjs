#!/usr/bin/env node
"use strict";

/**
 * Reubica cuentas de cobro de contratistas en subáreas sin supervisor
 * (hasSupervisor: false) al flujo directo del director.
 *
 * Para cada contratista en DIRECCIÓN cuya subárea no tiene supervisor, las cuentas
 * atascadas en el pipeline del supervisor pasan a PENDIENTE_DIRECTOR y se limpian
 * campos de firma del director previos (flujo antiguo supervisor → director → CAD).
 *
 * NO toca: BORRADOR, PENDIENTE, HABILITADA, PENDIENTE_CONTRATISTA, ENVIADA,
 * ENVIADA_CAD, APROBADA, RECHAZADA, PENDIENTE_JEFE (jefaturas).
 *
 * Uso:
 *   node scripts/migrate-no-supervisor-workflow.cjs
 *   node scripts/migrate-no-supervisor-workflow.cjs --apply
 *   node scripts/migrate-no-supervisor-workflow.cjs --contrato=CPS-99-2026
 *
 * Mantener sincronizado con hasSupervisor en src/constants/organizacionViva.ts
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnvFile(file) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  const content = fs.readFileSync(full, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const MONGODB_URI = process.env.MONGODB_URI;
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const contratoFilter = (
  args.find((a) => a.startsWith("--contrato=")) || ""
).split("=")[1];

/** Espejo de organizacionViva: subáreas con hasSupervisor: false */
const SUBAREAS_SIN_SUPERVISOR = new Set([
  "proc-evaluacion-independiente",
]);

const ORGANIZACION_TIPO_DIRECCION = "DIRECCION";
const ROLE_CONTRATISTA = "CONTRATISTA";

const SKIP_STATUSES = new Set([
  "BORRADOR",
  "PENDIENTE",
  "HABILITADA",
  "PENDIENTE_CONTRATISTA",
  "ENVIADA",
  "ENVIADA_CAD",
  "APROBADA",
  "RECHAZADA",
  "PENDIENTE_JEFE",
]);

const MIGRATE_STATUSES = new Set([
  "PENDIENTE_SUPERVISOR",
  "PENDIENTE_ENVIO_CAD",
  "ENVIADA_CONTRATISTA",
  "PENDIENTE_DIRECTOR",
]);

function subareaHasSupervisor(subareaId) {
  if (!subareaId) return true;
  return !SUBAREAS_SIN_SUPERVISOR.has(subareaId);
}

function contractorUsesDirectorDirectFlow(user) {
  return (
    user.role === ROLE_CONTRATISTA &&
    user.organizationalUnitType === ORGANIZACION_TIPO_DIRECCION &&
    user.subareaId &&
    !subareaHasSupervisor(user.subareaId)
  );
}

async function main() {
  if (!MONGODB_URI) {
    console.error("ERROR: MONGODB_URI no está definida.");
    process.exit(1);
  }

  console.log(
    `\n${APPLY ? "APLICANDO" : "DRY-RUN"} — migración flujo sin supervisor` +
      `${contratoFilter ? ` · contrato: ${contratoFilter}` : ""}\n`
  );

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const usersCol = db.collection("users");
  const contratosCol = db.collection("contratos");
  const cuentasCol = db.collection("cuentas_cobro");

  const contractors = await usersCol
    .find({
      role: ROLE_CONTRATISTA,
      organizationalUnitType: ORGANIZACION_TIPO_DIRECCION,
      subareaId: { $in: [...SUBAREAS_SIN_SUPERVISOR] },
    })
    .toArray();

  if (contractors.length === 0) {
    console.log("No hay contratistas en subáreas sin supervisor.");
    await mongoose.disconnect();
    return;
  }

  const contractorById = new Map(contractors.map((c) => [String(c._id), c]));

  console.log(`Contratistas sin supervisor: ${contractors.length}`);
  for (const c of contractors) {
    console.log(
      `  - ${c.name} (${c.email}) · ${c.organizationalUnitName ?? ""} / ${c.subareaName ?? c.subareaId}`
    );
  }
  console.log("");

  let filterContractIds = null;
  if (contratoFilter) {
    const or = [];
    if (mongoose.Types.ObjectId.isValid(contratoFilter)) {
      or.push({ _id: new mongoose.Types.ObjectId(contratoFilter) });
    }
    or.push({ numeroContrato: contratoFilter });
    const matched = await contratosCol.find({ $or: or }).toArray();
    filterContractIds = new Set(matched.map((c) => String(c._id)));
    if (filterContractIds.size === 0) {
      console.log(`No se encontró contrato: ${contratoFilter}`);
      await mongoose.disconnect();
      return;
    }
  }

  const contractorIds = contractors.map((c) => c._id);
  const accounts = await cuentasCol
    .find({ userId: { $in: contractorIds } })
    .sort({ contratoId: 1, numero: 1 })
    .toArray();

  const contractIds = [...new Set(accounts.map((a) => String(a.contratoId)))];
  const contracts = await contratosCol
    .find({
      _id: {
        $in: contractIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    })
    .toArray();
  const contractById = new Map(contracts.map((c) => [String(c._id), c]));

  const stats = {
    cuentasRevisadas: 0,
    cuentasMigradas: 0,
    cuentasOmitidas: 0,
    contratosAfectados: new Set(),
  };

  for (const account of accounts) {
    const contractor = contractorById.get(String(account.userId));
    if (!contractor || !contractorUsesDirectorDirectFlow(contractor)) {
      continue;
    }

    if (filterContractIds && !filterContractIds.has(String(account.contratoId))) {
      continue;
    }

    const contract = contractById.get(String(account.contratoId));
    stats.cuentasRevisadas++;

    if (SKIP_STATUSES.has(account.estado)) {
      stats.cuentasOmitidas++;
      continue;
    }

    const needsEstadoChange = account.estado !== "PENDIENTE_DIRECTOR";
    const needsClearDirector =
      Boolean(account.directorFirmadoAt) || Boolean(account.directorFirmadoPor);

    if (!needsEstadoChange && !needsClearDirector) {
      stats.cuentasOmitidas++;
      continue;
    }

    if (needsEstadoChange && !MIGRATE_STATUSES.has(account.estado)) {
      console.log(
        `  ? OMITIDA cuenta #${account.numero} contrato ${contract?.numeroContrato ?? account.contratoId} — estado no previsto: ${account.estado}`
      );
      stats.cuentasOmitidas++;
      continue;
    }

    const contractLabel = contract?.numeroContrato ?? String(account.contratoId);
    console.log(
      `  ${contractLabel} #${account.numero}: ${account.estado}` +
        (needsEstadoChange ? " → PENDIENTE_DIRECTOR" : "") +
        (needsClearDirector ? " (limpia firma director)" : "")
    );

    stats.contratosAfectados.add(String(account.contratoId));
    stats.cuentasMigradas++;

    if (APPLY) {
      const update = {
        $set: { estado: "PENDIENTE_DIRECTOR", updatedAt: new Date() },
      };
      if (needsClearDirector) {
        update.$unset = {
          directorFirmadoAt: "",
          directorFirmadoPor: "",
        };
      }
      await cuentasCol.updateOne({ _id: account._id }, update);
    }
  }

  console.log("\n----------------------------------------");
  console.log(`Cuentas revisadas : ${stats.cuentasRevisadas}`);
  console.log(
    `Cuentas ${APPLY ? "migradas" : "a migrar"} : ${stats.cuentasMigradas}`
  );
  console.log(`Cuentas omitidas    : ${stats.cuentasOmitidas}`);
  console.log(`Contratos afectados : ${stats.contratosAfectados.size}`);
  if (!APPLY && stats.cuentasMigradas > 0) {
    console.log("\n(DRY-RUN) Ejecuta con --apply para guardar.");
  }
  console.log("");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
