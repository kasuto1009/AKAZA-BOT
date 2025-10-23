// libs/tts.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const __dirname = process.cwd();

/**
 * Convierte texto a audio (TTS)
 * @param {string} text - Texto que se convertirá en voz
 * @param {string} lang - Código de idioma (por defecto: 'es')
 * @returns {Promise<string>} - Ruta del archivo MP3 generado
 */
export async function ttsFunction(text, lang = "es") {
  if (!text) throw new Error("No se proporcionó texto para TTS");

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    text
  )}&tl=${lang}&client=tw-ob`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) throw new Error("Error al generar el audio TTS");

  const buffer = await res.arrayBuffer();
  const filePath = path.join(__dirname, `tts_${Date.now()}.mp3`);
  fs.writeFileSync(filePath, Buffer.from(buffer));

  return filePath;
}
