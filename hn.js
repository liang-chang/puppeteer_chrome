const puppeteer = require('puppeteer-core');

(async() => {
    var a="test";

	var s=`${a} hello world!`;

	console.log(s);

    var a="test2";

    var s=`${a} hello world!`;

    console.log(s);
})();