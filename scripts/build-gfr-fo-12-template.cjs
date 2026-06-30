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

// Las celdas de datos en 01.docx usan Arial 8pt (sz=16). Hay que conservar ese
// tamaño y la alineación; si se omiten, el texto se renderiza a 11pt (default)
// y los números de dos dígitos se parten en la columna estrecha, además de
// inflar la altura de la tabla (provoca una página extra vacía).
function replaceCellText(cellXml, text, align = "both") {
  const rpr =
    `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>` +
    `<w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>`;
  // Conservar <w:tcPr> (bordes, sombreado, ancho) y reemplazar solo el contenido.
  return cellXml.replace(
    /(<w:tc>(?:<w:tcPr>[\s\S]*?<\/w:tcPr>)?)([\s\S]*?)(<\/w:tc>)/,
    (_, open, _body, close) =>
      `${open}<w:p><w:pPr><w:spacing w:after="0"/><w:jc w:val="${align}"/>${rpr}</w:pPr>` +
      `<w:r>${rpr}<w:t xml:space="preserve">${text}</w:t></w:r></w:p>${close}`
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
  // Centrar número, columnas de pago y entrega; justificar descripción y nota.
  const alignments = ["center", "both", "center", "center", "center", "center", "both", "center"];

  if (cells.length !== placeholders.length) {
    throw new Error(
      `Se esperaban ${placeholders.length} celdas en la fila plantilla, hay ${cells.length}`
    );
  }

  let updated = rowXml;
  for (let index = 0; index < placeholders.length; index++) {
    updated = updated.replace(
      cells[index],
      replaceCellText(cells[index], placeholders[index], alignments[index])
    );
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

// Parada de tabulación que separa la columna del contratista (izquierda)
// de la del supervisor (derecha). ~4500 twips ≈ centro de la página.
const SUPERVISOR_TAB_TWIPS = 4500;

// Mantener el bloque de firmas compacto como en la plantilla original
// (01.docx usa spacing after=0). Sin esto se hereda el docDefault
// (after=200, line=276) y aparecen saltos de línea de más.
function buildParaPr() {
  return (
    `<w:pPr>` +
    `<w:spacing w:after="0" w:line="240" w:lineRule="auto"/>` +
    `<w:tabs><w:tab w:val="left" w:pos="${SUPERVISOR_TAB_TWIPS}"/></w:tabs>` +
    `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
    `</w:pPr>`
  );
}

function replaceParagraphByParaId(xml, paraId, runsXml) {
  const pattern = new RegExp(
    `<w:p [^>]*w14:paraId="${paraId}"[\\s\\S]*?</w:p>`
  );
  return xml.replace(
    pattern,
    `<w:p w14:paraId="${paraId}">${buildParaPr()}${runsXml}</w:p>`
  );
}

function buildRun(text, bold = false) {
  const boldXml = bold ? "<w:b/><w:bCs/>" : "";
  return `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${boldXml}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

function buildTab() {
  return `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr><w:tab/></w:r>`;
}

xml = replaceParagraphByParaId(
  xml,
  "1C3D56D3",
  `${buildRun("{%contratistaFirma}")}${buildTab()}${buildRun("{%supervisorFirma}")}`
);
xml = replaceParagraphByParaId(
  xml,
  "3F3A39B6",
  `${buildRun("NOMBRE: {contratistaNombre}", true)}${buildTab()}${buildRun("NOMBRE: {supervisorNombre}", true)}`
);
xml = replaceParagraphByParaId(
  xml,
  "4425A44D",
  `${buildRun("CÉDULA: {contratistaCedula}", true)}${buildTab()}${buildRun("CÉDULA: {supervisorCedula}", true)}`
);
xml = replaceParagraphByParaId(
  xml,
  "1275CBD9",
  `${buildRun("FIRMA", true)}${buildTab()}${buildRun("FIRMA", true)}`
);
xml = replaceParagraphByParaId(
  xml,
  "2F6537FC",
  `${buildRun("Prestador de Servicios")}${buildTab()}${buildRun("Supervisor")}`
);

zip.file("word/document.xml", xml);
fs.writeFileSync(target, zip.generate({ type: "nodebuffer" }));
console.log("Template written to", target);
