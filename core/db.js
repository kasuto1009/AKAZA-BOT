// core/db.js (VERSIÓN FINAL CON TODAS LAS MEJORAS INTEGRADAS)

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// --- Conexión a la Base de Datos ---
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const dbPath = path.join(DATA_DIR, 'bot.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// =================================================================
// SOLUCIÓN DEFINITIVA: Función para normalizar números de teléfono
// =================================================================
function normalizePhone(phone) {
    let normalized = String(phone || '').replace(/\D/g, '');
    if (normalized.startsWith('549') && normalized.length > 12) {
        normalized = '54' + normalized.substring(3);
    }
    return normalized;
}

// --- Creación de Tablas y Migraciones ---
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  user_phone TEXT PRIMARY KEY, internal_id TEXT UNIQUE NOT NULL, name TEXT, age INTEGER, country TEXT, 
  alias TEXT UNIQUE, email TEXT, created_at TEXT NOT NULL, money INTEGER DEFAULT 0, level INTEGER DEFAULT 1, 
  exp INTEGER DEFAULT 0, "limit" INTEGER DEFAULT 10, banned BOOLEAN DEFAULT FALSE, is_admin BOOLEAN DEFAULT FALSE
);
`);

// =================================================================
// CORRECCIÓN: Se añade la creación de la tabla 'user_history' que faltaba.
// =================================================================
db.exec(`
CREATE TABLE IF NOT EXISTS user_history (
  history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_phone TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (user_phone) REFERENCES users(user_phone) ON DELETE CASCADE
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS groups (
    group_id TEXT PRIMARY KEY,
    name TEXT,
    registered_at TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
`);
db.exec(`
CREATE TABLE IF NOT EXISTS bot_settings (
    bot_jid TEXT PRIMARY KEY,
    anticall BOOLEAN DEFAULT TRUE
);
`);

// MIGRACIONES: Se añaden las nuevas columnas si no existen de forma segura.
try { db.exec(`ALTER TABLE users ADD COLUMN play_timestamp TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 100`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN ia_credits INTEGER DEFAULT 5`); } catch (e) {}
try { db.exec(`ALTER TABLE groups ADD COLUMN is_active BOOLEAN DEFAULT TRUE`); } catch (e) {}

// --- Resto de Tablas ---
db.exec(`CREATE TABLE IF NOT EXISTS group_settings ( group_id TEXT PRIMARY KEY, welcome BOOLEAN DEFAULT TRUE, antilink BOOLEAN DEFAULT FALSE, antilink2 BOOLEAN DEFAULT FALSE, antitoxic BOOLEAN DEFAULT FALSE, antifake BOOLEAN DEFAULT FALSE, antiarabe BOOLEAN DEFAULT FALSE, modeadmin BOOLEAN DEFAULT FALSE, detect BOOLEAN DEFAULT TRUE );`);

// --- Preparación de Consultas (Statements) ---
const upsertUserStmt = db.prepare(`INSERT INTO users (user_phone, internal_id, name, age, country, alias, email, created_at, coins, ia_credits) VALUES (@user_phone, @internal_id, @name, @age, @country, @alias, @email, @created_at, @coins, @ia_credits) ON CONFLICT(user_phone) DO UPDATE SET name=excluded.name, age=excluded.age, country=excluded.country, alias=excluded.alias, email=excluded.email`);
const getUserByPhoneStmt = db.prepare(`SELECT * FROM users WHERE user_phone = ?`);
const getUserByAliasStmt = db.prepare(`SELECT * FROM users WHERE lower(alias) = lower(?)`);
const deleteUserByPhoneStmt = db.prepare(`DELETE FROM users WHERE user_phone = ?`);
const isAdminStmt = db.prepare(`SELECT is_admin FROM users WHERE user_phone = ?`);
const addAdminStmt = db.prepare(`UPDATE users SET is_admin = TRUE WHERE user_phone = ?`);
const getGroupSettingsStmt = db.prepare(`SELECT * FROM group_settings WHERE group_id = ?`);
const upsertGroupSettingsStmt = db.prepare(`INSERT INTO group_settings (group_id) VALUES (?) ON CONFLICT(group_id) DO NOTHING`);
const upsertGroupStmt = db.prepare(`INSERT INTO groups (group_id, name, registered_at, is_active) VALUES (?, ?, ?, 1) ON CONFLICT(group_id) DO UPDATE SET name=excluded.name`);
const isGroupActiveStmt = db.prepare(`SELECT is_active FROM groups WHERE group_id = ?`);
const toggleGroupStatusStmt = db.prepare(`UPDATE groups SET is_active = ? WHERE group_id = ?`);
const getAllGroupsStmt = db.prepare(`SELECT * FROM groups ORDER BY registered_at DESC`);
const getAllUsersSortedStmt = db.prepare(`SELECT user_phone, alias, created_at FROM users ORDER BY created_at DESC`);
const getBotSettingsStmt = db.prepare(`SELECT * FROM bot_settings WHERE bot_jid = ?`);
const upsertBotSettingsStmt = db.prepare(`INSERT INTO bot_settings (bot_jid) VALUES (?) ON CONFLICT(bot_jid) DO NOTHING`);

