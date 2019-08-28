//const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-core');

(async() => {
	const browser = await puppeteer.launch({
			headless: true,
			executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
		});
	const page = await browser.newPage();
	await page.goto('https://www.baidu.com',{
        waitUntil: 'networkidle2',
        // referer: 'https://time.geekbang.org/'
    });
	//await page.screenshot({
	//	path: 'example.png'
	//});
	await page.pdf({path: 'v:/hn.pdf', format: 'A4'});

	await browser.close();
})();