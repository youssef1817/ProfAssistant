import fs from 'fs-extra';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const TEST_FILE = 'c:/Users/pc/Desktop/NotesEleves/مستودع النقط/GrilleEvaluation_1066101010.xlsx';
const URL = 'http://localhost:3000/upload';

async function runTest() {
    console.log("--- Starting Import Process Test ---");
    
    if (!await fs.pathExists(TEST_FILE)) {
        console.error("Test file not found. Please ensure the path is correct.");
        return;
    }

    try {
        const form = new FormData();
        form.append('files', fs.createReadStream(TEST_FILE));

        console.log("Uploading file to server...");
        const response = await fetch(URL, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const results = await response.json();
        console.log("Server Response:", JSON.stringify(results, null, 2));

        if (results[0].status === 'success') {
            console.log("✅ TEST SUCCESSFUL: File processed and organized.");
        } else {
            console.log("❌ TEST FAILED:", results[0].message);
        }

        // Verify if data is in database.json
        const db = await fs.readJson('c:/Users/pc/Desktop/NotesEleves/system/database.json');
        const studentsCount = Object.keys(db.students).length;
        console.log(`Current students in DB: ${studentsCount}`);
        
        if (studentsCount > 0) {
            console.log("✅ DB VERIFIED: Students data present.");
        }

    } catch (e) {
        console.error("❌ TEST CRASHED:", e.message);
    }
}

runTest();
