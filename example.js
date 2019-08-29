//const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-core');
require('log-timestamp');



(async() => {

    let config = require('./config.json');

    let COOKIE = config.cookie != null && Array.isArray(config.cookie) && config.cookie.length > 0
        ? config.cookie
        : null;

	const browser = await puppeteer.launch({
			headless: true,
			executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
		});

	const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36");

    let onRequestPromise = new Promise((resolve, reject)=>{
        page.once('request', (request) => {
            resolve(request);
        });
    });

    let onResponsePromise = new Promise((resolve, reject)=>{
        page.once('response', (response) => {
            resolve(response);
        });
    });



    await page.setCookie(...COOKIE);

	await page.goto('https://time.geekbang.org/column/article/69236',{
        waitUntil: ["load" ,"domcontentloaded" ,"networkidle0" ,"networkidle2"],
        // referer: 'https://time.geekbang.org/'
    });

    let request = await onRequestPromise;

    console.log(request.headers());

    let response = await onResponsePromise;

    console.log(`${response.status()} ${response.statusText()} - ${response.url()}`);

    var name = new Date().getTime();

    console.log(`generate screenshot`);


    // await page.screenshot({
    // 	path: 'v:/'+name+'.png'
    // });

    console.log(`generate pdf`);

    await page.pdf({path: 'v:/'+new Date().getTime()+'.pdf', format: 'A4'});

    console.log(`browse close`);

    setTimeout(()=>{
        console.log("close------")
        browser.close();
    },0);

})();