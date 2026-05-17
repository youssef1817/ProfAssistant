import XLSX from 'xlsx';
import path from 'path';

const filePath = 'c:/Users/pc/Desktop/NotesEleves/مستودع النقط/GrilleEvaluation_1066101010.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    console.log("Sheet Names:", workbook.SheetNames);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(JSON.stringify(data.slice(0, 50), null, 2));
} catch (e) {
    console.error(e);
}
