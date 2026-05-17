import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pngPath = path.join(__dirname, 'app_icon_real.png');
const icoPath = path.join(__dirname, 'icon.ico');

pngToIco(pngPath)
    .then(buf => {
        fs.writeFileSync(icoPath, buf);
        console.log(`[OK] icon.ico generated successfully! (${buf.length} bytes)`);
    })
    .catch(err => {
        console.error('[ERROR]', err);
        process.exit(1);
    });
