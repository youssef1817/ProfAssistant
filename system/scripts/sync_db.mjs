import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', 'مستودع النقط');
const DB_FILE = path.join(__dirname, '..', 'database.json');

async function getAllXlsxFiles(dir, files = []) {
    const list = await fs.readdir(dir);
    for (const item of list) {
        const fullPath = path.join(dir, item);
        const stat = await fs.lstat(fullPath);
        if (stat.isDirectory()) {
            await getAllXlsxFiles(fullPath, files);
        } else if (item.endsWith('.xlsx')) {
            files.push(fullPath);
        }
    }
    return files;
}

async function sync() {
    console.log("Starting intelligent programmatic sync...");
    let db = { students: {}, subjects: [] };
    if (await fs.pathExists(DB_FILE)) {
        db = await fs.readJson(DB_FILE);
    }

    let schoolName = "";
    let schoolYear = "";

    if (!(await fs.pathExists(DATA_DIR))) {
        console.log("DATA_DIR (مستودع النقط) not found! Creating it automatically...");
        await fs.ensureDir(DATA_DIR);
        const iniPath = path.join(DATA_DIR, 'desktop.ini');
        const iniContent = `[.ShellClassInfo]\r\nIconResource=C:\\Windows\\System32\\shell32.dll,238\r\n[ViewState]\r\nMode=\r\nVid=\r\nFolderType=Generic\r\n`;
        try {
            await fs.writeFile(iniPath, iniContent, 'utf8');
            exec(`attrib +h +s "${iniPath}" & attrib +r "${DATA_DIR}"`);
        } catch (e) {
            console.error("Error setting custom folder icon:", e);
        }
    }

    const allFiles = await getAllXlsxFiles(DATA_DIR);
    console.log(`Found ${allFiles.length} Excel files to process.`);

    for (const filePath of allFiles) {
        const fileName = path.basename(filePath);
        try {
            // Stage from Folder Name
            let stageNum = null;
            const folderName = path.basename(path.dirname(filePath));
            const folderMatch = folderName.match(/\d/);
            if (folderMatch) stageNum = folderMatch[0];

            const fileBuffer = await fs.readFile(filePath);
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheet = workbook.Sheets['EvaluationLivretsCompetence'];
            if (!sheet) continue;

            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            let level = "";
            let subject = "";
            let avgCol = 12; // Default fallback

            // Metadata & Column Search
            for (let r = 0; r < 23; r++) {
                const row = data[r];
                if (!row) continue;
                for (let c = 0; c < row.length; c++) {
                    const cell = String(row[c] || "");
                    if (cell.includes("المستوى")) level = String(row[c+1] || "").trim();
                    if (cell.includes("المادة")) subject = String(row[c+1] || "").trim();
                    if (cell.includes("المؤسسة")) schoolName = String(row[c+1] || "").trim();
                    if (cell.includes("السنة الدراسية") || cell.includes("الموسم الدراسي")) schoolYear = String(row[c+1] || "").trim();
                    if (cell.includes("المرحلة") && !stageNum) {
                        const val = String(row[c+1] || cell);
                        const match = val.match(/\d/);
                        if (match) stageNum = match[0];
                    }
                    if (cell.includes("المعدل")) avgCol = c;
                }
            }

            // Header row for competencies (Row 22)
            const headerRow = data[22];
            const compNames = [];
            if (headerRow) {
                // Competencies are between index 5 and avgCol-1
                for (let c = 5; c < avgCol; c++) {
                    compNames.push(String(headerRow[c] || `C${c}`).trim());
                }
            }

            if (!stageNum || !subject) continue;

            let studentsInFile = 0;
            for (let i = 23; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length < 3 || !row[2]) continue;

                const massarId = String(row[2]).trim();
                const name = String(row[3] || "").trim();
                const className = String(row[4] || "").trim();
                const average = row[avgCol];

                if (!massarId || massarId.includes("رقم مسار") || massarId === "null") continue;

                if (!db.students[massarId]) {
                    db.students[massarId] = { name, massarId, class: className, level, grades: {} };
                } else {
                    if (name) db.students[massarId].name = name;
                    if (className) db.students[massarId].class = className;
                    if (level) db.students[massarId].level = level;
                }

                if (!db.students[massarId].grades[subject]) {
                    db.students[massarId].grades[subject] = {};
                }

                if (average !== undefined && average !== null && average !== "") {
                    db.students[massarId].grades[subject][`stage${stageNum}`] = average;
                    
                    // Detailed competencies
                    const details = {};
                    compNames.forEach((comp, idx) => {
                        const val = row[5 + idx];
                        if (val !== undefined && val !== null && val !== "") {
                            details[comp] = val;
                        }
                    });
                    db.students[massarId].grades[subject][`stage${stageNum}_detail`] = details;

                    studentsInFile++;
                }
            }
            if (!db.subjects.includes(subject)) db.subjects.push(subject);
            console.log(`- ${fileName}: ${studentsInFile} students (Stage ${stageNum}, ${subject}) [AvgCol: ${avgCol}]`);
            
        } catch (e) {
            console.error(`Error processing ${fileName}:`, e.message);
        }
    }

    db.syncedFiles = allFiles.map(filePath => path.basename(filePath));
    if (schoolName) db.schoolName = schoolName;
    if (schoolYear) db.schoolYear = schoolYear;
    await fs.writeJson(DB_FILE, db, { spaces: 2 });
    console.log("-----------------------------------------");
    console.log(`Sync complete! Total students in DB: ${Object.keys(db.students).length}`);
}

sync();
