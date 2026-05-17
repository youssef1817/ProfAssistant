import fs from 'fs-extra';
import path from 'path';

async function convertPngToIco() {
    const pngPath = 'c:/Users/pc/Desktop/NotesEleves/system/assets/أيقونة_التشغيل.png';
    const icoPath = 'c:/Users/pc/Desktop/NotesEleves/system/assets/أيقونة_التشغيل.ico';
    
    try {
        const pngData = await fs.readFile(pngPath);
        const size = pngData.length;
        
        const header = Buffer.alloc(22);
        // ICO Header
        header.writeUInt16LE(0, 0);     // Reserved
        header.writeUInt16LE(1, 2);     // Type (1 = Icon)
        header.writeUInt16LE(1, 4);     // Count (1 image)
        
        // Icon Directory Entry
        header.writeUInt8(0, 6);        // Width (0 means 256)
        header.writeUInt8(0, 7);        // Height (0 means 256)
        header.writeUInt8(0, 8);        // Color count (0)
        header.writeUInt8(0, 9);        // Reserved (0)
        header.writeUInt16LE(1, 10);    // Planes (1)
        header.writeUInt16LE(32, 12);   // Bits per pixel (32)
        header.writeUInt32LE(size, 14); // Image size in bytes
        header.writeUInt32LE(22, 18);   // Offset of PNG data (22)
        
        const icoData = Buffer.concat([header, pngData]);
        await fs.writeFile(icoPath, icoData);
        console.log("Successfully converted PNG to ICO!");
    } catch (e) {
        console.error("Error during conversion:", e);
    }
}

convertPngToIco();
