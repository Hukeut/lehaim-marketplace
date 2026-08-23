#!/usr/bin/env node
/**
 * Détecteur de texte écrit en dur — PAS un parseur AST, un ensemble de
 * règles regex volontairement lisibles. Quatre surfaces couvertes :
 *
 *  1. Texte JSX visible : `>Bonjour<` entre deux balises, dans les .tsx de
 *     `app/` et `components/`. Détecté sur le **contenu entier du fichier**,
 *     pas ligne par ligne (cf. correctif ci-dessous) — le texte peut donc
 *     être à cheval sur plusieurs lignes physiques, ce qui est le
 *     formatage le plus courant de ce dépôt :
 *       <p className="...">
 *         Texte en français
 *       </p>
 *     Une première version de ce script ne cherchait `>texte<` que sur une
 *     seule ligne et ratait systématiquement ce motif — un écran entier
 *     pouvait rester en français sans jamais déclencher le scan. Corrigé
 *     (revue post-Task 6) : voir le bloc « Surface 1 » plus bas pour le
 *     détail des garde-fous anti-faux-positifs qui accompagnent ce
 *     changement.
 *  2. Attributs porteurs de texte, sur la liste explicite ci-dessous
 *     (TEXT_ATTRS), dans les mêmes .tsx : `placeholder="…"`, `label="…"`,
 *     etc. Seules les valeurs *littérales entre guillemets* comptent ; une
 *     valeur dynamique (`label={x}`) est ignorée par construction, une regex
 *     ne l'attrapera jamais et ce n'est pas son rôle. Une valeur en template
 *     string (`` aria-label={`Étape ${n}`} ``) n'est pas couverte non plus :
 *     angle mort assumé, distinct de celui du point 1 — cf. StepDots.tsx,
 *     trouvé par relecture humaine, pas par ce script. Pas de correctif ici
 *     volontairement : un template literal est par nature partiellement
 *     dynamique, l'élargir en faux positifs sur des `className` calculées
 *     coûterait plus cher que ce que ça rapporterait. Ligne à surveiller
 *     manuellement.
 *  3. Littéraux de chaîne « en langue naturelle » dans les .ts de `lib/`
 *     (catalogues de données, messages, libellés) — PAS les .tsx de `lib/`
 *     (aucun aujourd'hui n'a de contenu à traduire ; à surveiller si ça
 *     change), et pas `lib/demo.ts` (données de démonstration, cf. SKIP
 *     ci-dessous). Un littéral est retenu s'il contient un mot accentué de
 *     3 lettres ou plus, un mot grammatical français courant (article,
 *     préposition, pronom — cf. STOPWORDS), ou au moins deux mots
 *     alphabétiques distincts (signal d'une phrase plutôt que d'un
 *     identifiant). Il est écarté d'office s'il contient un `_` (colonne
 *     Supabase de type `role_name`) ou un `/` (chemin, route), ou s'il est
 *     un code de langue exact (fr/en/es/he/ru). Ça ne suffit pas toujours :
 *     une liste de colonnes sans underscore, du genre `.select("id, name,
 *     quantity, done")`, ressemble à s'y méprendre à une phrase de plusieurs
 *     mots — ces cas-là passent par l'échappatoire `i18n-ignore` (cf.
 *     lib/data.ts et lib/missions.ts) plutôt que par une règle générale, qui
 *     élargirait l'angle mort au lieu de le réduire.
 *  4. Littéraux « en langue naturelle » dans les .tsx de `app/` et
 *     `components/`, mais seulement à des **positions syntaxiques précises**
 *     où un littéral partiellement dynamique est structurellement probable —
 *     PAS une recherche brute sur tout littéral du fichier, ce qui exploserait
 *     sur les classes Tailwind (`const field = "rounded-field bg-white px-4
 *     …"` est un multi-mots parfaitement légitime pour `looksLikeNaturalLanguage`,
 *     rien dans sa forme ne le distingue syntaxiquement d'une vraie phrase).
 *     Trois positions ciblées, cf. « Surface 4 » plus bas :
 *       - les deux branches d'un ternaire (`cond ? "A" : "B"`), le cas de
 *         `SignOutButton.tsx`, `CopyLink.tsx` (bouton copier) et
 *         `mission/[mid]/modifier/page.tsx` (titre) ;
 *       - un repli `?? "…"` (nullish coalescing), le cas de
 *         `JoinButton.tsx` ;
 *       - un template literal contenant au moins une interpolation `${…}`
 *         (donc partiellement dynamique, sinon surface 2 l'aurait déjà vu
 *         s'il était en position d'attribut), le cas de `StepDots.tsx` et
 *         `app/shabbat/[id]/invites/page.tsx`. Les segments `${…}` sont
 *         retirés avant le test de langue naturelle : seul le texte statique
 *         autour compte.
 *     Angle mort qui SUBSISTE après cette surface, assumé faute de mieux
 *     sans vrai parseur : une valeur par défaut de paramètre détruturé
 *     (`{ label = "Partager sur WhatsApp" }`) est syntaxiquement identique à
 *     une constante Tailwind (`const field = "rounded-field bg-white …"`) —
 *     même `identifiant = "littéral"`, avec espaces des deux côtés du `=`
 *     dans les deux cas. Aucune règle testée ici ne les distingue sans faire
 *     exploser les faux positifs sur les dizaines de constantes de classes
 *     de ce dépôt ; on ne l'a donc pas ajoutée. Trouvé sur `CopyLink.tsx`
 *     par relecture humaine — reste un point à surveiller manuellement,
 *     comme les libellés courts sans accent de la surface 3.
 *
 * Ce que cette dernière règle NE garantit PAS : un mot français isolé sans
 * accent et sans article ne sera pas détecté (« Casher », « Chef », « 2
 * bouteilles »). C'est un choix délibéré — élargir la règle pour les
 * attraper ferait remonter des dizaines de colonnes Supabase et de clés
 * d'énumération en faux positifs. Un scan vert sur ce script ne certifie
 * donc pas l'absence totale de texte en dur dans lib/, seulement l'absence
 * de motifs reconnaissables par ces quatre règles. La relecture humaine
 * reste nécessaire pour les libellés courts non accentués, pour les valeurs
 * par défaut de paramètre (cf. surface 4 ci-dessus), et plus généralement
 * pour tout littéral qui ne tombe dans aucune des positions syntaxiques
 * couvertes ici (ex. une propriété d'objet littéral hors ternaire, du genre
 * `{ errorMessage: "Une erreur est survenue" }`, n'est vue par aucune des
 * quatre surfaces). Un scan vert ne certifie que l'absence des motifs que
 * ces règles savent reconnaître, pas l'absence totale de texte en dur. La
 * relecture humaine reste le dernier filet — c'est elle qui a trouvé le cas
 * de `CopyLink.tsx` ci-dessus, pas ce script.
 *
 * Échappatoire : un commentaire contenant `i18n-ignore`, sur la ligne
 * concernée ou sur celle juste au-dessus, désarme la détection pour cette
 * ligne — sur les quatre surfaces. Pour un texte JSX multi-lignes, poser le
 * commentaire sur la ligne d'ouverture (celle qui porte le `>`) ou sur la
 * ligne de fermeture (celle qui porte le `<`) fonctionne dans les deux cas —
 * cf. « ignoredLineSet » et son usage pour la surface 1. Utile pour les
 * faux positifs de syntaxe (un `>` qui n'est pas une fin de balise JSX mais
 * un opérateur de comparaison, une flèche `=>`, un générique TypeScript)
 * qu'aucune regex plus fine ne peut éliminer sans créer de nouveaux angles
 * morts ailleurs.
 *
 * Hors périmètre, assumé : les littéraux multi-lignes dans lib/ (template
 * string s'étalant sur plusieurs lignes) ne sont pas supportés — cette
 * surface (3) reste ligne par ligne. Aucun cas de ce genre dans lib/
 * aujourd'hui. Les surfaces 1 et 4 (JSX et expressions .tsx) sont
 * multi-lignes, parce que c'est là qu'étaient les vrais motifs manqués.
 *
 * Deux exclusions ciblées, ajoutées après coup (Task 5) :
 *  - Identifiant pointé (`"frequency.weekly.label"`) : une clé de traduction
 *    de ce type se lit comme trois mots une fois `\p{L}` découpé sur le
 *    point, et déclenchait `isMultiWordPhrase`. Or une vraie phrase
 *    française met toujours une espace après le point (« On y va. Prêt ? »),
 *    jamais un point collé au mot suivant. Un littéral **entièrement** de la
 *    forme segment.segment[.segment…], sans le moindre espace sur toute sa
 *    longueur, est donc structurellement un identifiant, jamais de la prose
 *    — testable sans dictionnaire, contrairement au cas « Casher » resté un
 *    angle mort assumé plus haut.
 *  - Code court tout en majuscules (`"IL"`, code pays) : il ne doit pas
 *    matcher `STOPWORDS` sous prétexte que `"il"` (le pronom) y figure. La
 *    comparaison des mots contre `STOPWORDS` se fait en minuscules à dessein
 *    (pour attraper « Il » en tête de phrase), donc le correctif porte sur
 *    le littéral entier, pas sur la casse de cette comparaison : un littéral
 *    de 2 à 3 lettres qui est déjà tout en majuscules est un code
 *    (pays/langue), jamais un mot de prose isolé.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components"];
const LIB_ROOT = "lib";
const SKIP = [
  // Écrans de revue interne, non traduits volontairement.
  /\/legacy\//,
  /\/ecrans\//,
  /\/etats\//,
  // Jeu de données de démonstration (noms, e-mails, plats fictifs — « Noa
  // Amsalem », « noa.a@email.com », « Côtes braisées »…) : ce sont des
  // données d'exemple pour peupler l'UI avant le branchement de Supabase,
  // pas du texte d'interface. Les traduire n'aurait aucun sens. À ne pas
  // confondre avec lib/data.ts ou lib/missions.ts, qui définissent de vrais
  // libellés affichés (ex. "Invité" en repli de nom) et restent scannés.
  /\/demo\.ts$/,
];

// Texte visible entre deux balises : >Bonjour< ou, à cheval sur plusieurs
// lignes, >\n  Bonjour\n< — mais pas >{name}< ni >  <. La classe [^<>{}]
// matche déjà les retours à la ligne (une classe de caractères négative
// n'exclut que ce qu'on lui donne), donc le seul changement nécessaire pour
// couvrir le multi-lignes était de chercher sur le contenu entier du
// fichier plutôt que ligne par ligne — cf. plus bas, "Surface 1".
//
// Ce qui empêche cette regex d'exploser en faux positifs sur du code (un
// opérateur `>` suivi, des lignes plus loin, d'un `<` sans rapport) :
//  - les accolades `{` `}` sont exclues de la classe, donc tout bloc, tout
//    littéral d'objet, tout `{expr}` JSX interrompt déjà le match — et ils
//    sont partout dans ce code React/TypeScript ;
//  - le `>` qui ouvre un segment ne doit être ni celui d'une flèche `=>`
//    (arrow function : `.map((tab) => [...])` ouvrait de faux segments
//    jusqu'au prochain générique TypeScript, ex. `as Record<...>`, avant ce
//    correctif) ni celui d'une balise auto-fermante `/>` (un `<EmptyState
//    ... />` suivi de JS de ternaire ouvrait de même un faux segment
//    jusqu'à la balise suivante) — cf. le lookbehind négatif ci-dessous ;
//  - le `<` qui ferme un segment ne doit pas être celui d'un opérateur
//    `<=` ;
//  - les commentaires (`// …` et `/* … */`, y compris `{/* … */}` en JSX)
//    sont neutralisés avant le scan (même `stripComments` que la surface 3)
//    parce qu'un commentaire qui mentionne une balise HTML en prose (« évite
//    un <form> imbriqué ») produit sinon un `>` qui s'apparie avec le `<`
//    de la vraie balise suivante.
// Risque résiduel, assumé : une comparaison booléenne multi-lignes sans
// accolades ni flèche ni auto-fermante (rare avec le formatage Prettier de
// ce dépôt) — couvert en dernier recours par SUSPICIOUS_TOKENS et les
// bornes de taille ci-dessous.
const SUSPICIOUS_TOKENS = /;|=>|&&|\|\||===|!==|==|!=|<=|>=|\+=|-=|\*=|\/=|\?\?/;
const MAX_JSX_SPAN_LINES = 6;
const MAX_JSX_SPAN_CHARS = 300;

/** Le contenu entre `>` et `<` ressemble-t-il à un texte JSX réel, pas à du code ? */
function looksLikeJsxProse(inner) {
  if (!/\p{L}{3}/u.test(inner)) return false; // pas de mot d'au moins 3 lettres
  // Les entités HTML (`&apos;`, `&amp;`…), fréquentes dans ce dépôt pour les
  // apostrophes en JSX (`l&apos;emploi`), se terminent par `;` — ça ne doit
  // pas être confondu avec un `;` de fin d'instruction JS. On les retire
  // avant de tester SUSPICIOUS_TOKENS, pas avant le test de longueur/lignes
  // ni le mot de 3 lettres (le texte réel doit rester intact pour ceux-là).
  const withoutEntities = inner.replace(/&[a-zA-Z]+;/g, "");
  if (SUSPICIOUS_TOKENS.test(withoutEntities)) return false; // jeton d'opérateur JS, jamais dans de la prose
  if (inner.length > MAX_JSX_SPAN_CHARS) return false; // bien plus long qu'un texte d'écran réel
  if ((inner.match(/\n/g) ?? []).length > MAX_JSX_SPAN_LINES) return false;
  return true;
}

// Props/attributs connus pour porter du texte visible dans ce dépôt — liste
// nommée plutôt qu'heuristique large, comme demandé en revue.
const TEXT_ATTRS = ["placeholder", "aria-label", "alt", "title", "label", "subtitle", "cta", "text"];
const ATTR_RE = new RegExp(`\\b(${TEXT_ATTRS.join("|")})=(["'])((?:(?!\\2).)*)\\2`, "gu");

// Mots grammaticaux français courants : leur présence, comme mot isolé,
// trahit une phrase plutôt qu'un identifiant technique. Liste volontairement
// limitée aux articles/prépositions/pronoms/conjonctions les plus fréquents
// du corpus — pas un dictionnaire complet.
const STOPWORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "est", "sont",
  "vous", "nous", "on", "je", "tu", "il", "elle", "pas", "plus", "avec",
  "pour", "dans", "sur", "ce", "cet", "cette", "ces", "ça", "qui", "que",
  "où", "au", "aux", "à", "ton", "ta", "tes", "son", "sa", "ses", "mon", "ma",
  "mes", "notre", "nos", "votre", "vos", "leur", "leurs", "très", "chez",
  "dès", "déjà", "toujours", "jamais", "encore", "aussi", "alors", "donc",
  "mais", "si", "ni", "ne", "chacun", "chaque", "tout", "tous", "toute",
  "toutes", "ici", "là", "sans", "selon",
]);

