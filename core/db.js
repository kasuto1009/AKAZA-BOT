<<<<<<< HEAD
// core/db.js (VERSIÓN FINAL COMPLETA CON FUNCIÓN countUsers)

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');

// --- Conexión a la Base de Datos ---
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const dbPath = path.join(DATA_DIR, 'bot.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// =================================================================
// FUNCIÓN CLAVE: Normalizador de Números de Teléfono
// =================================================================
function normalizePhone(phone) {
    let normalized = String(phone || '').replace(/\D/g, '');
    if (normalized.startsWith('549') && normalized.length > 12) {
        normalized = '54' + normalized.substring(3);
    }
    return normalized;
}

// --- Creación de Tablas ---
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    user_phone TEXT PRIMARY KEY,
    internal_id TEXT UNIQUE NOT NULL,
    name TEXT,
    age INTEGER,
    country TEXT,
    alias TEXT UNIQUE,
    email TEXT,
    created_at TEXT NOT NULL,
    
    money INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    "limit" INTEGER DEFAULT 10,
    coins INTEGER DEFAULT 100,
    ia_credits INTEGER DEFAULT 5,
    message_count INTEGER DEFAULT 0,
    play_timestamp TEXT,
    
    banned INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    
    rol_user TEXT DEFAULT 'Aspirante',
    wallet_id INTEGER UNIQUE,
    purchase_id TEXT UNIQUE
);
`);

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

db.exec(`CREATE TABLE IF NOT EXISTS groups (
    group_id TEXT PRIMARY KEY,
    name TEXT,
    registered_at TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
);`);

db.exec(`CREATE TABLE IF NOT EXISTS bot_settings (
    bot_jid TEXT PRIMARY KEY,
    anticall INTEGER DEFAULT 1
);`);

db.exec(`CREATE TABLE IF NOT EXISTS group_settings (
    group_id TEXT PRIMARY KEY,
    welcome INTEGER DEFAULT 1,
    antilink INTEGER DEFAULT 0,
    antilink2 INTEGER DEFAULT 0,
    antitoxic INTEGER DEFAULT 0,
    antifake INTEGER DEFAULT 0,
    antiarabe INTEGER DEFAULT 0,
    modeadmin INTEGER DEFAULT 0,
    detect INTEGER DEFAULT 1,
    max_warnings INTEGER DEFAULT 3
);`);

db.exec(`CREATE TABLE IF NOT EXISTS user_warnings (
    warning_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    reason TEXT,
    given_by TEXT NOT NULL,
    timestamp TEXT NOT NULL
);`);

db.exec(`CREATE TABLE IF NOT EXISTS warn_kicks (
    kick_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    reason TEXT,
    timestamp TEXT NOT NULL
);`);

db.exec(`CREATE TABLE IF NOT EXISTS blocked_users (
    block_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    blocked_by TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    UNIQUE(group_id, user_phone)
);`);

// --- Declaración de Consultas ---
const UPSERT_QUERY = `
INSERT INTO users (user_phone, internal_id, name, age, country, alias, email, created_at, money, level, exp, "limit", banned, is_admin, play_timestamp, coins, ia_credits, message_count, rol_user, wallet_id, purchase_id)
VALUES (@user_phone, @internal_id, @name, @age, @country, @alias, @email, @created_at, @money, @level, @exp, @limit, @banned, @is_admin, @play_timestamp, @coins, @ia_credits, @message_count, @rol_user, @wallet_id, @purchase_id)
ON CONFLICT(user_phone)
DO UPDATE SET
    name=COALESCE(@name, name),
    alias=COALESCE(@alias, alias),
    age=COALESCE(@age, age),
    country=COALESCE(@country, country),
    email=COALESCE(@email, email),
    rol_user=COALESCE(@rol_user, rol_user),
    wallet_id=COALESCE(@wallet_id, wallet_id),
    purchase_id=COALESCE(@purchase_id, purchase_id),
    coins=COALESCE(@coins, coins),
    ia_credits=COALESCE(@ia_credits, ia_credits),
    message_count=COALESCE(@message_count, message_count),
    money=COALESCE(@money, money),
    level=COALESCE(@level, level),
    exp=COALESCE(@exp, exp),
    "limit"=COALESCE(@limit, "limit"),
    banned=COALESCE(@banned, banned),
    is_admin=COALESCE(@is_admin, is_admin),
    play_timestamp=COALESCE(@play_timestamp, play_timestamp)
