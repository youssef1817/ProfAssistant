import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs-extra';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { checkAndDownloadOfflineDeps } from './offline_downloader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));


const UPLOADS_DIR = process.env.APP_DATA_DIR ? path.join(process.env.APP_DATA_DIR, 'uploads') : path.join(__dirname, '..', 'uploads/');
fs.ensureDirSync(UPLOADS_DIR);
const upload = multer({ dest: UPLOADS_DIR });

const DATA_DIR = process.env.EXCEL_REPOSITORY_DIR || path.join(__dirname, '..', '..', 'مستودع النقط');
const DB_FILE = process.env.APP_DATA_DIR ? path.join(process.env.APP_DATA_DIR, 'database.json') : path.join(__dirname, '..', 'database.json');

// Ensure directory exists and configure custom sync icon
async function ensureDataDir() {
    await fs.ensureDir(DATA_DIR);
    const iniPath = path.join(DATA_DIR, 'desktop.ini');
    if (!(await fs.pathExists(iniPath))) {
        const iniContent = `[.ShellClassInfo]\r\nIconResource=C:\\Windows\\System32\\shell32.dll,238\r\n[ViewState]\r\nMode=\r\nVid=\r\nFolderType=Generic\r\n`;
        try {
            await fs.writeFile(iniPath, iniContent, 'utf8');
            exec(`attrib +h +s "${iniPath}" & attrib +r "${DATA_DIR}"`);
        } catch (e) {
            console.error("Error setting custom folder icon:", e);
        }
    }
}
ensureDataDir().catch(console.error);

// Load DB
async function loadDB() {
    if (await fs.pathExists(DB_FILE)) {
        return fs.readJson(DB_FILE);
    }
    return { students: {}, classes: {}, subjects: [] };
}

async function saveDB(db) {
    await fs.writeJson(DB_FILE, db, { spaces: 2 });
}

app.post('/upload', upload.array('files'), async (req, res) => {
    const files = req.files;
    const db = await loadDB();
    const results = [];

    for (const file of files) {
        try {
            const fileBuffer = await fs.readFile(file.path);
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheet = workbook.Sheets['EvaluationLivretsCompetence'];
            if (!sheet) {
                results.push({ name: file.originalname, status: 'error', message: 'لم يتم العثور على ورقة النتائج (EvaluationLivretsCompetence)' });
                await fs.remove(file.path).catch(() => {});
                continue;
            }

            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Robust extraction of Level, Subject, Stage, School Name, and Year
            let level = "";
            let subject = "";
            let stageNum = null;
            let schoolName = "";
            let schoolYear = "";
            let teacherName = "";

            // Search first 20 rows for metadata
            for (let r = 0; r < 20; r++) {
                const row = data[r];
                if (!row) continue;
                for (let c = 0; c < row.length; c++) {
                    const cell = String(row[c] || "");
                    if (cell.includes("المستوى")) level = String(row[c+1] || "").trim();
                    if (cell.includes("المادة")) subject = String(row[c+1] || "").trim();
                    if (cell.includes("الأستاذ") || cell.includes("المدرس")) teacherName = String(row[c+1] || "").trim();
                    if (cell.includes("المؤسسة")) schoolName = String(row[c+1] || "").trim();
                    if (cell.includes("السنة الدراسية") || cell.includes("الموسم الدراسي")) schoolYear = String(row[c+1] || "").trim();
                    if (cell.includes("المرحلة") && !stageNum) {
                        const val = String(row[c+1] || cell); // Check current or next cell
                        const match = val.match(/\d/);
                        if (match) stageNum = match[0];
                    }
                }
            }

            if (schoolName) db.schoolName = schoolName;
            if (schoolYear) db.schoolYear = schoolYear;
            if (!db.teachers) db.teachers = {};
            if (teacherName && subject) db.teachers[subject] = teacherName;



            if (!stageNum || !subject) {
                // Fallback for stage if not found in cells
                const stageText = data[15]?.[6] || data[7]?.[3]; // Check common positions
                const stageMatch = String(stageText || "").match(/\d/);
                stageNum = stageNum || (stageMatch ? stageMatch[0] : null);
            }

            if (!stageNum) {
                results.push({ name: file.originalname, status: 'error', message: 'لم يتم التعرف على رقم المرحلة (1-4). تأكد من صحة الملف.' });
                continue;
            }

            const targetPath = path.join(DATA_DIR, file.originalname);

            // Organise File (Copy + Remove instead of Move for better lock handling on Windows)
            let fileMoved = true;
            let moveWarning = null;
            try {
                await ensureDataDir();
                await fs.copy(file.path, targetPath, { overwrite: true });
                await fs.remove(file.path).catch(() => {});
            } catch (moveError) {
                if (moveError.code === 'EBUSY') {
                    fileMoved = false;
                    moveWarning = `تم تحديث البيانات للمرحلة ${stageNum} بنجاح، لكن تعذر استبدال ملف Excel في المجلد.`;
                    await fs.remove(file.path).catch(() => {});
                } else {
                    throw moveError;
                }
            }

            // Process Student Data
            // ... (rest of the processing logic continues here)

            // Process Student Data
            let studentsProcessed = 0;
            for (let i = 23; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length < 3 || !row[2]) continue;

                const massarId = String(row[2]).trim();
                const name = String(row[3] || "").trim();
                const className = String(row[4] || "").trim();
                const average = row[12];

                if (!massarId || massarId.includes("رقم مسار") || massarId === "null") continue;

                if (!db.students[massarId]) {
                    db.students[massarId] = {
                        name,
                        massarId,
                        class: className,
                        level,
                        grades: {}
                    };
                }

                if (!db.students[massarId].grades[subject]) {
                    db.students[massarId].grades[subject] = {};
                }

                db.students[massarId].grades[subject][`stage${stageNum}`] = average;
                studentsProcessed++;
            }
            console.log(`Successfully processed ${studentsProcessed} students for ${subject} (Stage ${stageNum})`);

            if (!db.subjects.includes(subject)) db.subjects.push(subject);

            results.push({ 
                name: file.originalname, 
                status: moveWarning ? 'warning' : 'success', 
                stage: stageNum, 
                subject,
                message: moveWarning 
            });
        } catch (error) {
            console.error(error);
            results.push({ name: file.originalname, status: 'error', message: error.message });
        }
    }

    await saveDB(db);
    console.log(`Database saved successfully. Current student count: ${Object.keys(db.students).length}`);
    res.json(results);
});

