const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "index.html");

function fail(message) {
  console.error(`ERRO: ${message}`);
  process.exit(1);
}

function applyPatch(oldText, newText) {
  if (!oldText) {
    fail("O trecho antigo está vazio.");
  }

  const source = fs.readFileSync(file, "utf8");
  const occurrences = source.split(oldText).length - 1;

  if (occurrences === 0) {
    fail("O trecho antigo não foi encontrado.");
  }

  if (occurrences > 1) {
    fail(
      `O trecho antigo aparece ${occurrences} vezes. ` +
      "Patch cancelado para evitar alteração no lugar errado."
    );
  }

  const updated = source.replace(oldText, newText);

  if (!updated.startsWith("<!DOCTYPE html>")) {
    fail("O arquivo resultante não parece ser um HTML válido.");
  }

  if (updated === source) {
    fail("Nenhuma alteração foi realizada.");
  }

  const backup = `${file}.backup`;

  fs.writeFileSync(backup, source, "utf8");
  fs.writeFileSync(file, updated, "utf8");

  console.log("Patch aplicado com sucesso.");
  console.log(`Backup criado: ${backup}`);
}

const oldText = process.env.PATCH_OLD;
const newText = process.env.PATCH_NEW;

if (!oldText || !newText) {
  console.log(`
Uso:

PATCH_OLD="trecho antigo" PATCH_NEW="trecho novo" node tools/patch-index.js

O patch só será aplicado se o trecho antigo aparecer exatamente uma vez.
`);
  process.exit(0);
}

applyPatch(oldText, newText);
