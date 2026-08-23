#!/usr/bin/env bash
# Corrige o erro "Dependencies lock file is not found" nas branches com CI falhando
# Uso: rode este script na raiz local do repositório "rotina" (onde fica o package.json)

set -e

BRANCHES=(
  "fix/reload-error-flash-clean"
  "fix/main-runtime-duplicate-bootstrap"
  "refactor/ux-2026"
  "refactor/frontend-tests-stage-5-4"
)

echo "==> Verificando se estamos na raiz do repositório..."
if [ ! -f "package.json" ]; then
  echo "ERRO: package.json não encontrado. Rode este script dentro da pasta do repositório 'rotina'."
  exit 1
fi

echo "==> Verificando .gitignore por regras que bloqueiam o lock file..."
if grep -qE '^\s*(package-lock\.json|\*\.json)\s*$' .gitignore 2>/dev/null; then
  echo "AVISO: seu .gitignore parece estar ignorando package-lock.json ou *.json."
  echo "Abra o .gitignore e remova/ajuste essa linha antes de continuar."
  read -p "Já corrigiu o .gitignore (ou ele está OK)? Pressione Enter para continuar, Ctrl+C para abortar."
fi

echo "==> Buscando atualizações remotas..."
git fetch origin

for BRANCH in "${BRANCHES[@]}"; do
  echo ""
  echo "=============================================="
  echo "==> Processando branch: $BRANCH"
  echo "=============================================="

  git checkout "$BRANCH"
  git pull origin "$BRANCH"

  if [ -f "package-lock.json" ]; then
    echo "package-lock.json já existe nesta branch. Regenerando para garantir consistência..."
  else
    echo "package-lock.json ausente. Gerando..."
  fi

  npm install

  if git diff --quiet package-lock.json 2>/dev/null && git ls-files --error-unmatch package-lock.json >/dev/null 2>&1; then
    echo "Nenhuma mudança no lock file para $BRANCH. Pulando commit."
  else
    git add package-lock.json
    git commit -m "chore: add/update package-lock.json to fix CI cache step"
    git push origin "$BRANCH"
    echo "==> $BRANCH corrigida e enviada."
  fi
done

echo ""
echo "==> Concluído. Volte para sua branch original com: git checkout <sua-branch>"
echo "==> Verifique os checks no GitHub em alguns minutos."
