const puppeteer = require('puppeteer-core');
var http = require('http');
var https = require('https');
var querystring = require('querystring');


//---------------------------------------------------------------
//配置

var CHROME_PATH = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";

var HEADLESS = false;

var USER_AGENT = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36";

//---------------------------------------------------------------

var cookie = null;



async function login() {

	var url = "https://account.geekbang.org/account/ticket/login";
	
	var options = {
		Host: 'account.geekbang.org',
		method: 'POST',
		agent:USER_AGENT,
		headers: {
			'User-Agent': USER_AGENT,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Host': 'account.geekbang.org',
            'Referer': 'https://account.geekbang.org/signin?redirect=https%3A%2F%2Fwww.geekbang.org%2F',
		}
	}

	var req = https.request(url,options,(res) => {
			res.setEncoding('utf8');
			res.on('data', function (data) {
				console.log("data:", data); //一段html代码
			});
			let setCookie = res.getHeader('set-cookie');
			console.log(setCookie);
		});
}

login(); 

//function ttt(){
//	const browser = await puppeteer.launch({
//		headless: HEADLESS,
//		executablePath: CHROME_PATH
//	});
//	
//	const page = await browser.newPage();
//
//	await page.setExtraHTTPHeaders({
//		'Host': 'account.geekbang.org',
//		referer: 'https://time.geekbang.org/'
//	});
//
//	await page.goto('https://account.geekbang.org/login?redirect=https%3A%2F%2Ftime.geekbang.org%2F', {
//		waitUntil: 'networkidle2',
//		referer: 'https://time.geekbang.org/'
//	});
//
//	await page.pdf({
//		path: 'hn.pdf',
//		format: 'A4'
//	});
//
//	await browser.close();
//	
//}

(async() => {
	
	const browser = await puppeteer.launch({
		headless: HEADLESS,
		executablePath: CHROME_PATH
	});

	const page = await browser.newPage();

	await page.setExtraHTTPHeaders({
		'Host': 'account.geekbang.org',
	});

	await page.goto('https://account.geekbang.org/login?redirect=https%3A%2F%2Ftime.geekbang.org%2F', {
		waitUntil: 'networkidle2',
		referer: 'https://time.geekbang.org/'
	});
	await page.pdf({
		path: 'hn.pdf',
		format: 'A4'
	});

	await browser.close();
})
//();
