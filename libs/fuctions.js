// libs/fuctions.js (VERSIÓN COMMONJS - CORREGIDA SIN BORDES BLANCOS Y CON FILTRO ARREGLADO)

const baileys = require('@whiskeysockets/baileys');
const { getContentType, proto } = baileys;

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Crypto = require("crypto");
const ff = require('fluent-ffmpeg');
const webp = require("node-webpmux");

const tempFolder = path.join(__dirname, "../tmp/");
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

function smsg(conn, m, store) {
    if (!m) return m;
    let M = proto.WebMessageInfo.fromObject(m);
    if (M.key) {
        M.id = M.key.id;
        M.isBaileys = M.id.startsWith('BAE5') && M.id.length === 16;
        M.chat = M.key.remoteJid;
        M.fromMe = M.key.fromMe;
        M.isGroup = M.chat.endsWith('@g.us');
        M.sender = conn.decodeJid(M.fromMe && conn.user.id || M.participant || M.key.participant || M.chat || '');
    }
    if (M.message) {
        M.mtype = getContentType(M.message);
        M.msg = M.message[M.mtype];
        M.text = M.msg?.text || M.msg?.caption || M.message?.conversation || '';
        let quoted = M.quoted = M.msg.contextInfo ? M.msg.contextInfo.quotedMessage : null;
        if (M.quoted) {
            let type = getContentType(M.quoted);
            M.quoted = M.quoted[type];
            if (typeof M.quoted === 'string') M.quoted = { text: M.quoted };
            M.quoted.sender = conn.decodeJid(M.msg.contextInfo.participant);
            M.quoted.text = M.quoted.text || M.quoted.caption || '';
        }
    }
    M.reply = (text) => conn.sendMessage(M.chat, { text: text }, { quoted: m });
    return M;
}

async function imageToWebp(media) {
    const tmpFileOut = path.join(tempFolder, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(tempFolder, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            .addOutputOptions([
                "-vcodec", "libwebp",
                // =================================================================
                // CORRECCIÓN: Se utiliza un filtro de escalado más robusto y sin errores de sintaxis.
                // Esto escala la imagen para que quepa en 512x512, manteniendo su forma y evitando el error.
                // =================================================================
                "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15"
            ])
            .toFormat("webp")
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}

async function videoToWebp(media) {
    const tmpFileOut = path.join(tempFolder, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(tempFolder, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            .addOutputOptions([
                "-vcodec", "libwebp",
                // =================================================================
                // CORRECCIÓN: Se aplica el mismo filtro robusto para los videos.
                // =================================================================
                "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15",
                "-loop", "0",
                "-ss", "00:00:00",
                "-t", "00:00:05",
                "-preset", "default",
                "-an",
                "-vsync", "0"
            ])
            .toFormat("webp")
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}

async function writeExif(media, metadata, type) {
    const wMedia = type === 'image' ? await imageToWebp(media) : await videoToWebp(media);
    const tmpFileIn = path.join(tempFolder, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileOut = path.join(tempFolder, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    fs.writeFileSync(tmpFileIn, wMedia);

    if (metadata.packname || metadata.author) {
        const img = new webp.Image();
        const json = {
            "sticker-pack-id": `https://github.com/akaza-bot`,
            "sticker-pack-name": metadata.packname || '',
            "sticker-pack-publisher": metadata.author || '',
            "emojis": metadata.categories ? metadata.categories : [""]
        };
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);
        const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);

        await img.load(tmpFileIn);
        fs.unlinkSync(tmpFileIn);
        img.exif = exif;
        await img.save(tmpFileOut);
        return tmpFileOut;
    }

    return tmpFileIn;
}

async function toAudioOpus(buffer) {
    const tmpFileIn = path.join(tempFolder, `${Date.now()}.mp3`);
    const tmpFileOut = path.join(tempFolder, `${Date.now()}.opus`);
    fs.writeFileSync(tmpFileIn, buffer);
    await new Promise((resolve, reject) => {
        ff(tmpFileIn).audioCodec("libopus").format("opus").on("end", resolve).on("error", reject).save(tmpFileOut);
    });
    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    fs.unlinkSync(tmpFileOut);
    return buff;
}

const getBuffer = async (url) => {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data, "binary");
};

const isUrl = (url) => /https?:\/\/[^\s]+/.test(url);

const getGroupAdmins = (participants) =>
    participants.filter(p => p.admin).map(p => p.id);

// --- EXPORTACIÓN FINAL COMPLETA ---
module.exports = {
    smsg,
    imageToWebp,
    videoToWebp,
    writeExif,
    toAudio: toAudioOpus,
    getBuffer,
    isUrl,
    getGroupAdmins
};