/**
 * Genera public/templates/gfr-fo-12-template.docx desde public/forms/01.docx.
 * Ejecutar tras actualizar la plantilla fuente:
 *   node scripts/build-gfr-fo-12-template.cjs
 */
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const source = path.join(process.cwd(), "public/forms/01.docx");
const target = path.join(process.cwd(), "public/templates/gfr-fo-12-template.docx");

function replaceCellText(cellXml, text) {
  // Conservar <w:tcPr> (bordes, sombreado, ancho) y reemplazar solo el contenido.
  return cellXml.replace(
    /(<w:tc>(?:<w:tcPr>[\s\S]*?<\/w:tcPr>)?)([\s\S]*?)(<\/w:tc>)/,
    (_, open, _body, close) =>
      `${open}<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>${close}`
  );
}

function buildTemplateDataRow(rowXml) {
  const cellPattern = /<w:tc(?:>|[\s\S]*?<\/w:tcPr>)[\s\S]*?<\/w:tc>/g;
  const cells = rowXml.match(cellPattern) ?? [];
  const placeholders = [
    "{#filas}{numero}",
    "{descripcion}",
    "{pago1}",
    "{pago2}",
    "{pagoUltimo}",
    "{pagoUnico}",
    "{nota}",
    "{entrega}{/filas}",
  ];

  if (cells.length !== placeholders.length) {
    throw new Error(
      `Se esperaban ${placeholders.length} celdas en la fila plantilla, hay ${cells.length}`
    );
  }

  let updated = rowXml;
  for (let index = 0; index < placeholders.length; index++) {
    updated = updated.replace(cells[index], replaceCellText(cells[index], placeholders[index]));
  }

  return updated;
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);

const zip = new PizZip(fs.readFileSync(target));
let xml = zip.file("word/document.xml").asText();

const tableMatch = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/);
if (!tableMatch) {
  throw new Error("No se encontró tabla en 01.docx");
}

const tableXml = tableMatch[0];
const rows = tableXml.match(/<w:tr[\s\S]*?<\/w:tr>/g) ?? [];
if (rows.length < 19) {
  throw new Error(`Se esperaban al menos 19 filas en la tabla, hay ${rows.length}`);
}

const headerRow = rows[0];
const templateRow = buildTemplateDataRow(rows[1]);
const newTableXml = `<w:tbl>${tableXml.match(/<w:tblPr[\s\S]*?<\/w:tblGrid>/)[0]}${headerRow}${templateRow}</w:tbl>`;
xml = xml.replace(tableMatch[0], newTableXml);

function replaceParagraphByParaId(xml, paraId, runsXml) {
  const pattern = new RegExp(
    `<w:p [^>]*w14:paraId="${paraId}"[\\s\\S]*?</w:p>`
  );
  return xml.replace(
    pattern,
    `<w:p w14:paraId="${paraId}"><w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr></w:pPr>${runsXml}</w:p>`
  );
}

function buildRun(text) {
  return `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

xml = replaceParagraphByParaId(
  xml,
  "1C3D56D3",
  `${buildRun("{%contratistaFirma}")}${buildRun("    ")}${buildRun("{%supervisorFirma}")}`
);
xml = replaceParagraphByParaId(
  xml,
  "3F3A39B6",
  `${buildRun("NOMBRE: {contratistaNombre}")}${buildRun("    NOMBRE: {supervisorNombre}")}`
);
xml = replaceParagraphByParaId(
  xml,
  "4425A44D",
  `${buildRun("CÉDULA: {contratistaCedula}")}${buildRun("    CÉDULA: {supervisorCedula}")}`
);

zip.file("word/document.xml", xml);
fs.writeFileSync(target, zip.generate({ type: "nodebuffer" }));
console.log("Template written to", target);
