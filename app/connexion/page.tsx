"use client";

import { Suspense, useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Button, Field, TextInput } from "@/components/ui";
import { Check, Google } from "@/components/icons";
import { LogoTile } from "@/components/Wordmark";
import { signIn, signInWithGoogle, type AuthState } from "./actions";

const MIN_PASSWORD = 8;
const INITIAL: AuthState = { error: null };

export default function ConnexionPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh flex-1" />}>
      <Connexion />
    </Suspense>
  );
}

function Connexion() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const requested = searchParams.get("suite");

  // L'écran O01 de l'onboarding envoie directement sur le formulaire d'inscription.
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [state, submit, busy] = useActionState(signIn, INITIAL);
  const [google, submitGoogle, googleBusy] = useActionState(signInWithGoogle, INITIAL);
  const error = state.error ?? google.error;

  // i18n-ignore : "<" est l'opérateur de comparaison numérique, pas une balise JSX.
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== password;
  const matches = confirm.length > 0 && confirm === password && !tooShort;
  const pending = busy || googleBusy;

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setPassword("");
    setConfirm("");
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-7 pt-[54px] pb-4 sm:min-h-0">
      <div className="mb-4">
        <BackButton fallback="/onboarding" />
      </div>
      <LogoTile size={56} radius={18} />

      <h1 className="mt-5 mb-2 font-display text-[23px] font-semibold">
        {mode === "signin" ? t("signInTitle") : t("signUpTitle")}
      </h1>
      <p className="mb-5 text-[15px] leading-relaxed text-ink/60">
        {mode === "signin" ? t("signInSubtitle") : t("signUpSubtitle")}
      </p>

      <form action={submit} className="flex flex-col">
        <input type="hidden" name="mode" value={mode} />
        {requested && <input type="hidden" name="suite" value={requested} />}

        <Field label={t("emailLabel")} className="mb-3">
          <TextInput
            type="email"
            name="email"
            dir="ltr"
            required
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
          />
        </Field>

        <Field label={t("passwordLabel")} className="mb-3">
          <TextInput
            type="password"
            name="password"
            required
            minLength={mode === "signup" ? MIN_PASSWORD : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "signup" && tooShort && (
            <p className="mt-1.5 text-[12.5px] font-bold text-ink/45">
              {t("passwordTooShort", { count: MIN_PASSWORD - password.length })}
            </p>
          )}
        </Field>

        {mode === "signup" && (
          <Field label={t("confirmPasswordLabel")} className="mb-4">
            <TextInput
              type="password"
              name="confirm"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={mismatch ? "ring-2 ring-coral/50" : ""}
            />
            {mismatch && (
              <p className="mt-1.5 text-[12.5px] font-bold text-coral-deep">
                {t("passwordMismatch")}
              </p>
            )}
            {matches && (
              <p className="mt-1.5 flex items-center gap-1 text-[12.5px] font-bold text-olive-deep">
                <Check size={11} strokeWidth={3} /> {t("passwordMatch")}
              </p>
            )}
          </Field>
        )}

        {error && (
          <p
            role="alert"
            className="mb-3 rounded-field bg-coral-wash px-3.5 py-2.5 text-[13.5px] leading-snug font-bold text-coral-deep"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={pending || (mode === "signup" && (tooShort || mismatch))}
          className="mb-3.5 shadow-[var(--shadow-coral-lg)]"
        >
          {busy
            ? mode === "signup"
              ? t("creating")
              : t("signingIn")
            : mode === "signup"
              ? t("createAccount")
              : t("login")}
        </Button>

        <div className="my-1.5 mb-4 flex items-center gap-2.5">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[13px] text-ink/40">{t("or")}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
      </form>

      <form action={submitGoogle}>
        {requested && <input type="hidden" name="suite" value={requested} />}
        <Button type="submit" variant="secondary" size="sm" disabled={pending} className="w-full">
          <Google size={17} />
          {t("continueWithGoogle")}
        </Button>
      </form>

      <p className="mt-auto pt-6 text-center text-xs text-ink/65">
        {mode === "signin" ? (
          <>
            {t("noAccountYet")}{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-bold text-teal underline underline-offset-2"
            >
              {t("createOne")}
            </button>
          </>
        ) : (
          <>
            {t("alreadyHaveAccount")}{" "}
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="font-bold text-teal underline underline-offset-2"
            >
              {t("login")}
            </button>
          </>
        )}
      </p>
    </main>
  );
}