`;

const WALLET_QUERY = `SELECT * FROM users WHERE wallet_id = ?`;
const PURCHASE_QUERY = `SELECT * FROM users WHERE purchase_id = ?`;

// --- Preparación de Statements ---
let upsertUserStmt = db.prepare(UPSERT_QUERY);
let getUserByWalletIdStmt = db.prepare(WALLET_QUERY);
let getUserByPurchaseIdStmt = db.prepare(PURCHASE_QUERY);

// --- Statements base ---
const getUserByPhoneStmt = db.prepare(`SELECT * FROM users WHERE user_phone = ?`);
const getUserByAliasStmt = db.prepare(`SELECT * FROM users WHERE lower(alias) = lower(?)`);
const deleteUserByPhoneStmt = db.prepare(`DELETE FROM users WHERE user_phone = ?`);
const isAdminStmt = db.prepare(`SELECT is_admin FROM users WHERE user_phone = ?`);
const addAdminStmt = db.prepare(`UPDATE users SET is_admin = 1 WHERE user_phone = ?`);
const delAdminStmt = db.prepare(`UPDATE users SET is_admin = 0 WHERE user_phone = ?`);
const getBotAdminsStmt = db.prepare(`SELECT user_phone, alias FROM users WHERE is_admin = 1`);
const getAllUsersSortedStmt = db.prepare(`SELECT user_phone, alias, created_at FROM users ORDER BY created_at DESC`);
const getGroupSettingsStmt = db.prepare(`SELECT * FROM group_settings WHERE group_id = ?`);
const upsertGroupSettingsStmt = db.prepare(`INSERT INTO group_settings (group_id) VALUES (?) ON CONFLICT(group_id) DO NOTHING`);
const upsertGroupStmt = db.prepare(`INSERT INTO groups (group_id, name, registered_at, is_active) VALUES (?, ?, ?, 1) ON CONFLICT(group_id) DO UPDATE SET name=excluded.name`);
const isGroupActiveStmt = db.prepare(`SELECT is_active FROM groups WHERE group_id = ?`);
const toggleGroupStatusStmt = db.prepare(`UPDATE groups SET is_active = ? WHERE group_id = ?`);
const getAllGroupsStmt = db.prepare(`SELECT * FROM groups ORDER BY registered_at DESC`);
const getBotSettingsStmt = db.prepare(`SELECT * FROM bot_settings WHERE bot_jid = ?`);
const upsertBotSettingsStmt = db.prepare(`INSERT INTO bot_settings (bot_jid) VALUES (?) ON CONFLICT(bot_jid) DO NOTHING`);
const addWarningStmt = db.prepare(`INSERT INTO user_warnings (group_id, user_phone, reason, given_by, timestamp) VALUES (?, ?, ?, ?, ?)`);
const getWarningsForUserStmt = db.prepare(`SELECT * FROM user_warnings WHERE group_id = ? AND user_phone = ? ORDER BY timestamp DESC`);
const removeWarningStmt = db.prepare(`DELETE FROM user_warnings WHERE warning_id = ?`);
const clearWarningsStmt = db.prepare(`DELETE FROM user_warnings WHERE group_id = ? AND user_phone = ?`);
const getWarnedUsersStmt = db.prepare(`SELECT user_phone, COUNT(warning_id) as warn_count FROM user_warnings WHERE group_id = ? GROUP BY user_phone ORDER BY warn_count DESC`);
const setMaxWarningsStmt = db.prepare(`UPDATE group_settings SET max_warnings = ? WHERE group_id = ?`);
const logWarnKickStmt = db.prepare(`INSERT INTO warn_kicks (group_id, user_phone, reason, timestamp) VALUES (?, ?, ?, ?)`);
const blockUserStmt = db.prepare(`INSERT OR IGNORE INTO blocked_users (group_id, user_phone, blocked_by, timestamp) VALUES (?, ?, ?, ?)`);
const unblockUserStmt = db.prepare(`DELETE FROM blocked_users WHERE group_id = ? AND user_phone = ?`);
const isUserBlockedStmt = db.prepare(`SELECT 1 FROM blocked_users WHERE group_id = ? AND user_phone = ?`);
const getBlockedUsersStmt = db.prepare(`SELECT * FROM blocked_users WHERE group_id = ? ORDER BY timestamp DESC`);
const incrementMessageCountStmt = db.prepare(`UPDATE users SET message_count = message_count + 1 WHERE user_phone = ?`);
const getTopUsersByMessagesStmt = db.prepare(`SELECT alias, message_count FROM users WHERE message_count > 0 ORDER BY message_count DESC LIMIT ?`);

// --- NUEVA FUNCIÓN: Conteo total de usuarios registrados ---
function countUsers() {
    try {
        const row = db.prepare('SELECT COUNT(*) AS total FROM users').get();
        return row?.total || 0;
    } catch (err) {
        console.error(chalk.red(`[DB ERROR] countUsers: ${err.message}`));
        return 0;
    }
}

// --- Funciones principales ---
function insertOrUpdateUser(user) {
    if(!user || !user.user_phone) return;
    user.user_phone = normalizePhone(user.user_phone);
    user.internal_id = user.internal_id ?? uuidv4();
    user.created_at = user.created_at ?? new Date().toISOString();

    const defaults = {
        name: null, age: null, country: null, alias: null, email: null,
        money: 0, level: 1, exp: 0, limit: 10, banned: 0, is_admin: 0, play_timestamp: null,
        rol_user: 'Aspirante', wallet_id: null, purchase_id: null,
        coins: 100, ia_credits: 5, message_count: 0
    };

    for (const k in defaults) {
        if (user[k] === undefined) user[k] = defaults[k];
    }

    // Normalizar tipos para SQLite
    user.age = user.age !== null ? Number(user.age) : null;
    user.money = Number(user.money);
    user.level = Number(user.level);
    user.exp = Number(user.exp);
    user.limit = Number(user.limit);
    user.banned = user.banned ? 1 : 0;
    user.is_admin = user.is_admin ? 1 : 0;
    user.wallet_id = user.wallet_id !== null ? Number(user.wallet_id) : null;
    user.coins = Number(user.coins);
    user.ia_credits = Number(user.ia_credits);
    user.message_count = Number(user.message_count);

    return upsertUserStmt.run(user);
}

// --- Funciones de usuario ---
function getUserByPhone(phone) { return getUserByPhoneStmt.get(phone); }
function getUserByAlias(alias) { return getUserByAliasStmt.get(alias); }
function getUserByWalletId(walletId) { return getUserByWalletIdStmt.get(walletId); }
function getUserByPurchaseId(purchaseId) { return getUserByPurchaseIdStmt.get(purchaseId); }
function deleteUserByPhone(phone) { return deleteUserByPhoneStmt.run(phone); }
function getAllUsersSortedByDate() { return getAllUsersSortedStmt.all(); }
function isAdmin(phone) { return isAdminStmt.get(phone)?.is_admin === 1; }
function addAdmin(phone) { return addAdminStmt.run(phone); }
function delAdmin(phone) { return delAdminStmt.run(phone); }
function getBotAdmins() { return getBotAdminsStmt.all(); }

// --- Funciones de grupo ---
function registerGroup(groupId, groupName) { return upsertGroupStmt.run(groupId, groupName, new Date().toISOString()); }
function isGroupActive(groupId) { const r = isGroupActiveStmt.get(groupId); return r ? r.is_active === 1 : false; }
function toggleGroupStatus(groupId, status) { return toggleGroupStatusStmt.run(status ? 1 : 0, groupId); }
function getAllGroups() { return getAllGroupsStmt.all(); }
function getChatSettings(groupId) { upsertGroupSettingsStmt.run(groupId); return getGroupSettingsStmt.get(groupId) || {}; }
function setChatSetting(groupId, setting, value) { const a = ['welcome','antilink','antilink2','antitoxic','antifake','antiarabe','modeadmin','detect']; if (!a.includes(setting)) throw new Error(`Invalid setting: ${setting}`); const s = db.prepare(`UPDATE group_settings SET ${setting} = ? WHERE group_id = ?`); return s.run(value ? 1 : 0, groupId); }

// --- Funciones de moderación ---
function addWarning(groupId, userPhone, reason, givenBy) { const nG = givenBy.split('@')[0]; return addWarningStmt.run(groupId, userPhone, reason, nG, new Date().toISOString()); }
function getWarningsForUser(groupId, userPhone) { return getWarningsForUserStmt.all(groupId, userPhone); }
function removeWarning(warningId) { return removeWarningStmt.run(warningId); }
function clearWarnings(groupId, userPhone) { return clearWarningsStmt.run(groupId, userPhone); }
function getWarnedUsers(groupId) { return getWarnedUsersStmt.all(groupId); }
function setMaxWarnings(groupId, max) { return setMaxWarningsStmt.run(max, groupId); }
function logWarnKick(groupId, userPhone, reason) { return logWarnKickStmt.run(groupId, userPhone, reason, new Date().toISOString()); }
function blockUserInGroup(groupId, userPhone, blockedBy) { const nB = blockedBy.split('@')[0]; return blockUserStmt.run(groupId, userPhone, nB, new Date().toISOString()); }
function unblockUserInGroup(groupId, userPhone) { return unblockUserStmt.run(groupId, userPhone); }
function isUserBlockedInGroup(groupId, userPhone) { return !!isUserBlockedStmt.get(groupId, userPhone); }
function getBlockedUsersInGroup(groupId) { return getBlockedUsersStmt.all(groupId); }

// --- Funciones de bot y economía ---
function getBotSettings(botJid) { upsertBotSettingsStmt.run(botJid); return getBotSettingsStmt.get(botJid) || {}; }
function incrementMessageCount(phone) { return incrementMessageCountStmt.run(phone); }
function getTopUsersByMessages(limit = 10) { return getTopUsersByMessagesStmt.all(limit); }
function addCoins(phone, amount) { return db.prepare(`UPDATE users SET coins = coins + ? WHERE user_phone = ?`).run(amount, phone); }
function removeCoins(phone, amount) { return db.prepare(`UPDATE users SET coins = MAX(0, coins - ?) WHERE user_phone = ?`).run(amount, phone); }
function addIaCredits(phone, amount) { return db.prepare(`UPDATE users SET ia_credits = ia_credits + ? WHERE user_phone = ?`).run(amount, phone); }
function removeIaCredits(phone, amount) { return db.prepare(`UPDATE users SET ia_credits = MAX(0, ia_credits - ?) WHERE user_phone = ?`).run(amount, phone); }
function reduceLimit(phone, amount = 1) { return db.prepare(`UPDATE users SET "limit" = MAX(0, "limit" - ?) WHERE user_phone = ?`).run(amount, phone); }
function addExp(phone, amount = 1) { return db.prepare(`UPDATE users SET exp = exp + ? WHERE user_phone = ?`).run(amount, phone); }
function resetPlayLimitIfNeeded(phone) { return db.prepare(`UPDATE users SET "limit" = 10 WHERE user_phone=? AND (play_timestamp IS NULL OR JULIANDAY('now')-JULIANDAY(play_timestamp)>=1)`).run(phone); }
function updatePlayTimestamp(phone) { return db.prepare(`UPDATE users SET play_timestamp=? WHERE user_phone=?`).run(new Date().toISOString(), phone); }

// --- Función universal ---
function getUserAny(identifier) {
    if (!identifier || typeof identifier !== 'string') return null;
    if (identifier.includes('@')) identifier = identifier.split('@')[0].replace(/\D/g, '');
    
    let user = getUserByPhone(identifier);
    if (user) return user;

    if (/^\d+$/.test(identifier) && identifier.length < 10) {
        user = getUserByWalletId(Number(identifier));
        if (user) return user;
    }

    user = getUserByAlias(identifier);
    if (user) return user;

    return getUserByPurchaseId(identifier);
}

// --- EXPORTACIÓN FINAL ---
module.exports = {
    db, normalizePhone, insertOrUpdateUser, getUserByPhone, getUserByAlias, getUserByWalletId, getUserByPurchaseId, deleteUserByPhone, getAllUsersSortedByDate,
    isAdmin, addAdmin, delAdmin, getBotAdmins,
    registerGroup, isGroupActive, toggleGroupStatus, getAllGroups, getChatSettings, setChatSetting,
    addWarning, getWarningsForUser, removeWarning, clearWarnings, getWarnedUsers, setMaxWarnings, logWarnKick,
    blockUserInGroup, unblockUserInGroup, isUserBlockedInGroup, getBlockedUsersInGroup,
    getBotSettings, incrementMessageCount, getTopUsersByMessages,
    reduceLimit, addExp, resetPlayLimitIfNeeded, updatePlayTimestamp,
    addCoins, removeCoins, addIaCredits, removeIaCredits,
    getUserAny,
    countUsers // 🔥 NUEVA FUNCIÓN EXPORTADA
};
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
