# Sacha — Agent prospection · Agent IA (template NAIOM)

Ton agent IA prêt à l'emploi, à ouvrir dans **Claude Code**.

## Démarrer en 3 étapes
1. Ouvre **ce dossier** dans Claude Code.
2. Dans le terminal :
   ```bash
   cd naiom-platform
   cp .env.example .env.local     # puis colle ta clé Anthropic dans .env.local
   npm install
   npm run dev
   ```
3. Ouvre **http://localhost:3000** → tu arrives direct sur l'interface de **Sacha**.

Ta clé Anthropic : https://console.anthropic.com → API Keys.

## Ce que fait Sacha
Agent prospection. Les autres agents sont visibles mais **verrouillés** (page « Débloquer les autres »).

## 100 % vierge
Aucune clé, aucun historique, aucune donnée d'origine. Tout est à toi :
- Remplace `clients/votre-marque/brand.md` par ton contexte de marque.
- Tes livrables se rangent dans `(dans l'app)/`.

Clés éventuelles selon les fonctionnalités : voir `naiom-platform/.env.example`.
