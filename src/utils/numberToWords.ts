const UNITS = [
  "CERO",
  "UNO",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
];
const TEENS = [
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISEIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
];
const TENS = [
  "",
  "",
  "VEINTE",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];
const HUNDREDS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

function twoDigits(value: number): string {
  if (value === 0) return "";
  if (value < 10) return UNITS[value];
  if (value < 20) return TEENS[value - 10];
  const ten = Math.floor(value / 10);
  const unit = value % 10;
  if (ten === 2 && unit > 0) return `VEINTI${UNITS[unit]}`;
  return unit > 0 ? `${TENS[ten]} Y ${UNITS[unit]}` : TENS[ten];
}

function threeDigits(value: number): string {
  if (value === 0) return "";
  if (value === 100) return "CIEN";
  const hundred = Math.floor(value / 100);
  const rest = value % 100;
  const hundredPart = hundred > 0 ? HUNDREDS[hundred] : "";
  const restPart = twoDigits(rest);
  return [hundredPart, restPart].filter(Boolean).join(" ");
}

function section(value: number, singular: string, plural: string) {
  if (value === 0) return "";
  if (value === 1) return singular;
  return `${threeDigits(value)} ${plural}`;
}

function integerToWords(value: number): string {
  if (value === 0) return "CERO";
  if (value < 0) return `MENOS ${integerToWords(Math.abs(value))}`;

  const millions = Math.floor(value / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1_000);
  const rest = value % 1_000;

  const parts = [
    section(millions, "UN MILLON", "MILLONES"),
    section(thousands, "MIL", "MIL"),
    threeDigits(rest),
  ].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Convierte un valor entero en pesos colombianos a letras (M/L). */
export function formatCurrencyInWords(value: number): string {
  const amount = Math.round(Math.max(0, value));
  return `${integerToWords(amount)} PESOS M/L`;
}
