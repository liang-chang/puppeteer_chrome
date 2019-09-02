const URL = require('url');
const http = require('http');
const https = require('https');
const readline = require('readline');
const querystring = require('querystring');
const fs = require('fs');
const setCookie = require('set-cookie-parser');
const chromeHeadlessPDF = require("./chromeHeadlessPDF.js");

//---------------------------------------------------------------
//配置
const config = require('./config.json');

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
    if(COOKIE == null || COOKIE.length <= 0){
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

    let dir = config.downloadDirectory + filterSpecialChar(`${course.columnTitle}-${course.columnSubtitle}`);

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    let errorCount=0;

    let baseUrl = "https://time.geekbang.org/column/article/";
    for (let i = 0; i < allArticles.length; i++) {
        let article = allArticles[i];

        console.log(`开始${i + 1}/${course.articleCount}【${course.columnId}-${course.columnTitle}-${course.columnSubtitle}】`);

        let openUrl = baseUrl + article.id;

        let filname =dir + "/" + filterSpecialChar(pad(i,3)+"."+(article.article_sharetitle||article.article_title))+".pdf";

        if (fs.existsSync(filname)) {
            console.log(`${filname} 已存在,跳过`);
            continue;
        }

        try {
            await chromeHeadlessPDF.generate(openUrl,filname,COOKIE);
        }catch (e) {
            console.error("出错了,"+filname,e)
            errorCount++;
        }

        console.log(`完成${i + 1}/${course.articleCount}【${course.columnId}-${course.columnTitle}-${course.columnSubtitle}】`);

        let waitSecond=5;
        console.log(`等待 ${waitSecond} 秒`);
        await sleep(waitSecond * 1000);
    }
    if(errorCount > 0 ){
        console.log(`最后出错了 ${errorCount}`);
    }
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

    var cookieHeader = r.response.headers['set-cookie'];

    if (cookieHeader == null || cookieHeader.length <= 0 ) {
        console.error("无法登录获取cookie,退出!")
        process.exit();
    }

    console.log(cookieHeader);
    COOKIE = setCookie.parse (r.response);

}

main();


function httpsRequest(options, post_data) {
    // 注意返回promise对象
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            res.resume();
            res.setEncoding('utf8');
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
    for (let c of cookies) {
        ret[ret.length] = c.name + "="+c.value;
    }
    return ret.join('; ');
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function filterSpecialChar(s) {
    return s.replace(/[?*:"<>\\\/|]/g, "");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}