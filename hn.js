const puppeteer = require('puppeteer-core');

(async() => {
    var a="014count(*)这么慢，我该怎么办？ ? * : \" < > \\ / |  .pdf";

    console.log(a.replace(/[?*:"<>\\\/|]/g, "").trim());
})();