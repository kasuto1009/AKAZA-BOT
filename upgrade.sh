#!/bin/bash

# --- Script para subir actualizaciones del bot a Git ---

# --- CONFIGURACIÓN ---
GIT_USER_EMAIL="kirigayakasuto422@gmail.com"
GIT_USER_NAME="kasuto1009"
GIT_BRANCH="main"                  # Confirmado desde GitHub que es 'main'.
REMOTE_NAME="origin"
# Ruta ABSOLUTA a tu clave privada SSH (la encontramos en /root/.ssh/)
SSH_PRIVATE_KEY="/home/container/.ssh/akaza_bot_deploy_key"
# ---------------------------

# Directorio del repositorio
REPO_DIR="/home/container" # Ruta estándar en Pterodactyl

echo "🚀 Iniciando script de actualización Git..."
echo "-----------------------------------------"
echo "ℹ️ Ejecutando como usuario: $(whoami)"
echo "🏠 Directorio HOME: $HOME"

# 0. Verificar si Git está instalado
if ! command -v git &> /dev/null
then
    echo "❌ Error: Git no está instalado."
    exit 1
fi
echo "✅ Git encontrado."

# 1. Marcar el directorio como seguro
echo "🛡️ Marcando directorio como seguro para Git..."
git config --global --add safe.directory "$REPO_DIR" || true
# Ya no necesitamos --local si --global funciona
echo "   ✔️ Directorio marcado como seguro."

# 2. Ir al directorio del script/repositorio
cd "$REPO_DIR" || exit 1
echo "📁 Directorio actual: $(pwd)"

# 3. Configurar identidad de Git LOCALMENTE
echo "👤 Configurando identidad Git localmente..."
git config user.email "$GIT_USER_EMAIL"
git config user.name "$GIT_USER_NAME"
git config core.autocrlf input # Ayuda con los warnings CRLF/LF
echo "   ✔️ Identidad configurada para este repositorio."

# 4. Añadir todos los cambios (respetando .gitignore)
echo "➕ Añadiendo cambios..."
git add .
echo "   ✔️ Cambios añadidos."

# 5. Crear un commit (solo si hay cambios)
echo "📝 Creando commit..."
# Usamos comando compatible con versiones antiguas de Git
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

# 6. VERIFICAR PERMISOS SSH JUSTO ANTES DEL PUSH
echo "🔍 Verificando permisos/dueño de la clave SSH antes del push:"
ls -la "$SSH_PRIVATE_KEY" || echo "   ⚠️ No se pudo encontrar o listar la clave $SSH_PRIVATE_KEY"

# 7. Subir los cambios al repositorio remoto - FORZANDO LA CLAVE SSH
echo "📤 Subiendo cambios a '$REMOTE_NAME/$GIT_BRANCH' usando clave explícita..."
# Usamos GIT_SSH_COMMAND para decirle a Git qué comando SSH usar
GIT_SSH_COMMAND="ssh -i $SSH_PRIVATE_KEY -o IdentitiesOnly=yes" git push $REMOTE_NAME $GIT_BRANCH || true
PUSH_EXIT_CODE=$? # Guardamos el código de salida del comando push

if [ $PUSH_EXIT_CODE -eq 0 ]; then
     echo "   ✔️ Push completado (o sin cambios nuevos)."
else
     echo "   ⚠️ Nota: 'git push' falló (código $PUSH_EXIT_CODE) pero el script continuó."
     echo "      Revisa el error anterior. ¿Sigue siendo 'Permission denied' o 'uid 999'?"
     # Añadimos una prueba de conexión SSH con la clave explícita para diagnóstico
     echo "   🔍 Probando conexión SSH directa con la clave..."
     ssh -T -i $SSH_PRIVATE_KEY -o IdentitiesOnly=yes git@github.com
fi

# --- Fin del Proceso ---
echo "-----------------------------------------"
echo "✨ Script de actualización Git finalizado."

exit 0