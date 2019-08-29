const URL = require('url');
const http = require('http');
const https = require('https');
const cookie = require('cookie');
const readline = require('readline');
const puppeteer = require('puppeteer-core');
const querystring = require('querystring');


//---------------------------------------------------------------
//配置
let config = require('./config.json');

//console.log(JSON.stringify(config),"\n");

var CELL_PHONE = config.cellPhone;

var PASSWORD = config.password;

var CHROME_PATH = config.chromePath;

var HEADLESS = false;

var USER_AGENT = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36";

//---------------------------------------------------------------

var COOKIE = config.cookie != null && Array.isArray(config.cookie) && config.cookie.length > 0
    ? config.cookie
    : null;


var COMMON_HEADER = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json, text/plain, */*',
    'Origin': "https://account.geekbang.org"
};

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

async function main() {
    if(COOKIE != null){
        await loginGetCookie();
    }

    console.log(JSON.stringify(COOKIE));

    let courseList = await getCourseList();

    while (true) {

        let choose = await chooseCourse(courseList);

        if (choose == null || choose.length <= 0) {
            continue;
        }

        //已选定课程,开始生成PDF文件

        await startDownload(choose[0]);
    }
}

async function startDownload(course) {
    var allArticles = await getAllArticles(course);

    console.log(`共${course.articleCount}篇【${course.columnId}-${course.columnTitle}-${course.columnSubtitle}】`);

    allArticles = allArticles.data.list;
    if (allArticles == null || allArticles.length <= 0) {
        console.log("没有找到可用文章!");
        process.exit();
    }

    let baseUrl = "https://time.geekbang.org/column/article/";
    for (let i = 0; i < allArticles.length; i++) {
        let article = allArticles[i];

        console.log(`开始${i + 1}/${course.articleCount}【${course.columnId}-${course.columnTitle}-${course.columnSubtitle}】`);

        let openUrl = baseUrl + article.id;

        // await savePDF(openUrl,article);
        console.log(`完成${i + 1}/${course.articleCount}【${course.columnId}-${course.columnTitle}-${course.columnSubtitle}】`);
    }
}

async function savePDF(url, article) {
    const browser = await puppeteer.launch({
        headless: HEADLESS,
        executablePath: CHROME_PATH
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'Host': 'account.geekbang.org',
        'Cookie': getCookieHeaderValue(COOKIE)
    });

    await page.goto(url, {
        waitUntil: 'networkidle2',
        // referer: 'https://www.baidu.com'
    });
    await page.pdf({
        path: 'v:/' + article.article_sharetitle + '.pdf',
        format: 'A4'
    });

    await browser.close();

}

async function getAllArticles(course) {
    let httpsUrl = "https://time.geekbang.org/serv/v1/column/articles";
    let url = URL.parse(httpsUrl);

    var options = {
        port: 443,
        method: 'POST',
        host: url.host,
        hostname: url.hostname,
        path: url.path,
        headers: Object.assign({
            'Origin': 'https://time.geekbang.org',
            'Referer': 'https://time.geekbang.org/column/intro/' + course.columnId,
            'Content-Type': 'application/json',
            'Cookie': getCookieHeaderValue(COOKIE)
        }, COMMON_HEADER)
    };

    let data = JSON.parse('{"cid":"","size":500,"prev":0,"order":"earliest","sample":false}');

    data.cid = course.columnId + "";

    let r = await httpsRequest(options, JSON.stringify(data));

    let resData = r.data;
    if (resData == null) {
        console.error("无法获取课程信息", r)
        process.exit();
    }
    let dataJson = JSON.parse(resData);

    if (dataJson['code'] != null && dataJson['code'] < 0) {
        console.error("无法获取课程文章信息", resData)
        process.exit();
    }

    return dataJson;
}

async function chooseCourse(courseList) {

    let list = await parsetCourseList(courseList);

    console.log("-------------------------------------------");
    for (item of list) {
        console.log(`[${item.columnId}]【${item.tabName}】【${item.columnTitle} - ${item.columnSubtitle}】【${item.articleCount}讲】 - 【 ${item.authorName} - ${item.authorIntro}】`);
    }
    const ans = await askQuestion("请输入课程id:");

    let pickCourse = list.filter(c => c.columnId == parseInt(ans, 10));

    if (pickCourse == null || pickCourse.length <= 0) {
        console.error(`未找到相关课程，请检查课程 id = ${ans} 是否正确！`)
    }
    return pickCourse;
}

async function parsetCourseList(courseTabList) {
    let ret = [];

    let allTabs = courseTabList.data;

    for (let tab of  allTabs) {
        var tabName = tab.title;
        for (let course of tab.list) {
            var courseName = course.title;
            let listItem = {};

            listItem.tabName = tabName;

            listItem.columnTitle = courseName;
            listItem.columnSubtitle = course.extra.column_subtitle;
            listItem.columnId = course.extra.column_id;
            listItem.authorName = course.extra.author_name;
            listItem.authorIntro = course.extra.author_intro;
            listItem.articleCount = course.extra.article_count;

            ret[ret.length] = listItem;

        }
    }
    return ret;
}

async function getCourseList() {
    let httpsUrl = "https://time.geekbang.org/serv/v1/my/products/all";
    let url = URL.parse(httpsUrl);

    var options = {
        port: 443,
        method: 'POST',
        host: url.host,
        hostname: url.hostname,
        path: url.path,
        headers: Object.assign({
            'Referer': 'https://account.geekbang.org/dashboard/buy',
            'Cookie': getCookieHeaderValue(COOKIE)
        }, COMMON_HEADER)
    };

    console.log(JSON.stringify(options.headers))

    let r = await httpsRequest(options, "");

    let data = r.data;
    if (data == null) {
        console.error("无法获取课程信息", r)
        process.exit();
    }
    let dataJson = JSON.parse(data);
    if (dataJson['code'] != null && dataJson['code'] < 0) {
        console.error("无法获取课程信息", data)
        process.exit();
    }

    return dataJson;
}

async function loginGetCookie() {

    let httpsUrl = "https://account.geekbang.org/account/ticket/login";

    var url = URL.parse(httpsUrl);

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
        hostname: url.hostname,
        path: url.path,
        headers: Object.assign({
            'Referer': 'https://account.geekbang.org/login?redirect=https%3A%2F%2Ftime.geekbang.org%2F'
        }, COMMON_HEADER)
    };

    let r = await httpsRequest(options, post_data);

    var cookie = r.response.headers['set-cookie'];

    if (cookie == null) {
        console.error("无法登录获取cookie,退出!")
        process.exit();
    }

    COOKIE = cookie.map(v => v.split(";")[0].trim());
}

main();


function httpsRequest(options, post_data) {
    // 注意返回promise对象
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            res.resume();
            let ret = '';
            res.on('data', buffer => {
                ret += buffer.toString()
            });
            res.on('end', () => {
                resolve({response: res, request: ret, data: ret})
            });
        });
        req.on('error', (e) => {
            console.log('problem with request: ' + e.message);
            reject(e)
        });
        if (post_data != null || post_data != '') {
            req.write(post_data);
        }
        req.end();
    });
};

function getCookieHeaderValue(cookies) {
    let ret = [];
    for (let cookie of cookies) {
        ret[ret.length] = cookie.name + "="+cookie.value;
    }
    return ret.join('; ');
}

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

(async () => {

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

