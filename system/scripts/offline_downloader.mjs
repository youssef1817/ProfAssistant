import fs from 'fs-extra';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIBS_DIR = path.join(__dirname, '..', 'public', 'libs');
const FONTS_DIR = path.join(LIBS_DIR, 'fonts');

// External dependency URLs
const DEPS = {
    'chart.js': 'https://cdn.jsdelivr.net/npm/chart.js',
    'font-awesome.js': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js'
};

const GOOGLE_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Tajawal:wght@300;400;700&display=swap';

export async function checkAndDownloadOfflineDeps() {
    try {
        await fs.ensureDir(LIBS_DIR);
        await fs.ensureDir(FONTS_DIR);

        const filesToCheck = [
            path.join(LIBS_DIR, 'chart.js'),
            path.join(LIBS_DIR, 'font-awesome.js'),
            path.join(LIBS_DIR, 'fonts.css')
        ];

        let missing = false;
        for (const file of filesToCheck) {
            if (!(await fs.pathExists(file))) {
                missing = true;
                break;
            }
        }

        // Also check if any woff2 files exist
        const fontFiles = await fs.pathExists(FONTS_DIR) ? await fs.readdir(FONTS_DIR) : [];
        if (fontFiles.filter(f => f.endsWith('.woff2')).length === 0) {
            missing = true;
        }

        if (!missing) {
            console.log("[OFFLINE] All dependencies are already cached locally.");
            return;
        }

        console.log("===================================================");
        console.log("   PROFASSISTANT OFFLINE ENABLER");
        console.log("===================================================");
        console.log("[+] Downloading external dependencies for offline use...");

        // 1. Download Chart.js and FontAwesome
        for (const [filename, url] of Object.entries(DEPS)) {
            const dest = path.join(LIBS_DIR, filename);
            if (!(await fs.pathExists(dest))) {
                console.log(`[+] Downloading ${filename}...`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to download ${filename}`);
                const content = await response.text();
                await fs.writeFile(dest, content, 'utf8');
            }
        }

        // 2. Download Google Fonts and generate local stylesheet
        const localCssPath = path.join(LIBS_DIR, 'fonts.css');
        if (!(await fs.pathExists(localCssPath)) || fontFiles.length === 0) {
            console.log("[+] Downloading Google Fonts (Outfit & Tajawal)...");
            
            // We need Chrome User-Agent to get WOFF2 formats from Google Fonts
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            };
            
            const response = await fetch(GOOGLE_FONTS_CSS_URL, { headers });
            if (!response.ok) throw new Error("Failed to fetch Google Fonts CSS");
            let cssContent = await response.text();

            // Regex to find font URLs
            const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
            let match;
            const urlsToDownload = [];

            while ((match = urlRegex.exec(cssContent)) !== null) {
                urlsToDownload.push(match[1]);
            }

            // Remove duplicates
            const uniqueUrls = [...new Set(urlsToDownload)];

            console.log(`[+] Downloading ${uniqueUrls.length} font glyph files...`);
            
            for (let i = 0; i < uniqueUrls.length; i++) {
                const remoteUrl = uniqueUrls[i];
                // Generate a safe local filename based on the gstatic folder structure
                const urlParts = remoteUrl.split('/');
                const localName = `${urlParts[urlParts.length - 3]}_${urlParts[urlParts.length - 2]}_${urlParts[urlParts.length - 1]}`;
                const localDest = path.join(FONTS_DIR, localName);

                if (!(await fs.pathExists(localDest))) {
                    const res = await fetch(remoteUrl);
                    if (res.ok) {
                        const buffer = await res.arrayBuffer();
                        await fs.writeFile(localDest, Buffer.from(buffer));
                    }
                }

                // Replace the remote URL in the CSS content with the relative local path
                cssContent = cssContent.replaceAll(remoteUrl, `./fonts/${localName}`);
            }

            await fs.writeFile(localCssPath, cssContent, 'utf8');
        }

        console.log("[OK] All dependencies successfully downloaded and cached locally!");
        console.log("[OK] ProfAssistant is now 100% OFFLINE CAPABLE!");
        console.log("===================================================");
    } catch (e) {
        console.error("\n[!] Warning: Offline dependencies download failed.");
        console.error("    Details:", e.message);
        console.error("    The system will fallback to online dependencies, or standard system fonts if offline.\n");
    }
}
