#!/usr/bin/env node
"use strict";

/**
 * Recalcula IN-PLACE el `valor` (y las observaciones de "X días pagables") de las
 * cuentas de cobro ya creadas, aplicando la lógica corregida de reparto:
 *   - Días con convención 30/360 (mes contable de 30 días; primer y último mes
 *     parciales se complementan).
 *   - Reparto proporcional a los días reales; la última cuenta toma el remanente.
 *
 * NO toca estado, fechas de envío, firmas ni historial: solo corrige montos.
 * Además corrige (opcional) `contrato.plazoMeses` para que refleje el plazo real.
 *
 * Seguridad: OMITE por completo cualquier contrato que tenga alguna cuenta en
 * ENVIADA_CAD / APROBADA / RECHAZADA (el monto ya salió del sistema). Las cuentas
 * pre-CAD (PENDIENTE, HABILITADA, ENVIADA manual, etc.) sí se recalculan.
 *
 * Uso:
 *   node scripts/fix-payment-account-values.cjs                 # dry-run (no escribe)
 *   node scripts/fix-payment-account-values.cjs --apply         # aplica cambios
 *   node scripts/fix-payment-account-values.cjs --contrato=CPS-124-2026
 *   node scripts/fix-payment-account-values.cjs --no-plazo      # no tocar plazoMeses
 *
 * Requiere MONGODB_URI (se lee de .env.local / .env si no está en el entorno).
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// --- Carga mínima de variables de entorno (.env.local, .env) ---
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

// --- Args ---
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FIX_PLAZO = !args.includes("--no-plazo");
const contratoFilter = (
  args.find((a) => a.startsWith("--contrato=")) || ""
).split("=")[1];

// Estados en los que el monto ya viajó fuera del sistema: no se tocan.
const LOCKED_STATUSES = ["ENVIADA_CAD", "APROBADA", "RECHAZADA"];

// ------------------------------------------------------------------
// Lógica pura (espejo de src/lib/cuentas-cobro/paymentAccountPreview.ts
// y src/utils/date.ts). Se usa UTC para evitar corrimientos de zona.
// ------------------------------------------------------------------
function toUtcNoon(value) {
  const d = value instanceof Date ? value : new Date(value);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0)
  );
}

function lastDayOfUtcMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0, 12, 0, 0, 0)).getUTCDate();
}

function isFullCalendarMonthSegment(start, end) {
  return (
    start.getUTCDate() === 1 &&
    end.getUTCDate() ===
      lastDayOfUtcMonth(start.getUTCFullYear(), start.getUTCMonth()) &&
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth()
  );
}

function days360(start, end) {
  let d1 = start.getUTCDate();
  let d2 = end.getUTCDate();
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 === 30) d2 = 30;
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 360 +
    (end.getUTCMonth() - start.getUTCMonth()) * 30 +
    (d2 - d1)
  );
}

function getPayableDays(periodoInicio, periodoFin, isFirstSegment, isLastSegment) {
  const pi = toUtcNoon(periodoInicio);
  const pf = toUtcNoon(periodoFin);
  if (isFullCalendarMonthSegment(pi, pf)) return 30;

  const startDay = pi.getUTCDate();
  const endDay = pf.getUTCDate();

  if (isFirstSegment && isLastSegment) {
    return Math.max(0, Math.min(30, days360(pi, pf)));
  }
  if (isFirstSegment && startDay !== 1) {
    return Math.min(30, 31 - startDay);
  }
  if (isLastSegment) {
    return Math.max(0, Math.min(30, endDay - 1));
  }
  return Math.max(0, Math.min(30, days360(pi, pf)));
}

// Honorario mensual fijo (÷plazo); la última cuenta toma el remanente para cuadrar
// con valorTotal. Espejo de distributeByMonthly (src/lib/cuentas-cobro).
function distributeByMonthly(valorTotal, plazoMeses, diasList) {
  if (diasList.length === 0) return [];
  const plazo = Math.max(1, Math.round(Number(plazoMeses) || 0));
  const valorMensual = valorTotal / plazo;
  const valores = diasList.map((d) => Math.round((valorMensual * d) / 30));
  const lastIdx = diasList.length - 1;
  const sumExceptLast = valores.slice(0, lastIdx).reduce((s, v) => s + v, 0);
  valores[lastIdx] = valorTotal - sumExceptLast;
  return valores;
}

function calculatePlazoMeses(fechaActaInicio, fechaFinal) {
  if (!fechaActaInicio || !fechaFinal) return null;
  const start = toUtcNoon(fechaActaInicio);
  const end = toUtcNoon(fechaFinal);
  if (end < start) return null;

  const monthDiff =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  const dayDiff = end.getUTCDate() - start.getUTCDate();
  const months = Math.round(monthDiff + dayDiff / 30);
  return Math.max(1, months);
}

// Replica de getCurrentContractSnapshot (src/models/contrato.ts)
function getCurrentContractSnapshot(doc) {
  const base = {
    numeroContrato: doc.numeroContrato,
    objeto: doc.objeto,
    plazoMeses: doc.plazoMeses,
    fechaActaInicio: doc.fechaActaInicio,
    fechaFinal: doc.fechaFinal,
    concepto: doc.concepto,
    rubro: doc.rubro,
    cdp: doc.cdp,
    valorCdp: doc.valorCdp,
    rpc: doc.rpc,
    valorRpc: doc.valorRpc,
    valorInicialContrato: doc.valorInicialContrato,
    numeroDisponibilidad: doc.numeroDisponibilidad,
    numeroCompromiso: doc.numeroCompromiso,
  };
  const current = (doc.modificaciones || []).reduce((snapshot, modification) => {
    const merged = { ...snapshot };
    for (const [key, value] of Object.entries(modification)) {
      if (["_id", "tipo", "descripcion", "fechaRegistro"].includes(key)) continue;
      if (value === undefined || value === null || value === "") continue;
      merged[key] = value;
    }
    return merged;
  }, base);
  return current;
}

function resolveValorTotal(doc, current) {
  const mods = doc.modificaciones || [];
  const lastMod = mods.length ? mods[mods.length - 1] : null;
  return (
    current.totalRecursosComprometidos ??
    (lastMod ? lastMod.totalRecursosComprometidos : undefined) ??
    current.valorRpc ??
    current.valorInicialContrato ??
    doc.valorInicialContrato ??
    0
  );
}

function fmt(n) {
  return typeof n === "number" ? n.toLocaleString("es-CO") : String(n);
}

function ymd(value) {
  if (!value) return "----------";
  return toUtcNoon(value).toISOString().slice(0, 10);
}

// ------------------------------------------------------------------

async function main() {
  if (!MONGODB_URI) {
    console.error(
      "ERROR: MONGODB_URI no está definida (ni en el entorno ni en .env.local/.env)."
    );
    process.exit(1);
  }

  console.log(
    `\n${APPLY ? "APLICANDO CAMBIOS" : "DRY-RUN (no se escribe nada)"}` +
      `${contratoFilter ? `  ·  filtro contrato: ${contratoFilter}` : ""}` +
      `${FIX_PLAZO ? "  ·  corrige plazoMeses" : "  ·  sin tocar plazoMeses"}\n`
  );

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const contratosCol = db.collection("contratos");
  const cuentasCol = db.collection("cuentas_cobro");

  const contractQuery = {};
  if (contratoFilter) {
    if (mongoose.Types.ObjectId.isValid(contratoFilter)) {
      contractQuery.$or = [
        { _id: new mongoose.Types.ObjectId(contratoFilter) },
        { numeroContrato: contratoFilter },
      ];
    } else {
      contractQuery.numeroContrato = contratoFilter;
    }
  }

  const contratos = await contratosCol.find(contractQuery).toArray();
  console.log(`Contratos encontrados: ${contratos.length}\n`);

  const stats = {
    contratosProcesados: 0,
    contratosOmitidos: 0,
    contratosSinCambios: 0,
    cuentasActualizadas: 0,
    plazosCorregidos: 0,
  };

  for (const contrato of contratos) {
    const accounts = await cuentasCol
      .find({ contratoId: contrato._id })
      .sort({ numero: 1 })
      .toArray();

    if (accounts.length === 0) continue;

    const locked = accounts.filter((a) => LOCKED_STATUSES.includes(a.estado));
    if (locked.length > 0) {
      stats.contratosOmitidos++;
      console.log(
        `OMITIDO  ${contrato.numeroContrato} (${contrato._id}) — tiene ` +
          `${locked.length} cuenta(s) en ${[...new Set(locked.map((a) => a.estado))].join("/")}`
      );
      continue;
    }

    const current = getCurrentContractSnapshot(contrato);
    const fechaActaInicio = current.fechaActaInicio ?? contrato.fechaActaInicio;
    const fechaFinal = current.fechaFinal ?? contrato.fechaFinal;
    const valorTotal = resolveValorTotal(contrato, current);

    if (!(valorTotal > 0)) {
      stats.contratosOmitidos++;
      console.log(
        `OMITIDO  ${contrato.numeroContrato} (${contrato._id}) — valorTotal inválido (${fmt(valorTotal)})`
      );
      continue;
    }

    // Días por cuenta (primera = índice 0, última = índice final)
    const total = accounts.length;
    const dias = accounts.map((a, i) =>
      getPayableDays(a.periodoInicio, a.periodoFin, i === 0, i === total - 1)
    );
    const totalDias = dias.reduce((sum, d) => sum + d, 0);

    // Plazo real (para display y para el honorario mensual)
    const plazoActual = current.plazoMeses ?? contrato.plazoMeses;
    const plazoNuevo = calculatePlazoMeses(fechaActaInicio, fechaFinal);
    const plazoCambia =
      FIX_PLAZO && plazoNuevo != null && plazoNuevo !== contrato.plazoMeses;

    // El valor usa el plazo corregido (si se corrige plazo); si no, el almacenado.
    const plazoCalc = FIX_PLAZO ? (plazoNuevo ?? plazoActual) : plazoActual;

    // Honorario mensual fijo (÷plazo); la última toma el remanente.
    const nuevos = distributeByMonthly(valorTotal, plazoCalc, dias);

    const cambios = [];
    for (let i = 0; i < accounts.length; i++) {
      const a = accounts[i];
      const nuevaObs = `Cuenta de cobro ${a.numero} de ${total} (${dias[i]} días pagables)`;
      const valorCambia = (a.valor ?? null) !== nuevos[i];
      const obsCambia = (a.observaciones ?? "") !== nuevaObs;
      if (valorCambia || obsCambia) {
        cambios.push({ account: a, dias: dias[i], valor: nuevos[i], obs: nuevaObs });
      }
    }

    if (cambios.length === 0 && !plazoCambia) {
      stats.contratosSinCambios++;
      continue;
    }

    stats.contratosProcesados++;
    console.log(
      `\n${contrato.numeroContrato} (${contrato._id})  valorTotal=$${fmt(valorTotal)}` +
        `  totalDías=${totalDias}` +
        (plazoCambia ? `  plazo ${plazoActual} → ${plazoNuevo}` : "")
    );
    for (let i = 0; i < accounts.length; i++) {
      const a = accounts[i];
      const changed = (a.valor ?? null) !== nuevos[i];
      console.log(
        `   #${a.numero} ${ymd(a.periodoInicio)}→${ymd(a.periodoFin)} ` +
          `${String(dias[i]).padStart(2)}d  ${a.estado.padEnd(12)} ` +
          `$${fmt(a.valor ?? 0)} ${changed ? "→ $" + fmt(nuevos[i]) : "(sin cambio)"}`
      );
    }
    const suma = nuevos.reduce((s, v) => s + v, 0);
    console.log(
      `   Σ nuevo = $${fmt(suma)} ${suma === valorTotal ? "OK" : "!! NO CUADRA"}`
    );

    if (APPLY) {
      for (const c of cambios) {
        await cuentasCol.updateOne(
          { _id: c.account._id },
          {
            $set: {
              valor: c.valor,
              observaciones: c.obs,
              updatedAt: new Date(),
            },
          }
        );
        stats.cuentasActualizadas++;
      }
      if (plazoCambia) {
        await contratosCol.updateOne(
          { _id: contrato._id },
          { $set: { plazoMeses: plazoNuevo, updatedAt: new Date() } }
        );
        stats.plazosCorregidos++;
      }
    } else {
      stats.cuentasActualizadas += cambios.length;
      if (plazoCambia) stats.plazosCorregidos++;
    }
  }

  console.log("\n----------------------------------------");
  console.log(`Contratos con cambios : ${stats.contratosProcesados}`);
  console.log(`Contratos sin cambios : ${stats.contratosSinCambios}`);
  console.log(`Contratos omitidos    : ${stats.contratosOmitidos}`);
  console.log(
    `Cuentas ${APPLY ? "actualizadas" : "a actualizar"} : ${stats.cuentasActualizadas}`
  );
  console.log(
    `Plazos  ${APPLY ? "corregidos" : "a corregir"}   : ${stats.plazosCorregidos}`
  );
  if (!APPLY) {
    console.log("\n(DRY-RUN) Ejecuta con --apply para guardar los cambios.");
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