const ACCENTED = /[À-ÖØ-öø-ÿŒœ]/;
const WORD_RE = /\p{L}[\p{L}'’-]*/gu;
const LITERAL_RE = /`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;

/**
 * Le back-office est hors périmètre de traduction : outil interne, réservé
 * à l'équipe et aux commerçants partenaires, tenu en français seul. L'y
 * inclure imposerait de maintenir 200 clés dans cinq langues que personne
 * ne lira jamais.
 */
const SKIPPED = ["app/admin", "app/legacy"];

function walk(dir) {
  if (SKIPPED.some((skipped) => dir === skipped || dir.startsWith(`${skipped}/`))) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Lignes désarmées par un commentaire `i18n-ignore`, sur elles ou juste au-dessus. */
function ignoredLineSet(rawLines) {
  const ignored = new Set();
  rawLines.forEach((line, index) => {
    if (line.includes("i18n-ignore")) {
      ignored.add(index + 1); // la ligne elle-même
      ignored.add(index + 2); // la ligne suivante (marqueur juste au-dessus du code)
    }
  });
  return ignored;
}

/**
 * Retire les commentaires `/* … *\/` et `// …` d'un fichier entier, en
 * conservant les retours à la ligne pour ne pas décaler les numéros de
 * ligne rapportés. Suppose qu'aucun littéral de lib/ ne contient `//` ou
 * `/*` en son sein — vérifié sur le contenu actuel, à revérifier si ça
 * change.
 */
function stripComments(source) {
  const noBlocks = source.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ""));
  return noBlocks.replace(/\/\/[^\n]*/g, "");
}

