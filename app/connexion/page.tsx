"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Button, Field, TextInput } from "@/components/ui";
import { Basket, Check, Google } from "@/components/icons";
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

    // Le prénom n'est pas demandé ici : c'est la première question de
    // l'onboarding (O02), qui l'écrit dans `profiles`.
    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setBusy(false);
      setError(frenchAuthError(error.message, error.code, mode));
      return;
    }

    // Filet de sécurité : si « Confirm email » était réactivé côté Supabase,
    // signUp ne renverrait pas de session et le compte resterait en attente.
    if (!data.session) {
      setBusy(false);
      setError(
        "Ce compte attend une confirmation par e-mail. Vérifiez le réglage « Confirm email » du projet Supabase, ou utilisez Google.",
      );
      return;
    }

    router.push(mode === "signup" ? afterSignup : suite);
    router.refresh();
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

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-7 pt-[54px] pb-4 sm:min-h-0">
      <div className="mb-4">
        <BackButton fallback="/onboarding" />
      </div>
      <LogoTile size={56} radius={18} />

      <h1 className="mt-5 mb-2 font-display text-[23px] font-semibold">
        {mode === "signin" ? "Bon retour" : "Créer votre compte"}
      </h1>
      <p className="mb-5 text-[13.5px] leading-relaxed text-ink/60">
        {mode === "signin"
          ? "Connectez-vous pour retrouver votre table et vos proches."
          : "Quelques secondes, et votre première table est ouverte."}
      </p>

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

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={signInWithGoogle}
        >
          <Google size={17} />
          Continuer avec Google
        </Button>

        <Link
          href="/devenir-traiteur"
          className="mt-2.5 flex items-center justify-center gap-2 rounded-full border-[1.5px] border-line-soft bg-white px-4 py-3 text-[12.5px] font-bold text-ink shadow-[var(--shadow-pill)]"
        >
          <Basket size={16} className="text-coral" />
          Fournisseur, traiteur ou restaurateur ?
        </Link>

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
