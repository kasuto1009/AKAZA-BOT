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

# 4. INTENTAR TRAER CAMBIOS REMOTOS PRIMERO (git pull)
echo "🔄 Intentando traer cambios remotos (git pull)..."
# Usamos --ff-only para evitar merges automáticos complicados si hay conflictos locales no commiteados
# Usamos || true para continuar si el pull falla (ej. sin conexión, o ya está actualizado)
git pull $REMOTE_NAME $GIT_BRANCH --ff-only || true
PULL_EXIT_CODE=$?
if [ $PULL_EXIT_CODE -ne 0 ]; then
     echo "   ⚠️ Nota: 'git pull' falló o no pudo hacer fast-forward (código $PULL_EXIT_CODE). Puede haber conflictos locales."
else
     echo "   ✔️ Pull completado o ya estaba actualizado."
fi

# 5. Añadir todos los cambios locales (respetando .gitignore)
echo "➕ Añadiendo cambios locales..."
git add .
echo "   ✔️ Cambios añadidos."

# 6. Crear un commit (solo si hay cambios locales)
echo "📝 Creando commit local..."
if git diff-index --quiet HEAD --; then
    echo "   ℹ️ No hay cambios locales para commitear."
else
    COMMIT_MSG="Auto-commit Pterodactyl: $(date +'%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    if [ $? -ne 0 ]; then echo "⚠️ Advertencia: 'git commit' falló."; else echo "   ✔️ Commit local creado: \"$COMMIT_MSG\""; fi
fi

# 7. Subir los cambios al repositorio remoto (HTTPS)
echo "📤 Subiendo cambios a '$REMOTE_NAME/$GIT_BRANCH' (HTTPS)..."
git push $REMOTE_NAME $GIT_BRANCH || true # || true evita que falle el script
PUSH_EXIT_CODE=$?

if [ $PUSH_EXIT_CODE -eq 0 ]; then
     echo "   ✔️ Push completado (o sin cambios nuevos)."
else
     echo "   ⚠️ Nota: 'git push' falló (código $PUSH_EXIT_CODE) pero el script continuó."
     echo "      Verifica la URL remota (¿incluye el token?), la conexión, y si la rama '$GIT_BRANCH' existe."
fi

# --- Fin del Proceso ---
echo "-----------------------------------------"
echo "✨ Script de actualización Git finalizado."

exit 0