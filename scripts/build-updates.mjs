/**
 * Fige l'historique git dans un fichier que l'app peut lire à l'exécution.
 *
 * Pourquoi passer par un fichier : sur Vercel, le dépôt n'existe plus au
 * moment où une page est rendue — il n'y a qu'un bundle. L'historique doit
 * donc être capturé pendant la construction, qui est le seul instant où l'on
 * dispose à la fois du code et de son passé.
 *
 * Conséquence utile : le fichier décrit exactement ce qui est en ligne. Le
 * commit en tête est, par construction, celui qui tourne.
 *
 * Lancé par `prebuild` et `predev` (voir package.json), et par l'étape
 * « Journal des mises à jour » de la CI, avant le typecheck.
 *
 * Le résultat n'est pas versionné : il contient l'historique jusqu'au dernier
 * commit, donc le versionner obligerait à le recommitter après chaque commit,
 * indéfiniment. Sur un clone neuf, `npm run dev`, `npm run build` ou
 * `npm run updates` le fabriquent.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "updates.generated.json");

/** Assez pour plusieurs mois de journal, sans alourdir le bundle. */
const DEPTH = 120;

// Séparateurs non imprimables : un sujet ou un corps de commit peut contenir
// n'importe quel caractère de ponctuation, mais pas ceux-là.
const FIELD = "\x1f";
const RECORD = "\x1e";

function gitLog() {
  const format = ["%H", "%aI", "%an", "%s", "%b"].join(FIELD) + RECORD;
  const raw = execFileSync("git", ["log", `-n${DEPTH}`, `--format=${format}`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  return raw
    .split(RECORD)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [sha, date, author, subject, body] = entry.split(FIELD);
      return {
        sha: sha.slice(0, 7),
        date,
        author,
        subject,
        // Le corps porte l'explication détaillée quand il y en a une. On retire
        // les lignes de co-signature, qui n'apprennent rien à un lecteur.
        body: (body ?? "")
          .split("\n")
          .filter((line) => !/^Co-Authored-By:/i.test(line.trim()))
          .join("\n")
          .trim(),
      };
    });
}

function currentBranch() {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

let payload;

try {
  payload = {
    // Date de construction, donc date de mise en ligne de ce qui suit.
    builtAt: new Date().toISOString(),
    branch: currentBranch(),
    truncated: false,
    commits: gitLog(),
  };
  // `actions/checkout` clone à profondeur 1 par défaut : si on ne récupère
  // qu'un commit alors qu'on en demandait 120, c'est presque sûrement ça.
  // On le signale à l'écran plutôt que de faire croire à un projet neuf.
  payload.truncated = payload.commits.length <= 1;
} catch {
  // Pas de dépôt git : une archive téléchargée, un environnement de
  // construction sans historique. Ce n'est pas une raison de faire échouer la
  // construction — la page sait afficher un journal vide.
  payload = { builtAt: new Date().toISOString(), branch: null, truncated: true, commits: [] };
}

const next = JSON.stringify(payload, null, 2) + "\n";

// On ne réécrit que si le contenu change, à la date de construction près :
// sans ça, chaque `npm run dev` salirait l'arbre de travail.
let previous = null;
try {
  previous = JSON.parse(readFileSync(OUT, "utf8"));
} catch {
  previous = null;
}

const sameHistory =
  previous &&
  previous.branch === payload.branch &&
  JSON.stringify(previous.commits) === JSON.stringify(payload.commits);

if (!sameHistory) {
  writeFileSync(OUT, next);
  console.log(`updates: ${payload.commits.length} entrées écrites dans lib/updates.generated.json`);
} else {
  console.log("updates: historique inchangé");
}
