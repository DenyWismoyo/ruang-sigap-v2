var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs = require('fs');
// Load .env.local manually
try {
    var envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split(/\r?\n/).forEach(function (line) {
        var match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            var key = match[1].trim();
            var value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}
catch (e) {
    console.error("Gagal membaca .env.local", e);
}
var admin = require('firebase-admin');
var getFirestore = require('firebase-admin/firestore').getFirestore;
if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log("Menggunakan kredensial dari .env.local");
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}
else if (!process.env.FIRESTORE_EMULATOR_HOST && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn("WARNING: FIRESTORE_EMULATOR_HOST atau GOOGLE_APPLICATION_CREDENTIALS tidak diset.");
    console.warn("Skrip ini akan menggunakan default credentials jika tersedia.");
    admin.initializeApp();
}
else {
    admin.initializeApp();
}
var db = getFirestore("database-siyap");
// Peta bantuan untuk memetakan jabatanId -> userId
var jabatanToUserMap = {};
function buildUserMap() {
    return __awaiter(this, void 0, void 0, function () {
        var snapshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.collection('users').get()];
                case 1:
                    snapshot = _a.sent();
                    snapshot.forEach(function (doc) {
                        var data = doc.data();
                        if (data.jabatanId) {
                            jabatanToUserMap[data.jabatanId] = data.uid || doc.id;
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function getUserId(jabatanId) {
    return jabatanToUserMap[jabatanId] || null;
}
// Logbook Helper
var logbookUpdates = {};
function addLogbookEntry(userId, opdId, timestamp, kegiatanData) {
    if (!userId || !timestamp)
        return;
    var date = timestamp instanceof admin.firestore.Timestamp ? timestamp.toDate() : timestamp;
    if (isNaN(date.getTime()))
        return;
    var dateStr = date.toISOString().split('T')[0];
    var docId = "".concat(userId, "_").concat(dateStr);
    if (!logbookUpdates[docId]) {
        var t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        logbookUpdates[docId] = {
            userId: userId,
            opdId: opdId || '',
            tanggal: t,
            kegiatan: []
        };
    }
    logbookUpdates[docId].kegiatan.push(__assign({ id: "backfill_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 9)), createdAt: new Date().toISOString(), sumber: 'backfill' }, kegiatanData));
}
function backfillTugas() {
    return __awaiter(this, void 0, void 0, function () {
        var snap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Memproses Tugas...");
                    return [4 /*yield*/, db.collection('tugas').get()];
                case 1:
                    snap = _a.sent();
                    console.log("Ditemukan ".concat(snap.size, " dokumen tugas"));
                    snap.forEach(function (doc) {
                        var data = doc.data();
                        // Pemberi Tugas
                        if (data.dariJabatanId && data.tanggalDibuat) {
                            var pemberiId = getUserId(data.dariJabatanId);
                            if (pemberiId) {
                                addLogbookEntry(pemberiId, data.opdId, data.tanggalDibuat, {
                                    deskripsi: "Memberikan tugas: \"".concat(data.judulTugas, "\" kepada ").concat(data.kepadaJabatanNama || 'Bawahan'),
                                    selesai: true,
                                    tugasTerkaitId: doc.id,
                                    tugasTerkaitJudul: data.judulTugas,
                                    kategori: 'Tugas'
                                });
                            }
                        }
                        // Penerima Tugas (Status Selesai)
                        if (data.status === 'Selesai' && data.kepadaJabatanId && data.tanggalSelesai) {
                            var penerimaId = getUserId(data.kepadaJabatanId);
                            if (penerimaId) {
                                addLogbookEntry(penerimaId, data.opdId, data.tanggalSelesai, {
                                    deskripsi: "Menyelesaikan tugas: \"".concat(data.judulTugas, "\""),
                                    selesai: true,
                                    tugasTerkaitId: doc.id,
                                    tugasTerkaitJudul: data.judulTugas,
                                    kategori: 'Tugas'
                                });
                            }
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function backfillDisposisi() {
    return __awaiter(this, void 0, void 0, function () {
        var snap, suratMap, suratSnap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Memproses Disposisi...");
                    return [4 /*yield*/, db.collection('disposisi').get()];
                case 1:
                    snap = _a.sent();
                    console.log("Ditemukan ".concat(snap.size, " dokumen disposisi"));
                    suratMap = {};
                    return [4 /*yield*/, db.collection('surat').get()];
                case 2:
                    suratSnap = _a.sent();
                    suratSnap.forEach(function (s) {
                        suratMap[s.id] = s.data().perihal || 'Surat';
                    });
                    snap.forEach(function (doc) {
                        var data = doc.data();
                        var perihal = suratMap[data.suratId] || 'Surat';
                        // Pengirim
                        if (data.dariJabatanId && data.tanggalDisposisi) {
                            var pengirimId = getUserId(data.dariJabatanId);
                            if (pengirimId) {
                                addLogbookEntry(pengirimId, data.opdId || data.dariOpdId, data.tanggalDisposisi, {
                                    deskripsi: "Mendisposisikan surat: \"".concat(perihal, "\""),
                                    selesai: true,
                                    disposisiTerkaitId: doc.id,
                                    suratTerkaitId: data.suratId,
                                    suratPerihal: perihal,
                                    kategori: 'Disposisi'
                                });
                            }
                        }
                        // Penerima
                        if (data.penerimaDiterima && Array.isArray(data.penerimaDiterima)) {
                            data.penerimaDiterima.forEach(function (jabatanId) {
                                var penerimaId = getUserId(jabatanId);
                                if (penerimaId && data.tanggalDisposisi) { // Approximation for when they accepted it
                                    addLogbookEntry(penerimaId, data.opdId || data.dariOpdId, data.tanggalDisposisi, {
                                        deskripsi: "Menerima disposisi surat: \"".concat(perihal, "\""),
                                        selesai: true,
                                        disposisiTerkaitId: doc.id,
                                        suratTerkaitId: data.suratId,
                                        suratPerihal: perihal,
                                        kategori: 'Disposisi'
                                    });
                                }
                            });
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function backfillTindakLanjut() {
    return __awaiter(this, void 0, void 0, function () {
        var snap, suratMap, suratSnap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Memproses Tindak Lanjut...");
                    return [4 /*yield*/, db.collection('tindakLanjut').get()];
                case 1:
                    snap = _a.sent();
                    console.log("Ditemukan ".concat(snap.size, " dokumen tindak lanjut"));
                    suratMap = {};
                    return [4 /*yield*/, db.collection('surat').get()];
                case 2:
                    suratSnap = _a.sent();
                    suratSnap.forEach(function (s) {
                        suratMap[s.id] = s.data().perihal || 'Surat';
                    });
                    snap.forEach(function (doc) {
                        var data = doc.data();
                        var perihal = suratMap[data.suratId] || 'Surat';
                        if (data.userId && data.tanggalLaporan) {
                            addLogbookEntry(data.userId, data.opdId, data.tanggalLaporan, {
                                deskripsi: "Tindak Lanjut Surat: \"".concat(perihal, "\" - ").concat(data.judulLaporan || 'Proses'),
                                selesai: false,
                                suratTerkaitId: data.suratId,
                                suratPerihal: perihal,
                                kategori: 'Laporan'
                            });
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function runBackfill() {
    return __awaiter(this, void 0, void 0, function () {
        var batch, count, _i, _a, _b, docId, data, docRef, e_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 11, , 12]);
                    console.log("Membangun referensi User...");
                    return [4 /*yield*/, buildUserMap()];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, backfillTugas()];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, backfillDisposisi()];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, backfillTindakLanjut()];
                case 4:
                    _d.sent();
                    console.log("Menyimpan ".concat(Object.keys(logbookUpdates).length, " dokumen logbook harian..."));
                    batch = db.batch();
                    count = 0;
                    _i = 0, _a = Object.entries(logbookUpdates);
                    _d.label = 5;
                case 5:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    _b = _a[_i], docId = _b[0], data = _b[1];
                    docRef = db.collection('logbookHarian').doc(docId);
                    // We use arrayUnion to merge with existing data
                    batch.set(docRef, {
                        userId: data.userId,
                        opdId: data.opdId,
                        tanggal: admin.firestore.Timestamp.fromDate(data.tanggal),
                        kegiatan: (_c = admin.firestore.FieldValue).arrayUnion.apply(_c, data.kegiatan)
                    }, { merge: true });
                    count++;
                    if (!(count >= 400)) return [3 /*break*/, 7];
                    return [4 /*yield*/, batch.commit()];
                case 6:
                    _d.sent();
                    console.log("Committed 400 documents...");
                    batch = db.batch();
                    count = 0;
                    _d.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8:
                    if (!(count > 0)) return [3 /*break*/, 10];
                    return [4 /*yield*/, batch.commit()];
                case 9:
                    _d.sent();
                    console.log("Committed remaining ".concat(count, " documents..."));
                    _d.label = 10;
                case 10:
                    console.log("Backfill Logbook Selesai!");
                    return [3 /*break*/, 12];
                case 11:
                    e_1 = _d.sent();
                    console.error("Error during backfill:", e_1);
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
runBackfill();
