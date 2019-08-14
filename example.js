//const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-core');

(async() => {
	const browser = await puppeteer.launch({
			headless: false,
			executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
		});
	const page = await browser.newPage();
	await page.goto('https://example.com');
	//await page.screenshot({
	//	path: 'example.png'
	//});
	await page.pdf({path: 'hn.pdf', format: 'A4'});

	//await browser.close();
})();