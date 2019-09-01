const puppeteer = require('puppeteer-core');
const scrollPageToBottom = require("puppeteer-autoscroll-down")
require('log-timestamp');

let config = require('./config.json');

exports.generate = generate;

// generate(
//     'https://time.geekbang.org/column/article/69236',
//     'v:/' + new Date().getTime() + '.pdf',
//     config.cookie
// );

async function generate(url,pdfPathName,cookie=[],) {

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 859,
            height: 1000
        },
        executablePath: config.chromePath
    });

    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36");

    let onRequestPromise = new Promise((resolve, reject) => {
        page.once('request', (request) => {
            resolve(request);
        });
    });

    let onResponsePromise = new Promise((resolve, reject) => {
        page.once('response', (response) => {
            resolve(response);
        });
    });

    await page.setCookie(...cookie);

    console.log(`请求 ${url}`);

    await page.goto(url, {
        waitUntil: ["networkidle0"],
    });

    let request = await onRequestPromise;

    let response = await onResponsePromise;

    console.log(`${response.status()} ${response.statusText()} - ${response.url()}`);

    await pageModification(page);

    console.log(`生成PDF中`);

    // var cssb = [];
    // cssb.push('<style>');
    // cssb.push('h1 { font-size:16px; margin-left:10px;width:100px;display:inline-block}');
    // cssb.push('</style>');

    await page.pdf({
        path: pdfPathName,
        // displayHeaderFooter: true,
        // headerTemplate: ``,
        // footerTemplate: cssb.join('')+'<h1><span class="pageNumber"></span>/<span class="totalPages"></span></h1>',
         margin: {
            top: '15px',
            bottom: '30px',
            right: '20px',
            left: '20px'
        },
        format: 'A4'
    });

    console.log(`生成PDF完成,退出  ${pdfPathName}`);

    await browser.close();
}

async function pageModification(page) {

    //加载所有评论
    await loadAllComment(page);

    //展开所有评论
    await expandAllComment(page);

    //删除header
    await retmoveHeader(page);

}

async function expandAllComment(page) {
    console.log("开始展开所有评论")

    let selector = "._2r3UB1GX_0";
    let r = await page.evaluate((selector) => {
        let doms = document.querySelectorAll(selector);
        let ret = doms.length || 0;
        for (let i = 0; i < doms.length; i++) {
            doms[i].click();
        }
        return ret;
    }, selector);

    if (r <= 0) {
        console.warn("没有需要展开的评论");
    }else{
        console.warn(`展开了 ${r} 个评论`);
    }
}

async function loadAllComment(page) {
    var lastPosition = -1;
    console.log("开始加载所有评论")
    var log = (request) => {
        if (request.url().indexOf("comments") >= 0) {
            process.stdout.write(".");
        }
    };

    page.on('request', log);

    while (true) {
        var r = await scrollPageToBottom(page, 10000, 500);
        if (r == lastPosition) {
            break;
        }
        lastPosition = r;
    }

    page.removeListener('request', log);

    process.stdout.write("完成\n");
}

async function retmoveHeader(page) {
    let selector = "._352wsGxH_0";
    let r = await page.evaluate((selector) => {
        let doms = document.querySelectorAll(selector);
        let ret = doms.length || 0;
        for (let i = 0; i < doms.length; i++) {
            doms[i].parentElement.remove();
        }
        return ret;
    }, selector);

    if (r <= 0) {
        console.warn("没有找到顶部banner!");
    }else{
        console.log("去除顶部banner完成");
    }
}