import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const inputDir = path.join(projectRoot, 'input');
const outputDir = path.join(projectRoot, 'output');

interface ResizeConfig {
    width: number;
    height: number;
    suffix: string;
}

const resizeConfigs: ResizeConfig[] = [
    { width: 800, height: 600, suffix: 'large' },
    { width: 400, height: 300, suffix: 'medium' },
    { width: 200, height: 150, suffix: 'small' }
];

async function ensureDir(dir: string): Promise<void> {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir);
    }
}

async function resizeImage(inputPath: string, outputPath: string, config: ResizeConfig): Promise<void> {
    await sharp(inputPath)
        .resize(config.width, config.height, {
            fit: sharp.fit.cover,
            position: sharp.strategy.attention
        })
        .toFile(outputPath);
    console.log(`Resized ${path.basename(inputPath)} to ${config.width}x${config.height}`);
}

async function processImages(): Promise<void> {
    try {
        await ensureDir(outputDir);

        const files = await fs.readdir(inputDir);
        for (const file of files) {
            if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
                const inputPath = path.join(inputDir, file);
                
                for (const config of resizeConfigs) {
                    const { name, ext } = path.parse(file);
                    const outputFileName = `${name}-${config.suffix}${ext}`;
                    const outputPath = path.join(outputDir, outputFileName);
                    
                    try {
                        await resizeImage(inputPath, outputPath, config);
                    } catch (err) {
                        console.error(`Error processing ${file}:`, err);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error processing images:', err);
    }
}

// Self-invoking async function to allow top-level await
(async () => {
    try {
        await processImages();
    } catch (err) {
        console.error('An error occurred:', err);
    }
})();