import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const PDF_PATH = path.join(process.cwd(), '../../../Comprehensive Guide to Vibe Coding using Claude Code.pdf');
const OUTPUT_DIR = path.join(process.cwd(), '../../guides');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'vibe-coding-guide.md');

async function extractPDF() {
  try {
    // Check if PDF exists
    if (!fs.existsSync(PDF_PATH)) {
      console.error(`PDF not found at: ${PDF_PATH}`);
      process.exit(1);
    }

    // Create guides directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Read PDF
    console.log('Reading PDF...');
    const dataBuffer = fs.readFileSync(PDF_PATH);
    // pdf-parse exports the function directly
    const pdfFunction = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse.PDFParse || pdfParse);
    const data = await pdfFunction(dataBuffer);

    // Extract text
    const text = data.text;

    // Create markdown file with title
    const markdown = `# Comprehensive Guide to Vibe Coding using Claude Code

${text}
`;

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
    console.log(`✅ Extracted PDF to: ${OUTPUT_FILE}`);
    console.log(`   Pages: ${data.numpages}`);
    console.log(`   Text length: ${text.length} characters`);
  } catch (error) {
    console.error('Error extracting PDF:', error);
    process.exit(1);
  }
}

extractPDF();

