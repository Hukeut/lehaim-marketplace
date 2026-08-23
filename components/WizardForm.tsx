"use client";

import { useActionState, type ReactNode } from "react";
import { FormError } from "./partner";
import type { ActionState } from "@/app/actions";

/**
 * Enveloppe de formulaire du tunnel : porte l'état d'erreur renvoyé par
 * l'action, et rien d'autre. Chaque étape reste un composant serveur qui lit
 * ses valeurs en base ; seule la remontée d'erreur a besoin du client.
 */
export function WizardForm({
  action,
  children,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
}) {
  const [state, formAction] = useActionState(action, { ok: true, message: null });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.ok ? null : state.message} />
      {children}
    </form>
  );
}