app.post('/save-note', async (req, res) => {
    const { massarId, note } = req.body;
    const db = await loadDB();
    if (db.students[massarId]) {
        db.students[massarId].note = note;
        await saveDB(db);
        res.json({ status: 'success' });
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

app.get('/data', async (req, res) => {
    const db = await loadDB();
    res.json(db);
});

app.get('/check-new-files', async (req, res) => {
    try {
        const db = await loadDB();
        const synced = db.syncedFiles || [];
        
        // Scan DATA_DIR for .xlsx files
        await ensureDataDir();
        const files = await fs.readdir(DATA_DIR);
        const xlsxFiles = files.filter(f => f.endsWith('.xlsx'));
        
        const newFiles = xlsxFiles.filter(f => !synced.includes(f));
        res.json({
            hasNewFiles: newFiles.length > 0,
            newFiles
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/trigger-sync', async (req, res) => {
    console.log("Triggering DB Sync from API...");
    exec('node scripts/sync_db.mjs', async (error, stdout, stderr) => {
        if (error) {
            console.error(`Sync error: ${error.message}`);
            return res.status(500).json({ error: error.message, stderr });
        }
        console.log(`Sync output: ${stdout}`);
        res.json({ status: 'success', stdout });
    });
});

app.post('/wipe-data', async (req, res) => {
    console.log("Wiping all database records and repository files...");
    try {
        // 1. Reset database.json
        const cleanDB = { students: {}, classes: {}, subjects: [], syncedFiles: [], teachers: {} };
        await fs.writeJson(DB_FILE, cleanDB, { spaces: 2 });


        // 2. Empty DATA_DIR (مستودع النقط) - delete all .xlsx files
        await ensureDataDir();
        const files = await fs.readdir(DATA_DIR);
        for (const file of files) {
            if (file.endsWith('.xlsx')) {
                await fs.remove(path.join(DATA_DIR, file));
            }
        }

        res.json({ status: 'success' });
    } catch (e) {
        console.error("Wipe error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Trigger offline enabler cache check
checkAndDownloadOfflineDeps().catch(console.error);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
