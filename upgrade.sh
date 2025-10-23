#!/bin/bash

# --- Script para subir actualizaciones del bot a Git ---

# --- ¡¡¡CONFIGURA ESTO!!! ---
GIT_USER_EMAIL="kirigayakasuto422@gmail.com" # Reemplaza con tu email de GitHub/GitLab
GIT_USER_NAME="kasuto1009"  # Reemplaza con tu nombre de usuario de Git
GIT_BRANCH="main"                  # ¡¡YA LO CAMBIAMOS A MASTER!! Verifica si es correcto.
REMOTE_NAME="origin"
# ---------------------------

# Directorio del repositorio (la ruta que dio el error)
REPO_DIR="/var/lib/pterodactyl/volumes/4460a315-e973-4a4e-a8da-19f3104dbcf8" # Ajusta si es necesario, pero probablemente sea esta

echo "🚀 Iniciando script de actualización Git..."
echo "-----------------------------------------"

# 0. Verificar si Git está instalado
if ! command -v git &> /dev/null
then
    echo "❌ Error: Git no está instalado."
    exit 1
fi
echo "✅ Git encontrado."

# 1. Marcar el directorio como seguro (SOLUCIÓN al 'dubious ownership')
# Usamos --global porque el script podría correr como diferentes usuarios (root vs container)
# y necesitamos que ambos confíen en el directorio.
echo "🛡️ Marcando directorio como seguro para Git..."
git config --global --add safe.directory "$REPO_DIR"
echo "   ✔️ Directorio marcado como seguro."

# 2. Ir al directorio del script
cd "$(dirname "$0")" || exit 1
echo "📁 Directorio actual: $(pwd)"

# 3. Configurar identidad de Git LOCALMENTE (mejor que global si corre como container)
echo "👤 Configurando identidad Git localmente..."
git config user.email "$GIT_USER_EMAIL"
git config user.name "$GIT_USER_NAME"
git config core.autocrlf input # Ayuda con los warnings CRLF/LF
echo "   ✔️ Identidad configurada para este repositorio."

# 4. Añadir todos los cambios (respetando .gitignore)
echo "➕ Añadiendo cambios..."
git add .
echo "   ✔️ Cambios añadidos."

# 5. Crear un commit (solo si hay cambios) - Usando comando compatible
echo "📝 Creando commit..."
# Alternativa a 'git diff --staged --quiet' para versiones antiguas de Git
if git diff-index --quiet HEAD --; then
    echo "   ℹ️ No hay cambios para commitear."
else
    COMMIT_MSG="Auto-commit Pterodactyl: $(date +'%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    if [ $? -ne 0 ]; then
        echo "⚠️ Advertencia: 'git commit' falló inesperadamente."
    else
        echo "   ✔️ Commit creado: \"$COMMIT_MSG\""
    fi
fi

# 6. Subir los cambios al repositorio remoto
echo "📤 Subiendo cambios a '$REMOTE_NAME/$GIT_BRANCH'..."
git push $REMOTE_NAME $GIT_BRANCH || true # || true evita que falle el script
# Verificamos el código de salida del push para dar un mensaje más claro
PUSH_EXIT_CODE=$?
if [ $PUSH_EXIT_CODE -eq 0 ]; then
     echo "   ✔️ Push completado (o sin cambios nuevos)."
else
     echo "   ⚠️ Nota: 'git push' falló (código $PUSH_EXIT_CODE) pero el script continuó."
     echo "      Verifica la conexión, la autenticación SSH (Deploy Key), y si la rama remota '$GIT_BRANCH' existe."
fi

# --- Fin del Proceso ---
echo "-----------------------------------------"
echo "✨ Script de actualización Git finalizado."

exit 0