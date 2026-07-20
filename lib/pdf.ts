import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

async function getBrowser() {
  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    const { default: puppeteerCore } = await import('puppeteer-core');
    const { default: chromium } = (await import('@sparticuz/chromium-min')) as any;
    
    // Resolve correct architecture for Vercel functions (typically x64 or arm64)
    const isArm64 = process.arch === 'arm64';
    const archSuffix = isArm64 ? 'arm64' : 'x64';
    const chromiumPackUrl = `https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.${archSuffix}.tar`;

    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(chromiumPackUrl),
      headless: chromium.headless,
    });
  } else {
    const { default: puppeteer } = await import('puppeteer');
    return await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function mapKeysToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...obj };
  for (const key of Object.keys(obj)) {
    const snakeKey = toSnakeCase(key);
    if (snakeKey !== key) {
      result[snakeKey] = obj[key];
    }
  }
  return result;
}

/**
 * Compiles Handlebars template with data and renders it to a PDF file using Puppeteer.
 * @param templateContent The HTML template string
 * @param data The form answers / template variables
 * @param outputPath The path where the PDF will be saved
 */
export async function generatePdf(
  templateContent: string,
  data: Record<string, any>,
  outputPath: string
): Promise<string> {
  // Compile the template with Handlebars
  const snakeCaseData = mapKeysToSnakeCase(data);
  const template = Handlebars.compile(templateContent);
  const htmlContent = template(snakeCaseData);

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Launch Puppeteer headless browser (environment aware)
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();

    // Set the page content and wait for network/rendering to settle
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0' as any,
    });

    // Generate PDF document
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '60px',
        bottom: '80px',
        left: '50px',
        right: '50px',
      },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="font-size: 8px; font-family: Arial, sans-serif; color: #64748b; width: 100%; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; margin: 0 50px;">
          <span>Assembled securely via LegalDocs.</span>
          <span style="float: right; color: #64748b;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    return outputPath;
  } catch (error) {
    console.error('Puppeteer PDF generation failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}
