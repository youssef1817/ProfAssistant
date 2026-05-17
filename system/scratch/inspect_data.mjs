import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'نقط');

async function inspect() {
    const filePath = path.join(DATA_DIR, 'الفرنسية', 'GrilleEvaluation_1065101010 (10).xlsx');
    if (!await fs.pathExists(filePath)) {
        return console.log("File not found:", filePath);
    }

    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets['EvaluationLivretsCompetence'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("--- First 23 Rows (Metadata) ---");
    for (let r = 0; r < 23; r++) {
        if (data[r] && data[r].some(c => c)) {
            console.log(`Row ${r}:`, data[r].filter(c => c !== null && c !== undefined && c !== ""));
        }
    }
    console.log("Row 22 (Header):", data[22]);
    console.log("Row 23 (First Student):", data[23] ? data[23].slice(0, 15) : "No student");
}
inspect();
