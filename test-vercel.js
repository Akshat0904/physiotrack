const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`PAGE NETWORK ERROR: ${response.url()} - ${response.status()}`);
      }
    });

    console.log("Navigating to Vercel app...");
    await page.goto('https://physiotrack-k2ak.vercel.app/', { waitUntil: 'networkidle2' });
    console.log("Navigation complete.");
    
    // Give it a second to run React
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
  } catch (e) {
    console.error("Puppeteer error:", e);
  }
})();
