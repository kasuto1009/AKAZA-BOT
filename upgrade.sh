#!/bin/bash

# --- Script para subir actualizaciones del bot a Git (Usando HTTPS + Token) ---

# --- ¡¡¡CONFIGURA ESTO!!! ---
GIT_USER_EMAIL="kirigayakasuto422@gmail.com"
GIT_USER_NAME="kasuto1009"
GIT_BRANCH="main"                  # Rama correcta
REMOTE_NAME="origin"
# ---------------------------

REPO_DIR="/home/container"

echo "🚀 Iniciando script de actualización Git (HTTPS)..."
echo "-----------------------------------------"
echo "ℹ️ Ejecutando como usuario: $(whoami)"
echo "🏠 Directorio HOME: $HOME"

# 0. Verificar si Git está instalado
if ! command -v git &> /dev/null; then echo "❌ Error: Git no está instalado."; exit 1; fi
echo "✅ Git encontrado."

# 1. Marcar el directorio como seguro
echo "🛡️ Marcando directorio como seguro para Git..."
git config --global --add safe.directory "$REPO_DIR" || true
echo "   ✔️ Directorio marcado como seguro."

# 2. Ir al directorio del repositorio
cd "$REPO_DIR" || exit 1
echo "📁 Directorio actual: $(pwd)"

# 3. Configurar identidad de Git LOCALMENTE
echo "👤 Configurando identidad Git localmente..."
git config user.email "$GIT_USER_EMAIL"
git config user.name "$GIT_USER_NAME"
git config core.autocrlf input
echo "   ✔️ Identidad configurada para este repositorio."

# 4. INTENTAR TRAER Y FUSIONAR CAMBIOS REMOTOS (git pull sin --ff-only)
echo "🔄 Intentando traer y fusionar cambios remotos (git pull)..."
# Quitamos --ff-only para permitir que Git cree un merge commit si es necesario y posible
# Usamos || true para continuar si el pull falla (ej. conflictos reales que requieren intervención manual)
git pull $REMOTE_NAME $GIT_BRANCH || true
PULL_EXIT_CODE=$?
if [ $PULL_EXIT_CODE -ne 0 ]; then
     echo "   ⚠️ Nota: 'git pull' falló (código $PULL_EXIT_CODE). Puede haber conflictos que requieren resolución manual."
else
     echo "   ✔️ Pull/Merge completado o ya estaba actualizado."
fi

# 5. Añadir todos los cambios locales (respetando .gitignore)
echo "➕ Añadiendo cambios locales (si los hay)..."
git add .
echo "   ✔️ Cambios añadidos."

# 6. Crear un commit (solo si hay cambios locales nuevos o si hubo un merge)
echo "📝 Creando commit local..."
# Verificamos si hay algo en el staging area O si estamos en medio de un merge (que necesita commit)
if ! git diff-index --quiet HEAD -- || git rev-parse -q --verify MERGE_HEAD; then
    COMMIT_MSG="Auto-commit Pterodactyl: $(date +'%Y-%m-%d %H:%M:%S')"
    # Si estamos en medio de un merge, el commit lo finalizará.
    git commit -m "$COMMIT_MSG"
    if [ $? -ne 0 ]; then
        echo "⚠️ Advertencia: 'git commit' falló. ¿Hubo un conflicto en el merge que no se resolvió?"
    else
        echo "   ✔️ Commit local creado/finalizado: \"$COMMIT_MSG\""
    fi
else
    echo "   ℹ️ No hay cambios locales nuevos para commitear."
fi

# 7. Subir los cambios al repositorio remoto (HTTPS)
echo "📤 Subiendo cambios a '$REMOTE_NAME/$GIT_BRANCH' (HTTPS)..."
git push $REMOTE_NAME $GIT_BRANCH || true # || true evita que falle el script
PUSH_EXIT_CODE=$?

if [ $PUSH_EXIT_CODE -eq 0 ]; then
     echo "   ✔️ Push completado."
else
     echo "   ⚠️ Nota: 'git push' falló (código $PULL_EXIT_CODE) pero el script continuó."
     echo "      Esto puede pasar si 'git pull' falló debido a conflictos."
fi

# --- Fin del Proceso ---
echo "-----------------------------------------"
echo "✨ Script de actualización Git finalizado."

exit 0