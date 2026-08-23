"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/icons";
import { Button, ButtonLink, Card, Screen, ScreenBody } from "@/components/ui";

/**
 * Frontière d'erreur de l'application.
 *
 * Sans ce fichier, la moindre exception de rendu sortait de la colonne mobile
 * et tombait sur l'écran par défaut de Next : en anglais, sans marque, sans
 * retour possible. L'utilisateur avait l'impression d'avoir quitté l'app.
 *
 * Les états affichés ici reprennent ceux déjà dessinés dans `/etats`, qui
 * n'étaient branchés nulle part.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.page");

  useEffect(() => {
    // Journalisé côté client, et récupéré par Vercel côté serveur. Le `digest`
    // est la seule chose qui relie ce qu'a vu l'utilisateur à la trace complète
    // dans les Runtime Logs — c'est lui qu'on affiche plus bas.
    console.error("[lehaim] erreur de rendu", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <Screen>
      <ScreenBody className="flex flex-col justify-center">
        <Card className="p-5 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-coral-wash text-coral-deep">
            <Alert size={20} />
          </span>

          <h1 className="font-display text-[17px] leading-snug font-semibold">{t("title")}</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[14px] leading-relaxed text-ink/55">
            {t("text")}
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <Button onClick={reset}>{t("retry")}</Button>
            <ButtonLink href="/accueil" variant="secondary">
              {t("home")}
            </ButtonLink>
          </div>

          {/* Ce que la personne peut nous citer pour qu'on retrouve la trace. */}
          {error.digest && (
            <p className="mt-4 font-mono text-[11px] text-ink/35">{error.digest}</p>
          )}
        </Card>
      </ScreenBody>
    </Screen>
  );
}
