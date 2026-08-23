-- ============================================================
-- Lehaim — la messagerie interne disparaît
--
-- L'app n'héberge plus de discussion : la conversation reste sur WhatsApp,
-- c'est le principe du produit. Les écrans et le code sont retirés ; la
-- table suit.
--
-- À passer APRÈS le déploiement qui retire le code, jamais avant : entre les
-- deux, une page encore en ligne interrogerait une table absente.
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

drop table if exists public.messages cascade;
