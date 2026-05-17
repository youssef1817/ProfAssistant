import fs from 'fs-extra';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const oldDir = path.join(ROOT, 'نقط');
const newDir = path.join(ROOT, 'مستودع النقط');

async function organize() {
    // If newDir exists, let's delete it so we have a clean slate from restored git 'نقط'
    if (await fs.pathExists(newDir)) {
        await fs.remove(newDir);
    }
    
    // Recreate newDir
    await fs.ensureDir(newDir);

    // Recursively find all .xlsx files in oldDir
    async function getFiles(dir, allFiles = []) {
        if (!(await fs.pathExists(dir))) return allFiles;
        const list = await fs.readdir(dir);
        for (const item of list) {
            const fullPath = path.join(dir, item);
            const stat = await fs.lstat(fullPath);
            if (stat.isDirectory()) {
                await getFiles(fullPath, allFiles);
            } else if (item.endsWith('.xlsx')) {
                allFiles.push(fullPath);
            }
        }
        return allFiles;
    }

    const files = await getFiles(oldDir);
    console.log(`Found ${files.length} restored Excel files to process...`);

    for (const file of files) {
        try {
            const fileBuffer = await fs.readFile(file);
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheet = workbook.Sheets['EvaluationLivretsCompetence'];
            if (!sheet) {
                // If it doesn't have the sheet, just copy it as is
                const targetPath = path.join(newDir, path.basename(file));
                await fs.copy(file, targetPath, { overwrite: true });
                continue;
            }

            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            let level = "";
            let subject = "";
            let stageNum = null;

            // Search first 23 rows for metadata
            for (let r = 0; r < 23; r++) {
                const row = data[r];
                if (!row) continue;
                for (let c = 0; c < row.length; c++) {
                    const cell = String(row[c] || "");
                    if (cell.includes("المستوى")) level = String(row[c+1] || "").trim();
                    if (cell.includes("المادة")) subject = String(row[c+1] || "").trim();
                    if (cell.includes("المرحلة") && !stageNum) {
                        const val = String(row[c+1] || cell);
                        const match = val.match(/\d/);
                        if (match) stageNum = match[0];
                    }
                }
            }

            // Get class name from row 23 first student
            let className = "";
            for (let i = 23; i < data.length; i++) {
                const row = data[i];
                if (row && row[4]) {
                    className = String(row[4]).trim();
                    break;
                }
            }

            // Fallback for stage if not found in folder
            if (!stageNum) {
                const folderName = path.basename(path.dirname(file));
                const folderMatch = folderName.match(/\d/);
                if (folderMatch) stageNum = folderMatch[0];
            }

            // Safe naming components
            const safeSubject = (subject || "مادة").replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
            const safeStage = stageNum || "X";
            const safeClass = (className || "قسم").replace(/[^a-zA-Z0-9]/g, "_");
            const baseName = path.basename(file, '.xlsx');

            const uniqueName = `${safeSubject}_المرحلة_${safeStage}_${safeClass}_${baseName}.xlsx`;
            const targetPath = path.join(newDir, uniqueName);

            console.log(`Copying unique: ${path.basename(file)} -> ${uniqueName}`);
            await fs.copy(file, targetPath, { overwrite: true });

        } catch (err) {
            console.error(`Error parsing ${file}:`, err);
            const targetPath = path.join(newDir, path.basename(file));
            await fs.copy(file, targetPath, { overwrite: true });
        }
    }

    // Now remove the old 'نقط' directory to make clean workspace
    if (await fs.pathExists(oldDir)) {
        await fs.remove(oldDir);
        console.log("Deleted old 'نقط' directory.");
    }

    console.log("Unique repository organization successfully completed by Node.js!");
}

organize().catch(console.error);
