const puppeteer = require('puppeteer-core');
var querystring = require('querystring');
var http = require('http');
var https = require('https');
var querystring = require('querystring');



//---------------------------------------------------------------
//配置
let config = require('./config.json');

console.log(JSON.stringify(config),"\n");

var CELL_PHONE=config.cellPhone;

var PASSWORD=config.password;

var CHROME_PATH = config.chromePath;

var HEADLESS = false;

var USER_AGENT = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36";

//---------------------------------------------------------------

var COOKIE = null;

function login() {

	var url = "https://account.geekbang.org/account/ticket/login";
	
	var post_data = JSON.stringify({
			"country": 86,
			"cellphone": CELL_PHONE,
			"password": PASSWORD,
			"captcha": "",
			"remember": 1,
			"platform": 3,
			"appid": 1
		});
		
	var options = {
		host: 'account.geekbang.org',
		hostname :'account.geekbang.org',
		port: 443,
		path: '/account/ticket/login',
		method: 'POST',
		headers: {
			'User-Agent': USER_AGENT,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Host': 'account.geekbang.org',
			'Origin':'https://account.geekbang.org',
            'Referer': 'https://account.geekbang.org/login?redirect=https%3A%2F%2Ftime.geekbang.org%2F',
		}
	}
	
	awat httpRequest(post_data,options);

	var req = https.request(options,(res) => {
			res.resume();
			res.setEncoding('utf8');
			
			res.on('end', () => {
				if (!res.complete){
					console.error('The connection was terminated while the message was still being sent');
				}
				console.log(res.headers);
				console.log("\n");
				console.log(res.headers['set-cookie']);
				console.log("\n");
				console.log(res.headers['set-cookie'].length);
				console.log("\n");
			});
		});
		
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	
	req.write(post_data);
	req.end();
}

login(); 

async function httpRequest(post_data,options) {
    // 注意返回promise对象
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let ret = '';
            res.on('data', buffer => { ret += buffer.toString() });
            res.on('end', () => resolve(res,ret));
        });
        req.on('error', (e) => {
			console.log('problem with request: ' + e.message);
			reject(e)
		});
		req.write(post_data);
        req.end();
    });
};

/* 
function ttt(){
	const browser = await puppeteer.launch({
		headless: HEADLESS,
		executablePath: CHROME_PATH
	});
	
	const page = await browser.newPage();

	await page.setExtraHTTPHeaders({
		'Host': 'account.geekbang.org',
		referer: 'https://time.geekbang.org/'
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
}
*/

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
