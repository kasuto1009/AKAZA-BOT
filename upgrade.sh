#!/bin/bash

# --- Script para subir actualizaciones del bot a Git ---

# --- ¡¡¡CONFIGURA ESTO!!! ---
GIT_USER_EMAIL="kirigayakasuto422@gmail.com" # Reemplaza con tu email de GitHub/GitLab
GIT_USER_NAME="kasuto1009"  # Reemplaza con tu nombre de usuario de Git
GIT_BRANCH="main"                  # Cambia 'main' si tu rama es otra (ej: master)
REMOTE_NAME="origin"
# ---------------------------

echo "🚀 Iniciando script de actualización Git..."
echo "-----------------------------------------"

# 0. Verificar si Git está instalado (movido aquí para fallar rápido)
if ! command -v git &> /dev/null
then
    echo "❌ Error: Git no está instalado."
    exit 1
fi
echo "✅ Git encontrado."

# 1. Ir al directorio del script
cd "$(dirname "$0")" || exit 1
echo "📁 Directorio actual: $(pwd)"

# 2. Configurar identidad de Git SOLO para este repositorio
echo "👤 Configurando identidad Git localmente..."
git config user.email "$GIT_USER_EMAIL"
git config user.name "$GIT_USER_NAME"
# (Opcional) Configurar manejo de finales de línea (bueno para consistencia)
git config core.autocrlf input
echo "   ✔️ Identidad configurada para este repositorio."

# 3. Añadir todos los cambios (respetando .gitignore)
echo "➕ Añadiendo cambios..."
git add .
echo "   ✔️ Cambios añadidos."

# 4. Crear un commit (solo si hay cambios)
echo "📝 Creando commit..."
if git diff --staged --quiet; then
    echo "   ℹ️ No hay cambios para commitear."
else
    COMMIT_MSG="Auto-commit Pterodactyl: $(date +'%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    if [ $? -ne 0 ]; then
        echo "⚠️ Advertencia: 'git commit' falló inesperadamente."
        # Continuamos para intentar el push de todas formas
    else
        echo "   ✔️ Commit creado: \"$COMMIT_MSG\""
    fi
fi

# 5. Subir los cambios al repositorio remoto
echo "📤 Subiendo cambios a '$REMOTE_NAME/$GIT_BRANCH'..."
git push $REMOTE_NAME $GIT_BRANCH || true # || true evita que falle el script si el push no funciona
if git push $REMOTE_NAME $GIT_BRANCH; then
     echo "   ✔️ Push completado (o sin cambios nuevos)."
else
     echo "   ⚠️ Nota: 'git push' encontró un problema pero el script continuó."
     echo "      Verifica la conexión, la autenticación SSH (Deploy Key), y si la rama remota existe."
fi


# --- Fin del Proceso ---
echo "-----------------------------------------"
echo "✨ Script de actualización Git finalizado."

exit 0