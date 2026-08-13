const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'index.ts');
const code = fs.readFileSync(srcPath, 'utf8');
const lines = code.split('\n');

// Types (Lines 68-301, 0-indexed: 67 to 300)
let typeLines = lines.slice(68, 301).map(l => l.startsWith('interface ') ? 'export ' + l : l);
fs.writeFileSync(path.join(__dirname, 'src', 'types', 'index.ts'), typeLines.join('\n'));

// Helpers (Lines 302-475, 689-708, 1165-1178, 2990-3064)
let helperLines = [
    ...lines.slice(301, 475),
    ...lines.slice(688, 708),
    ...lines.slice(1164, 1178),
    ...lines.slice(2989, 3064)
];
// export helpers
helperLines = helperLines.map(l => {
    if (l.startsWith('const ') && !l.includes('export ')) return l.replace('const ', 'export const ');
    if (l.startsWith('let ') && !l.includes('export ')) return l.replace('let ', 'export let ');
    if (l.startsWith('function ') && !l.includes('export ')) return l.replace('function ', 'export function ');
    return l;
});

const helperImports = `import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { google } from "googleapis";
import { db } from "../config/firebase";
import { UserProfile } from "../types";
`;
fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'helpers.ts'), helperImports + '\n' + helperLines.join('\n'));

// API (Lines 476-688, 1179-1360, 2945-2989)
let apiLines = [
    ...lines.slice(475, 688),
    ...lines.slice(1178, 1360),
    ...lines.slice(2944, 2989)
];

// Triggers (Lines 709-1164, 1361-2289)
let triggerLines = [
    ...lines.slice(708, 1164),
    ...lines.slice(1360, 2289)
];

// Cron (Lines 2290-2944, 3065-3129)
let cronLines = [
    ...lines.slice(2289, 2944),
    ...lines.slice(3064)
];

const sharedImports = `import * as functions from "firebase-functions/v1";
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { google } from "googleapis";
import { isEqual } from "lodash";
import { db, storage, REGION } from "../config/firebase";
import { 
  userNameCache, userIdCache, getUserNameFromJabatanId, getUserNameFromUid, 
  generateSearchKeywords, createRfc3339DateTimeWIB, createCalendarEvent, 
  getUserIdFromJabatanId, updateUserSummary, checkPermission, sendFcmMessageByUid 
} from "../utils/helpers";
import { 
  UserProfile, Jabatan, Surat, Disposisi, Tugas, SubTugas, TugasLampiran, 
  AgendaDetail, RiwayatPersetujuan, DrafPersetujuan, ApprovalStep, Pengumuman, 
  OPD, KinerjaPerPenggunaHarian, Notification, Tagihan, PricingPackage, OpdConfig, JadwalTempat, Timestamp 
} from "../types";

// Fallback jika ada yang terlupa
import { getFirestore } from "firebase-admin/firestore";
`;

fs.writeFileSync(path.join(__dirname, 'src', 'api', 'index.ts'), sharedImports + '\n' + apiLines.join('\n'));
fs.writeFileSync(path.join(__dirname, 'src', 'triggers', 'index.ts'), sharedImports + '\n' + triggerLines.join('\n'));
fs.writeFileSync(path.join(__dirname, 'src', 'cron', 'index.ts'), sharedImports + '\n' + cronLines.join('\n'));

// Replace original index.ts
const newIndex = `export * from "./api";
export * from "./triggers";
export * from "./cron";

// Export module lainnya
export * from "./aiFunctions";
export * from "./agregasiSummaries";
export * from "./masterDataAggregator";
export * from "./taskWorkers";
export * from "./autoHeal";
export * from "./backupFunction";
`;

fs.copyFileSync(srcPath, path.join(__dirname, 'src', 'index.backup.ts'));
fs.writeFileSync(srcPath, newIndex);

console.log("Refactoring part 2 complete!");
