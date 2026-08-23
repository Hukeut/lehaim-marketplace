#!/usr/bin/env node
import { globSync, readFileSync } from "node:fs";

const LOCALES = ["fr", "en", "es", "he", "ru"];
const SOURCE = "fr";

/** Aplatit { a: { b: "x" } } en ["a.b"]. */
function keysOf(object, prefix = "") {
  return Object.entries(object).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object" ? keysOf(value, path) : [path];
  });
}

function load(locale) {
  return JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
}

const source = new Set(keysOf(load(SOURCE)));
let failed = false;

for (const locale of LOCALES.filter((l) => l !== SOURCE)) {
  const keys = new Set(keysOf(load(locale)));
  const missing = [...source].filter((k) => !keys.has(k));
  const orphan = [...keys].filter((k) => !source.has(k));

  if (missing.length) {
    failed = true;
    console.error(`\n✗ ${locale} — ${missing.length} clé(s) manquante(s) :`);
    for (const key of missing) console.error(`    ${key}`);
  }
  if (orphan.length) {
    failed = true;
    console.error(`\n✗ ${locale} — ${orphan.length} clé(s) orpheline(s), absente(s) du français :`);
    for (const key of orphan) console.error(`    ${key}`);
  }
}

/**
 * Les cinq langues peuvent être parfaitement cohérentes et pourtant fausses :
 * il suffit qu'une clé appelée par un écran n'existe dans aucune d'elles.
 * next-intl affiche alors le chemin brut — « auth.login » est resté sur le
 * bouton principal de l'écran de connexion jusqu'au 21 août 2026.
 *
 * On ne vérifie que les fichiers qui n'ouvrent qu'un seul espace de noms :
 * ailleurs, on ne peut pas savoir à quel `t` appartient un appel.
 */
const used = [];
for (const file of globSync("{app,components,lib}/**/*.{ts,tsx}")) {
  const code = readFileSync(file, "utf8");
  const spaces = [...code.matchAll(/(?:useTranslations|getTranslations)\(\s*"([^"]+)"/g)];
  if (spaces.length !== 1) continue;
  for (const call of code.matchAll(/\bt\(\s*"([^"]+)"/g)) {
    const key = `${spaces[0][1]}.${call[1]}`;
    if (!source.has(key)) used.push(`${file} → ${key}`);
  }
}

const unknown = [...new Set(used)];
if (unknown.length) {
  failed = true;
  console.error(`\n✗ ${unknown.length} clé(s) appelée(s) par l'app mais absente(s) du français :`);
  for (const line of unknown) console.error(`    ${line}`);
}

if (failed) {
  console.error("\nTraductions incomplètes. Lancer `npm run i18n:missing`.\n");
  process.exit(1);
}

console.log(
  `✓ ${source.size} clés, cohérentes sur ${LOCALES.length} langues, toutes celles appelées existent.`,
);
