import { chromium } from '@playwright/test';
const url = process.argv[2] || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page = await browser.newPage();
  const errors = [];
  const thirdParty = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', req => { if (new URL(req.url()).hostname === 'esm.sh') thirdParty.push(req.url()); });
  const response = await page.goto(url, {waitUntil:'domcontentloaded'});
  if (!response?.ok()) throw Error(`Entry HTTP ${response?.status()}`);
  await page.getByText('PUBLIC TERMINAL · GUEST BY DEFAULT', {exact:true}).waitFor({timeout:30000});
  if (await page.locator('#runtime-error').isVisible()) throw Error('Runtime error banner visible');
  if (thirdParty.length) throw Error('Runtime still requests esm.sh');
  if (errors.length) throw Error(errors.join('\n'));
  console.log(JSON.stringify({url, title:await page.title(), rendered:true,esmRequests:thirdParty.length, pageErrors:errors}));
} finally { await browser.close(); }