// --- Funciones de Usuario ---
function getUserByPhone(phone) { const n = normalizePhone(phone); return getUserByPhoneStmt.get(n); }
function getUserByAlias(alias) { return getUserByAliasStmt.get(alias); }
function insertOrUpdateUser(user) { if (!user || !user.user_phone) return; user.user_phone = normalizePhone(user.user_phone); user.internal_id = user.internal_id || uuidv4(); user.created_at = user.created_at || new Date().toISOString(); user.coins = user.coins ?? 100; user.ia_credits = user.ia_credits ?? 5; return upsertUserStmt.run(user); }
function deleteUserByPhone(phone) { const n = normalizePhone(phone); return deleteUserByPhoneStmt.run(n); }
function deleteUserByExactPhone(phone) { return deleteUserByPhoneStmt.run(phone); }
function getAllUsersSortedByDate() { return getAllUsersSortedStmt.all(); }

// --- Funciones de Grupo ---
function getChatSettings(groupId) { upsertGroupSettingsStmt.run(groupId); return getGroupSettingsStmt.get(groupId) || {}; }
function setChatSetting(groupId, setting, value) { const a = ['welcome','antilink','antilink2','antitoxic','antifake','antiarabe','modeadmin','detect']; if (!a.includes(setting)) throw new Error(`Invalid setting: ${setting}`); const s = db.prepare(`UPDATE group_settings SET ${setting} = ? WHERE group_id = ?`); return s.run(value ? 1 : 0, groupId); }
function registerGroup(groupId, groupName) { return upsertGroupStmt.run(groupId, groupName, new Date().toISOString()); }
function isGroupActive(groupId) { const r = isGroupActiveStmt.get(groupId); return r ? r.is_active === 1 : false; }
function toggleGroupStatus(groupId, status) { return toggleGroupStatusStmt.run(status ? 1 : 0, groupId); }
function getAllGroups() { return getAllGroupsStmt.all(); }

// --- Funciones de Admin ---
function isAdmin(phone) { const n = normalizePhone(phone); const r = isAdminStmt.get(n); return r?.is_admin === 1; }
function addAdmin(phone) { const n = normalizePhone(phone); return addAdminStmt.run(n); }

// --- Funciones del Bot ---
function getBotSettings(botJid) { upsertBotSettingsStmt.run(botJid); return getBotSettingsStmt.get(botJid) || {}; }

// --- Funciones Extra ---
function reduceLimit(phone, amount=1) { const n=normalizePhone(phone); const s=db.prepare(`UPDATE users SET "limit"=MAX(0,"limit"-?) WHERE user_phone=?`); return s.run(amount,n); }
function addExp(phone, amount=1) { const n=normalizePhone(phone); const s=db.prepare(`UPDATE users SET exp = exp + ? WHERE user_phone=?`); return s.run(amount,n); }
function addCoins(phone, amount) { const n=normalizePhone(phone); const s=db.prepare(`UPDATE users SET coins = coins + ? WHERE user_phone=?`); return s.run(amount,n); }
function removeCoins(phone, amount) { const n=normalizePhone(phone); const s=db.prepare(`UPDATE users SET coins = MAX(0, coins - ?) WHERE user_phone=?`); return s.run(amount,n); }
function addIaCredits(phone, amount) { const n=normalizePhone(phone); const s=db.prepare(`UPDATE users SET ia_credits = ia_credits + ? WHERE user_phone=?`); return s.run(amount,n); }
function removeIaCredits(phone, amount) { const n=normalizePhone(phone); const s=db.prepare(`UPDATE users SET ia_credits = MAX(0, ia_credits - ?) WHERE user_phone=?`); return s.run(amount,n); }
function resetPlayLimitIfNeeded(phone) { const n=normalizePhone(phone); const s=db.prepare(`UPDATE users SET "limit"=10 WHERE user_phone=? AND (play_timestamp IS NULL OR JULIANDAY('now')-JULIANDAY(play_timestamp)>=1)`); return s.run(n); }
function updatePlayTimestamp(phone) { const n=normalizePhone(phone); const s=db.prepare(`UPDATE users SET play_timestamp=? WHERE user_phone=?`); return s.run(new Date().toISOString(),n); }

// --- Función Universal ---
function getUserAny(identifier) { if (!identifier||typeof identifier!=='string') return null; if (identifier.includes('@')) return getUserByPhone(identifier.split('@')[0]); if (!/^\d+$/.test(identifier)) return getUserByAlias(identifier); return getUserByPhone(identifier); }

// --- EXPORTACIÓN FINAL COMPLETA ---
module.exports = {
    db, getUserByPhone, getUserByAlias, insertOrUpdateUser, deleteUserByPhone,
    getChatSettings, setChatSetting, registerGroup, isAdmin, addAdmin,
    reduceLimit, addExp, getUserAny, resetPlayLimitIfNeeded, updatePlayTimestamp,
    addCoins, removeCoins, addIaCredits, removeIaCredits, getAllUsersSortedByDate,
    deleteUserByExactPhone, isGroupActive, toggleGroupStatus, getAllGroups,
    getBotSettings
};