// Identifiant pointé : segment.segment[.segment…], zéro espace sur toute la
// chaîne. Ancré ^…$ pour ne juger que le littéral entier — une phrase qui
// contiendrait par ailleurs un fragment pointé reste attrapée normalement.
const DOTTED_IDENTIFIER = /^\S+(?:\.\S+)+$/;

// Code court tout en majuscules (pays/langue) : 2 à 3 lettres, rien d'autre.
const SHORT_UPPER_CODE = /^[A-Z]{2,3}$/;

/**
 * Signaux communs aux deux variantes ci-dessous : les rejets structurels
 * (colonne Supabase, chemin, code de langue/pays, identifiant pointé), puis
 * les mots accentués et les mots grammaticaux trouvés dans le littéral.
 * Retourne `null` si le littéral est écarté d'office par un rejet
 * structurel — les deux appelants le traitent alors comme « pas de la
 * prose », sans avoir à dupliquer ces cinq vérifications.
 */
function naturalLanguageSignals(inner) {
  if (inner.includes("_") || inner.includes("/")) return null; // colonne Supabase, chemin
  const trimmed = inner.trim();
  if (/^(fr|en|es|he|ru)$/i.test(trimmed)) return null; // code de langue
  if (DOTTED_IDENTIFIER.test(trimmed)) return null; // clé de traduction, chemin de config…
  if (SHORT_UPPER_CODE.test(trimmed)) return null; // code pays/langue (ex. "IL"), pas un mot de prose

  const words = trimmed.match(WORD_RE) ?? [];
  if (!words.length) return null;

  return {
    hasAccentedWord: words.some((w) => w.length >= 3 && ACCENTED.test(w)),
    hasStopword: words.some((w) => STOPWORDS.has(w.toLowerCase())),
    isMultiWordPhrase: words.filter((w) => w.length >= 2).length >= 2,
  };
}

