const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const source = path.join(process.cwd(), "public/forms/4.docx");
const target = path.join(process.cwd(), "public/templates/gth-fo-52-template.docx");

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);

const zip = new PizZip(fs.readFileSync(target));
let xml = zip.file("word/document.xml").asText();

const replacements = [
  [
    "Período de la Comisión: [Espacio para indicar si es del 1 al 15 o del 16 al 30]",
    "Período de la Comisión: {periodoComision}",
  ],
  [
    "<w:t>Ejemplo: n</w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t>00094</w:t>",
    "<w:t>{id}</w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t xml:space=\"preserve\"> </w:t>",
  ],
  [
    "<w:t xml:space=\"preserve\">Ejemplo: </w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t>AVANZADA</w:t>",
    "<w:t>{numeroContrato}</w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t xml:space=\"preserve\"> </w:t>",
  ],
  [
    "<w:t xml:space=\"preserve\">Ejemplo: </w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t>SAN VICENTE FERRER</w:t>",
    "<w:t>{destino}</w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t xml:space=\"preserve\"> </w:t>",
  ],
  [
    "<w:t xml:space=\"preserve\">Ejemplo: </w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t>02/08/2023</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"1189\"",
    "<w:t>{fechaSalida}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"1189\"",
  ],
  [
    "<w:t xml:space=\"preserve\">Ejemplo: </w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t>02/08/2023</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"1221\"",
    "<w:t>{fechaRegreso}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"1221\"",
  ],
  ["<w:t>Ejemplo: No</w:t>", "<w:t>{pernocta}</w:t>"],
  [
    "<w:t xml:space=\"preserve\">Ejemplo: </w:t></w:r><w:r w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\"><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t>N</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t>inguna</w:t>",
    "<w:t>{novedad}</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"es-CO\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:t xml:space=\"preserve\"> </w:t>",
  ],
  ["<w:t>Ejemplo: Si</w:t>", "<w:t>{cumplida}</w:t>"],
];

for (const [from, to] of replacements) {
  if (!xml.includes(from)) {
    console.warn("Missing pattern:", from.slice(0, 60));
  } else {
    xml = xml.replace(from, to);
  }
}

// Loop markers around first encargo data row
xml = xml.replace(
  "<w:tr w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\" w14:paraId=\"27270C88\"",
  "<w:tr w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\" w14:paraId=\"27270C88\"{#encargos}"
);
xml = xml.replace(
  "<w:tr w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\" w14:paraId=\"728C7424\"",
  "{/encargos}<w:tr w:rsidR=\"00067933\" w:rsidRPr=\"00E871BB\" w14:paraId=\"728C7424\""
);

// Header placeholders in first table
xml = xml.replace(
  "<w:p w14:paraId=\"35464BD9\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:b/></w:rPr></w:pPr></w:p>",
  "<w:p w14:paraId=\"35464BD9\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:b/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr><w:t>{contratistaNombre}</w:t></w:r></w:p>"
);
xml = xml.replace(
  "<w:p w14:paraId=\"64D88F0F\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:b/></w:rPr></w:pPr></w:p>",
  "<w:p w14:paraId=\"64D88F0F\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:b/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr><w:t>CONTRATISTA</w:t></w:r></w:p>"
);
xml = xml.replace(
  "<w:p w14:paraId=\"62F51A5F\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:b/></w:rPr></w:pPr></w:p>",
  "<w:p w14:paraId=\"62F51A5F\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:b/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr><w:t>{fechaComision}</w:t></w:r></w:p>"
);

// Cumplimiento / observaciones text areas
xml = xml.replace(
  "<w:p w14:paraId=\"78532F63\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr></w:pPr></w:p>",
  "<w:p w14:paraId=\"78532F63\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr><w:t>{cumplimientoObjetivos}</w:t></w:r></w:p>"
);
xml = xml.replace(
  "<w:p w14:paraId=\"4B0318F1\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr></w:pPr></w:p>",
  "<w:p w14:paraId=\"4B0318F1\" w14:textId=\"77777777\" w:rsidR=\"00E871BB\" w:rsidRDefault=\"00E871BB\" w:rsidP=\"00067933\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/></w:rPr><w:t>{observaciones}</w:t></w:r></w:p>"
);

zip.file("word/document.xml", xml);
fs.writeFileSync(target, zip.generate({ type: "nodebuffer" }));
console.log("Template written to", target);
