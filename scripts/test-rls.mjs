/**
 * Lance `supabase/tests/rls.sql` contre la base liée et rend un compte-rendu
 * lisible.
 *
 * Le fichier SQL se termine par une exception délibérée : c'est elle qui
 * annule la transaction, fixtures comprises, et qui transporte le résultat.
 * L'échec de la commande est donc le fonctionnement normal — ce script ne
 * regarde pas le code de sortie de la CLI, il lit le message.
 */
import { execFileSync } from "node:child_process";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const OFF = "\x1b[0m";

let output = "";
try {
  output = execFileSync(
    "npx",
    ["--yes", "supabase@latest", "db", "query", "--linked", "--file", "supabase/tests/rls.sql"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (error) {
  // Attendu : la CLI signale l'exception finale.
  output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
}

// Le message voyage échappé dans du JSON ; on récupère les lignes de verdict.
const lines = output
  .replace(/\\n/g, "\n")
  .split("\n")
  // Les antislashs résiduels viennent de l'échappement JSON du message.
  .map((line) => line.trim().replace(/\\+$/, "").trim())
  .filter((line) => /^(OK|KO) · /.test(line));

if (!lines.length) {
  console.error(`${RED}Aucun verdict lisible. Sortie brute :${OFF}\n${output}`);
  process.exit(2);
}

console.log(`\n${DIM}Autorisations — ${lines.length} vérifications${OFF}\n`);

let echecs = 0;
for (const line of lines) {
  const passed = line.startsWith("OK");
  if (!passed) echecs += 1;
  const mark = passed ? `${GREEN}✓${OFF}` : `${RED}✗${OFF}`;
  console.log(`  ${mark} ${line.slice(5)}`);
}

if (echecs) {
  console.log(`\n${RED}${echecs} échec(s) sur ${lines.length}.${OFF}\n`);
  process.exit(1);
}

console.log(`\n${GREEN}Les ${lines.length} vérifications passent.${OFF} ${DIM}Rien n'a été laissé en base.${OFF}\n`);