/**
 * Surface 3 (lib/*.ts) : un littéral est un candidat texte en langue
 * naturelle s'il a un mot accentué, un mot grammatical, OU s'il est
 * simplement multi-mots (au moins 2 mots de 2 lettres ou plus). Ce dernier
 * critère fonctionne bien sur des catalogues de données/libellés — rien
 * dans lib/ ne ressemble à une classe Tailwind.
 */
function looksLikeNaturalLanguage(inner) {
  const signals = naturalLanguageSignals(inner);
  if (!signals) return false;
  return signals.hasAccentedWord || signals.hasStopword || signals.isMultiWordPhrase;
}

/**
 * Surface 4 (expressions .tsx) : même détection, MAIS sans le critère
 * « multi-mots » — c'est précisément lui qui, appliqué à des classes
 * Tailwind (`"border-[1.5px] border-line-soft bg-white text-ink"` a
 * plusieurs mots de 2+ lettres au sens de WORD_RE), fait exploser les faux
 * positifs sur les dizaines de ternaires `cond ? "classe-a" : "classe-b"`
 * de ce dépôt. Sur cette surface, seuls l'accent et le mot grammatical
 * comptent — un signal plus rare dans une classe CSS que dans une phrase.
 * Coût assumé : un texte réel sans accent ni mot grammatical isolé (ex.
 * « Nouvelle mission ») peut échapper à CETTE règle précise. Dans les cas
 * observés, le ternaire a toujours une branche voisine qui, elle, est
 * détectée (« Modifier la mission » contient « la ») — la relecture humaine
 * du fichier signalé retrouve alors les deux branches ensemble.
 */
