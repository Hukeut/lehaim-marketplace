"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Button, Field, TextInput } from "@/components/ui";
import { Basket, Check, Envelope, Google, Home } from "@/components/icons";
import { LogoTile } from "@/components/Wordmark";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD = 8;

export default function ConnexionPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh flex-1" />}>
      <Connexion />
    </Suspense>
  );
}

function Connexion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("suite");
  const suite = requested ?? "/accueil";
  // Arrivé ici via le lien "Fournisseur..." (page 1, /traiteur, /partenaire)
  // ou "Espace admin" (/admin) : interface bureau/tablette dans les deux cas,
  // avec un texte propre à chacune plutôt que de reproposer le bouton qui a
  // mené jusqu'ici.
  const backOfficeKind: "traiteur" | "admin" | null =
    requested?.startsWith("/partenaire") || requested?.startsWith("/traiteur")
      ? "traiteur"
      : requested?.startsWith("/admin")
        ? "admin"
        : null;
  const isTraiteurFlow = backOfficeKind !== null;
  // Un compte tout juste créé n'a encore répondu à aucune question.
  const afterSignup = requested ?? "/onboarding/prenom";

  // L'écran O01 de l'onboarding envoie directement sur le formulaire d'inscription.
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Inscription qui vient d'aboutir, en attente du clic sur le lien reçu par
  // e-mail — étape 2 du parcours (inscription → confirmation → attente de
  // validation admin), distincte d'une erreur : le compte existe déjà et
  // rien n'est cassé, il manque juste la confirmation.
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const supabase = createClient();

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== password;
  const matches = confirm.length > 0 && confirm === password && !tooShort;

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirm("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (password.length < MIN_PASSWORD) {
        setError(`Le mot de passe doit faire au moins ${MIN_PASSWORD} caractères.`);
        return;
      }
      if (password !== confirm) {
        setError("Les deux mots de passe ne sont pas identiques.");
        return;
      }
    }

    setBusy(true);

    // Le lien reçu par e-mail ramène ici via /auth/callback, avec la même
    // destination que si la confirmation n'existait pas — sans ça, Supabase
    // renvoie vers la Site URL du projet, brute, sans jamais recréer la
    // session côté app.
    const emailRedirectTo = `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite)}`;

    // Le prénom n'est pas demandé ici : c'est la première question de
    // l'onboarding (O02), qui l'écrit dans `profiles`.
    let { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setBusy(false);
      setError(frenchAuthError(error.message, error.code, mode));
      return;
    }

    // Compte déjà existant : par anti-énumération, Supabase répond 200 sans
    // erreur ni session pour un signUp() sur une adresse déjà enregistrée
    // (tableau `identities` vide, plutôt qu'un message clair). Fréquent ici
    // puisqu'un même compte peut avoir commencé côté participant (/onboarding)
    // avant de revenir s'inscrire côté fournisseur — on retente une connexion
    // normale avec les mêmes identifiants plutôt que de bloquer la personne
    // sur un écran de confirmation qui ne correspond à rien.
    if (mode === "signup" && !data.session && data.user?.identities?.length === 0) {
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (retry.error) {
        setBusy(false);
        setError(
          retry.error.code === "email_not_confirmed"
            ? "Un compte existe déjà avec cette adresse, mais n'a jamais été confirmé. Renvoyez le mail de confirmation ci-dessous."
            : "Un compte existe déjà avec cette adresse, mais ce mot de passe ne correspond pas. Connectez-vous avec le bon mot de passe.",
        );
        if (retry.error.code === "email_not_confirmed") {
          setAwaitingConfirmation(true);
          setError(null);
        }
        return;
      }
      data = retry.data;
    }

    // Première inscription, tout juste créée : étape 2 du parcours, on
    // attend le clic sur le lien envoyé par e-mail avant de continuer. Le
    // dossier fournisseur (statut "en attente") ne se crée qu'à l'étape 3,
    // une fois la session confirmée — voir app/partenaire/candidature/page.tsx.
    if (!data.session) {
      setBusy(false);
      setAwaitingConfirmation(true);
      return;
    }

    let destination = mode === "signup" ? afterSignup : suite;

    // Un compte administrateur qui se connecte depuis le tunnel fournisseur
    // (/partenaire, /traiteur) atterrit directement sur /admin plutôt que sur
    // la candidature ou le back-office traiteur : la liste blanche
    // `marketplace_admins` fait foi, pas la page d'où vient la connexion.
    if (backOfficeKind === "traiteur" && data.user) {
      const { data: isAdmin } = await supabase.rpc("is_marketplace_admin");
      if (isAdmin) destination = "/admin";
    }

    // Pas de destination explicite : si ce compte a déjà un dossier
    // fournisseur, on l'emmène directement sur son espace (statut, menu,
    // commandes...) plutôt que sur l'accueil participant.
    if (!requested && data.user) {
      const { data: traiteur } = await supabase
        .from("traiteurs")
        .select("id")
        .eq("owner_id", data.user.id)
        .maybeSingle();
      if (traiteur) destination = "/partenaire/candidature";
    }

    router.push(destination);
    router.refresh();
  }

  async function resendConfirmation() {
    setResendState("sending");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite)}`,
      },
    });
    setResendState(error ? "idle" : "sent");
    if (error) setError(frenchAuthError(error.message, error.code, "signup"));
  }

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite)}`,
      },
    });
    if (error) {
      setBusy(false);
      setError(frenchAuthError(error.message, error.code, mode));
    }
  }

  const heading =
    backOfficeKind === "traiteur"
      ? mode === "signin"
        ? "Espace fournisseur"
        : "Devenir fournisseur"
      : backOfficeKind === "admin"
        ? "Espace admin"
        : mode === "signin"
          ? "Bon retour"
          : "Créer votre compte";

  const subtitle =
    backOfficeKind === "traiteur"
      ? mode === "signin"
        ? "Connectez-vous pour gérer votre menu et vos commandes sur la marketplace lehaim."
        : "Créez votre compte pour proposer vos plats sur la marketplace lehaim."
      : backOfficeKind === "admin"
        ? "Connectez-vous avec un compte de la liste des administrateurs."
        : mode === "signin"
          ? "Connectez-vous pour retrouver votre table et vos proches."
          : "Quelques secondes, et votre première table est ouverte.";

  const form = (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <Field label="Adresse e-mail" className="mb-3">
        <TextInput
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Mot de passe" className="mb-3">
        <TextInput
          type="password"
          required
          minLength={mode === "signup" ? MIN_PASSWORD : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "signup" && tooShort && (
          <p className="mt-1.5 text-[11px] font-bold text-ink/45">
            Encore {MIN_PASSWORD - password.length} caractère
            {MIN_PASSWORD - password.length > 1 ? "s" : ""}.
          </p>
        )}
      </Field>

      {mode === "signup" && (
        <Field label="Confirmer le mot de passe" className="mb-4">
          <TextInput
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={mismatch ? "ring-2 ring-coral/50" : ""}
          />
          {mismatch && (
            <p className="mt-1.5 text-[11px] font-bold text-coral-deep">
              Les deux saisies diffèrent.
            </p>
          )}
          {matches && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-olive-deep">
              <Check size={11} strokeWidth={3} /> Les mots de passe correspondent.
            </p>
          )}
        </Field>
      )}

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] leading-snug font-bold text-coral-deep"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={busy || (mode === "signup" && (tooShort || mismatch))}
        className="mb-3.5 shadow-[var(--shadow-coral-lg)]"
      >
        {busy
          ? mode === "signup"
            ? "Création…"
            : "Connexion…"
          : mode === "signup"
            ? "Créer mon compte"
            : "Se connecter"}
      </Button>

      <div className="my-1.5 mb-4 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11.5px] text-ink/40">ou</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={signInWithGoogle}>
        <Google size={17} />
        Continuer avec Google
      </Button>

      {isTraiteurFlow ? (
        <Link
          href="/onboarding"
          className="mt-2.5 flex items-center justify-center gap-2 rounded-full border-[1.5px] border-line-soft bg-white px-4 py-3 text-[12.5px] font-bold text-ink shadow-[var(--shadow-pill)]"
        >
          <Home size={16} className="text-teal" />
          Organisateur
        </Link>
      ) : (
        <Link
          href="/partenaire"
          className="mt-2.5 flex items-center justify-center gap-2 rounded-full border-[1.5px] border-line-soft bg-white px-4 py-3 text-[12.5px] font-bold text-ink shadow-[var(--shadow-pill)]"
        >
          <Basket size={16} className="text-coral" />
          Fournisseur, traiteur ou restaurateur ?
        </Link>
      )}

      <p className="mt-auto pt-6 text-center text-xs text-ink/50">
        {mode === "signin" ? (
          <>
            Pas encore de compte ?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-bold text-teal underline underline-offset-2"
            >
              En créer un
            </button>
          </>
        ) : (
          <>
            Vous avez déjà un compte ?{" "}
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="font-bold text-teal underline underline-offset-2"
            >
              Se connecter
            </button>
          </>
        )}
      </p>
    </form>
  );

  const confirmationScreen = (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-teal/12 text-teal">
        <Envelope size={26} />
      </div>
      <h2 className="mb-2 font-display text-[17px] font-semibold">Vérifiez votre boîte mail</h2>
      <p className="mb-1 text-[13px] leading-relaxed text-ink/60">On a envoyé un lien de confirmation à</p>
      <p className="mb-5 font-display text-[14px] font-semibold">{email}</p>
      <p className="mb-6 max-w-[320px] text-[12.5px] leading-relaxed text-ink/50">
        Cliquez dessus pour activer votre compte
        {backOfficeKind === "traiteur"
          ? " — votre dossier passera ensuite en attente de validation par l'équipe lehaim."
          : "."}{" "}
        Pensez à vérifier vos spams si rien n&apos;arrive.
      </p>

      {error && (
        <p
          role="alert"
          className="mb-3 w-full rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] leading-snug font-bold text-coral-deep"
        >
          {error}
        </p>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        full={false}
        disabled={resendState === "sending"}
        onClick={resendConfirmation}
        className="mb-3"
      >
        {resendState === "sending" ? "Envoi…" : resendState === "sent" ? "Mail renvoyé" : "Renvoyer le mail"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setAwaitingConfirmation(false);
          setError(null);
          setResendState("idle");
        }}
        className="text-[12px] font-bold text-teal underline underline-offset-2"
      >
        Retour
      </button>
    </div>
  );

  const body = awaitingConfirmation ? confirmationScreen : form;

  // Le tunnel fournisseur est une interface d'ordinateur/tablette (même
  // convention que /partenaire et /admin : data-fullwidth relâche le cadre
  // mobile de 430px posé par le layout racine) — même en-tête, même fond,
  // pour que l'utilisateur ne sente pas de rupture en passant de l'un à
  // l'autre. Le tunnel participant, lui, reste dans le cadre téléphone.
  if (isTraiteurFlow) {
    return (
      <div data-fullwidth className="min-h-dvh bg-sand text-ink">
        <header className="flex items-center gap-4 border-b border-line bg-white px-6 py-4 lg:px-9">
          <span className="font-display text-[18px] font-semibold">
            Lehaim
            <span className="text-teal">{backOfficeKind === "admin" ? "admin" : "partner"}</span>
          </span>
          <Link
            href={backOfficeKind === "admin" ? "/" : "/partenaire"}
            className="ms-auto text-[12.5px] font-bold text-ink/45"
          >
            Retour au site
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-[420px] flex-col px-6 py-12 lg:py-16">
          <LogoTile size={56} radius={18} />
          {!awaitingConfirmation && (
            <>
              <h1 className="mt-5 mb-2 font-display text-[23px] font-semibold">{heading}</h1>
              <p className="mb-5 text-[13.5px] leading-relaxed text-ink/60">{subtitle}</p>
            </>
          )}

          <div
            className={`rounded-[20px] bg-white p-7 shadow-[var(--shadow-card)] ${awaitingConfirmation ? "mt-5" : ""}`}
          >
            {body}
          </div>
        </main>
      </div>
    );
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-7 pt-[54px] pb-4 sm:min-h-0">
      <div className="mb-4">
        <BackButton fallback="/onboarding" />
      </div>
      <LogoTile size={56} radius={18} />
      {!awaitingConfirmation && (
        <>
          <h1 className="mt-5 mb-2 font-display text-[23px] font-semibold">{heading}</h1>
          <p className="mb-5 text-[13.5px] leading-relaxed text-ink/60">{subtitle}</p>
        </>
      )}
      <div className={awaitingConfirmation ? "mt-5 flex flex-1 flex-col" : "flex flex-1 flex-col"}>
        {body}
      </div>
    </main>
  );
}

