const puppeteer = require('puppeteer-core');
const querystring = require('querystring');
const http = require('http');
const https = require('https');
const URL = require('url');



//---------------------------------------------------------------
//配置
let config = require('./config.json');

//console.log(JSON.stringify(config),"\n");

var CELL_PHONE=config.cellPhone;

var PASSWORD=config.password;

var CHROME_PATH = config.chromePath;

var HEADLESS = false;

var USER_AGENT = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36";

//---------------------------------------------------------------

var COOKIE = null;


var COMMON_HEADER = {
		'User-Agent': USER_AGENT,
		'Accept': 'application/json, text/plain, */*',
		'Origin':"https://account.geekbang.org"
 };

async function main(){
	await loginGetCookie();

	console.log(JSON.stringify(COOKIE));

	await getCourseList();
}



async function getCourseList() {
	let httpsUrl = "https://time.geekbang.org/serv/v1/my/products/all";
	let url =  URL.parse(httpsUrl);

	var options = {
		port: 443,
		method: 'POST',
		host: url.host,
		hostname :url.hostname,
		path: url.path,
		headers: Object.assign({
			'Referer': 'https://account.geekbang.org/dashboard/buy',
			'Cookie':COOKIE.join('; ')
		},COMMON_HEADER)
	};

	console.log(JSON.stringify(options.headers))

	let r =  await httpsRequest(options,"");

	console.log(r.data);
}

async function loginGetCookie() {

	let httpsUrl = "https://account.geekbang.org/account/ticket/login";

	var url =  URL.parse(httpsUrl);

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
		port: 443,
		method: 'POST',
		host: url.host,
		hostname :url.hostname,
		path: url.path,
		headers: Object.assign({
			'Referer': 'https://account.geekbang.org/login?redirect=https%3A%2F%2Ftime.geekbang.org%2F'
		},COMMON_HEADER)
	};

	let r =  await httpsRequest(options,post_data);

	var cookie =  r.response.headers['set-cookie'];

	if(cookie == null){
		console.error("无法登录获取cookie,退出!")
		process.exit();
	}

	COOKIE = cookie.map(v => v.split(";")[0].trim());
}

main();


function httpsRequest(options,post_data) {
    // 注意返回promise对象
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
			res.resume();
            let ret = '';
            res.on('data', buffer => {ret += buffer.toString()});
			res.on('end', () => {
				resolve({response: res, request: ret, data: ret})
			});
        });
        req.on('error', (e) => {
			console.log('problem with request: ' + e.message);
			reject(e)
		});
        if(post_data!=null||post_data!=''){
			req.write(post_data);
		}
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