function looksLikeExprProse(literal) {
  const inner = literal.slice(1, -1); // retire les guillemets/backticks
  const signals = naturalLanguageSignals(inner);
  if (!signals) return false;
  return signals.hasAccentedWord || signals.hasStopword;
}

const offenders = { jsx: [], attr: [], expr: [], lib: [] };

// Un seul littéral (chaîne ou template), réutilisé pour construire les
// regex de la surface 4 — même définition que LITERAL_RE plus bas.
const LITERAL_SRC = "`(?:[^`\\\\]|\\\\.)*`|\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'";
// Ternaire dont les DEUX branches sont des littéraux : `cond ? "A" : "B"`.
// Exiger les deux branches (pas une seule) réduit le bruit sur les ternaires
// mixtes (`cond ? variable : "texte"`) sans perdre les cas réels observés,
// qui ont toujours les deux branches littérales.
const TERNARY_RE = new RegExp(`\\?\\s*(${LITERAL_SRC})\\s*:\\s*(${LITERAL_SRC})`, "gsu");
// Repli nullish : `expr ?? "texte"`. `||` volontairement exclu : trop
// fréquent avec un repli de classes Tailwind (`cond || "flex items-center"`),
// qui passerait la même heuristique de langue naturelle sans être du texte.
const NULLISH_RE = new RegExp(`\\?\\?\\s*(${LITERAL_SRC})`, "gsu");
// Template literal contenant au moins une interpolation : partiellement
// dynamique, donc invisible à la surface 2 (qui n'accepte que `attr="…"`).
const TEMPLATE_RE = /`((?:[^`\\]|\\.)*)`/gsu;

/* --- Surfaces 1 & 2 : JSX visible + attributs, dans app/ et components/ --- */
for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (!file.endsWith(".tsx")) continue;
    if (SKIP.some((pattern) => pattern.test(`/${file}`))) continue;

    const content = readFileSync(file, "utf8");
    const rawLines = content.split("\n");
    const ignored = ignoredLineSet(rawLines);

    // Surface 1 — sur le contenu entier, pas ligne par ligne : un texte
    // JSX peut être à cheval sur plusieurs lignes physiques (cf. en-tête).
    // Commentaires neutralisés d'abord (même fonction que la surface 3) ;
    // les retours à la ligne sont conservés donc les numéros de ligne
    // calculés plus bas sur `stripped` restent exacts.
    const stripped = stripComments(content);
    for (const match of stripped.matchAll(/(?<![=/])>([^<>{}]*)<(?!=)/gsu)) {
      const inner = match[1];
      if (!looksLikeJsxProse(inner)) continue;

      const startLine = stripped.slice(0, match.index).split("\n").length;
      const endLine = startLine + (inner.match(/\n/g) ?? []).length;
      // Un commentaire i18n-ignore sur la ligne d'ouverture (>) ou de
      // fermeture (<) désarme tout le segment, dans les deux cas.
      if (ignored.has(startLine) || ignored.has(endLine)) continue;

      const snippet = inner.trim().replace(/\s+/g, " ");
      offenders.jsx.push(`${file}:${startLine}  >${snippet}<`);
    }

    // Surface 2 — reste ligne par ligne : un attribut littéral entre
    // guillemets ne peut pas contenir de retour à la ligne physique non
    // échappé en JS/TS, donc aucun cas multi-lignes à couvrir ici.
    rawLines.forEach((line, index) => {
      const lineNo = index + 1;
      if (ignored.has(lineNo)) return;

      for (const match of line.matchAll(ATTR_RE)) {
        const value = match[3];
        if (/\p{L}{3}/u.test(value)) {
          offenders.attr.push(`${file}:${lineNo}  ${match[1]}="${value}"`);
        }
      }
    });

    // Surface 4 — littéraux « en langue naturelle » à des positions
    // syntaxiques précises (ternaire, repli ??, template interpolé) : cf.
    // en-tête. Sur `stripped` comme la surface 1, pour les mêmes raisons
    // (commentaires neutralisés, numéros de ligne toujours exacts).
    const reported = new Set(); // évite de compter deux fois le même littéral (ternaire + template imbriqués)

    function reportExpr(literalWithQuotes, index) {
      if (reported.has(index)) return;
      reported.add(index);
      const startLine = stripped.slice(0, index).split("\n").length;
      if (ignored.has(startLine)) return;
      const snippet = literalWithQuotes.trim().replace(/\s+/g, " ");
      offenders.expr.push(`${file}:${startLine}  ${snippet}`);
    }

    for (const match of stripped.matchAll(TERNARY_RE)) {
      if (looksLikeExprProse(match[1])) reportExpr(match[1], match.index + match[0].indexOf(match[1]));
      const secondIndex = match.index + match[0].lastIndexOf(match[2]);
      if (looksLikeExprProse(match[2])) reportExpr(match[2], secondIndex);
    }

    for (const match of stripped.matchAll(NULLISH_RE)) {
      if (looksLikeExprProse(match[1])) {
        reportExpr(match[1], match.index + match[0].indexOf(match[1]));
      }
    }

    for (const match of stripped.matchAll(TEMPLATE_RE)) {
      const full = match[0];
      const body = match[1];
      if (!body.includes("${")) continue; // statique pur : hors périmètre de cette surface (cf. en-tête)
      // Les segments interpolés ne comptent pas comme texte : on ne teste
      // que ce qu'il reste du gabarit une fois `${…}` retiré (imbrication
      // simple uniquement, suffisant pour les cas observés ici).
      const staticOnly = body.replace(/\$\{[^{}]*\}/g, "");
      if (looksLikeExprProse(`\`${staticOnly}\``)) reportExpr(full, match.index);
    }
  }
}

