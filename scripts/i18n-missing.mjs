#!/usr/bin/env node
import { readFileSync } from "node:fs";

const LOCALES = ["fr", "en", "es", "he", "ru"];
const SOURCE = "fr";

function entriesOf(object, prefix = "") {
  return Object.entries(object).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object"
      ? entriesOf(value, path)
      : [[path, value]];
  });
}

function load(locale) {
  return JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
}

const source = entriesOf(load(SOURCE));

for (const locale of LOCALES.filter((l) => l !== SOURCE)) {
  const present = new Set(entriesOf(load(locale)).map(([k]) => k));
  const todo = source.filter(([key]) => !present.has(key));
  if (!todo.length) continue;

  console.log(`\n=== ${locale} — ${todo.length} à traduire ===`);
  for (const [key, value] of todo) console.log(`${key}\t${value}`);
}
