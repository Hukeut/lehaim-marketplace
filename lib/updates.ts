import journal from "./updates.generated.json";

/**
 * Journal des mises à jour, figé à la construction par
 * `scripts/build-updates.mjs`.
 *
 * Ce que ce journal dit exactement : ce qui est en ligne. Il est capturé au
 * moment où le site est construit, donc le commit en tête est celui qui
 * tourne — pas le dernier que quelqu'un a écrit quelque part.
 *
 * Ce qu'il ne dit pas : les pushes eux-mêmes. Git ne les enregistre pas, on ne
 * connaît que les commits. Deux commits poussés ensemble apparaissent donc
 * comme deux entrées, ce qui est de toute façon plus lisible.
 */
export type Update = {
  sha: string;
  date: string;
  author: string;
  /** Ce qui a changé, en une phrase. */
  subject: string;
  /** Le pourquoi, quand il a été écrit. Vide sinon. */
  body: string;
};

export type UpdateDay = {
  /** Clé ISO du jour, pour React. */
  key: string;
  label: string;
  updates: Update[];
};

export type Journal = {
  /** Date de construction, donc de mise en ligne de ce qui suit. */
  builtAt: string;
  branch: string | null;
  /** Vrai quand l'historique n'a pas pu être lu en entier. */
  truncated: boolean;
  days: UpdateDay[];
  total: number;
};

const dayLabel = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Regroupe par jour. Les commits arrivent déjà du plus récent au plus ancien,
 * l'ordre des groupes suit.
 */
export function readJournal(): Journal {
  const days: UpdateDay[] = [];

  for (const update of journal.commits as Update[]) {
    const key = update.date.slice(0, 10);
    const last = days.at(-1);

    if (last?.key === key) {
      last.updates.push(update);
    } else {
      days.push({
        key,
        label: dayLabel.format(new Date(update.date)),
        updates: [update],
      });
    }
  }

  return {
    builtAt: journal.builtAt,
    branch: journal.branch,
    truncated: journal.truncated,
    days,
    total: journal.commits.length,
  };
}

/**
 * Étiquette de famille, déduite du sujet. Les messages de ce dépôt suivent
 * quelques préfixes (`Fix:`, `i18n:`, `Docs:`) ; le reste décrit un effet
 * visible, ce qu'on présente comme une évolution.
 */
export function updateKind(subject: string): { key: string; label: string } {
  const prefix = subject.split(":")[0].toLowerCase();

  if (prefix === "fix") return { key: "fix", label: "Correction" };
  if (prefix === "i18n") return { key: "i18n", label: "Traductions" };
  if (prefix === "docs" || prefix === "doc") return { key: "docs", label: "Documentation" };
  if (prefix === "feat") return { key: "feat", label: "Nouveauté" };
  if (subject.startsWith("Migrations") || subject.startsWith("Migration")) {
    return { key: "db", label: "Base de données" };
  }
  return { key: "change", label: "Évolution" };
}

/** Le sujet sans son préfixe technique, qui n'apprend rien de plus. */
export function updateTitle(subject: string): string {
  return subject.replace(/^(fix|i18n|docs?|feat|chore|refactor)\s*:\s*/i, "");
}
