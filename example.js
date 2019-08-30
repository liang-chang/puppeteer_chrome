const puppeteer = require('puppeteer-core');
const scrollPageToBottom = require("puppeteer-autoscroll-down")
require('log-timestamp');



async function  main() {


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
        // page.once('request', (request) => {
        page.once('request', (request) => {
            console.log(request.url());
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
        waitUntil: ["networkidle0"],
        // referer: 'https://time.geekbang.org/'
    });

    let request = await onRequestPromise;

    console.log(request.headers());

    let response = await onResponsePromise;

    console.log(`${response.status()} ${response.statusText()} - ${response.url()}`);

    var name = new Date().getTime();

    // await page.screenshot({
    // 	path: 'v:/'+name+'.png'
    // });

    await pageModification(page);

    console.log(`generate pdf`);

    await page.pdf({
        path: 'v:/' + new Date().getTime() + '.pdf',
        displayHeaderFooter:true,
        headerTemplate:`date  -   title   -   url  pageNumber/totalPages `,
        footerTemplate:`date  -   title   -   url  pageNumber/totalPages `,
        margin: {
            top: '15px',
            bottom: '30px',
            right: '20px',
            left: '20px'
        },
        format: 'A4'});

    console.log(`browse close`);

    browser.close();
}

main();

async function  pageModification(page) {

    await loadAllComment(page);

    //删除header
    await retmoveHeader(page);

}

async function loadAllComment(page) {
    var lastPosition = -1;

    var log =  (request) => {
        if(request.url().indexOf("comments")>=0){
            console.log(request.url());
        }
    };

    page.on('request', log);

    while(true){
        var r = await scrollPageToBottom(page,5000,100);
        console.log(`@${r}`)
        if(r == lastPosition){
            break;
        }
        lastPosition = r;
    }

    page.removeListener('request',log);
}

async function  retmoveHeader(page) {
    let selector="._352wsGxH_0";
    let r = await page.evaluate((selector) => {
        let doms = document.querySelectorAll(selector);
        let ret = doms.length || 0;
        for(let i=0;i < doms.length; i++){
            doms[i].parentElement.remove();
        }
        return ret;
    },selector);

    if(r <=0 ){
        console.warn("没有找到顶部banner!");
    }
}