/* --- Surface 3 : catalogues et messages dans les .ts de lib/ --- */
for (const file of walk(LIB_ROOT)) {
  if (!file.endsWith(".ts")) continue; // .tsx volontairement exclu, cf. en-tête
  if (SKIP.some((pattern) => pattern.test(`/${file}`))) continue;

  const raw = readFileSync(file, "utf8");
  const rawLines = raw.split("\n");
  const ignored = ignoredLineSet(rawLines);
  const strippedLines = stripComments(raw).split("\n");

  strippedLines.forEach((line, index) => {
    const lineNo = index + 1;
    if (ignored.has(lineNo)) return;

    for (const match of line.matchAll(LITERAL_RE)) {
      const literal = match[0];
      const inner = literal.slice(1, -1);
      if (looksLikeNaturalLanguage(inner)) {
        const snippet = literal.length > 70 ? `${literal.slice(0, 67)}...` : literal;
        offenders.lib.push(`${file}:${lineNo}  ${snippet}`);
      }
    }
  });
}

const total =
  offenders.jsx.length + offenders.attr.length + offenders.expr.length + offenders.lib.length;

if (total) {
  console.error(`\n✗ ${total} chaîne(s) écrite(s) en dur :`);

  if (offenders.jsx.length) {
    console.error(`\n  — Texte JSX (${offenders.jsx.length}) —`);
    for (const line of offenders.jsx) console.error(`    ${line}`);
  }
  if (offenders.attr.length) {
    console.error(`\n  — Attributs (${offenders.attr.length}) —`);
    for (const line of offenders.attr) console.error(`    ${line}`);
  }
  if (offenders.expr.length) {
    console.error(`\n  — Expressions JS : ternaires, gabarits, repli ?? (${offenders.expr.length}) —`);
    for (const line of offenders.expr) console.error(`    ${line}`);
  }
  if (offenders.lib.length) {
    console.error(`\n  — lib/*.ts (${offenders.lib.length}) —`);
    for (const line of offenders.lib) console.error(`    ${line}`);
  }

  console.error("\nLes déplacer dans messages/fr.json et les lire via t().");
  console.error("Faux positif de syntaxe ? Ajouter un commentaire `i18n-ignore` sur la ligne ou juste au-dessus.\n");
  process.exit(1);
}

console.log("✓ Aucun texte en dur détecté sur les surfaces couvertes (JSX, attributs, expressions .tsx, lib/*.ts).");