/** Supabase répond en anglais : on traduit, et on dit quoi faire. */
function frenchAuthError(message: string, code: string | undefined, mode: "signin" | "signup") {
  if (code === "invalid_credentials" || /invalid login/i.test(message)) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (code === "user_already_exists" || /already registered/i.test(message)) {
    return "Un compte existe déjà avec cette adresse. Connectez-vous plutôt.";
  }
  if (code === "weak_password" || /password/i.test(message) && /short|weak/i.test(message)) {
    return `Mot de passe trop court : ${MIN_PASSWORD} caractères minimum.`;
  }
  if (code === "email_address_invalid" || /invalid/i.test(message)) {
    return "Cette adresse e-mail ne semble pas valide. Vérifiez l'orthographe du domaine.";
  }
  if (code === "over_email_send_rate_limit" || /rate limit/i.test(message)) {
    return "Trop de tentatives pour l'instant. Réessayez dans quelques minutes.";
  }
  if (code === "email_not_confirmed") {
    return "Ce compte attend une confirmation par e-mail. Utilisez Google en attendant.";
  }
  if (/network|fetch/i.test(message)) {
    return "Connexion impossible. Vérifiez votre réseau et réessayez.";
  }
  return mode === "signup"
    ? "La création du compte a échoué. Réessayez, ou utilisez Google."
    : "La connexion a échoué. Réessayez, ou utilisez Google.";
}
