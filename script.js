let puppeteer = require("puppeteer");
let fs = require("fs");
let cFile = process.argv[2];
let moderatorToAdd = process.argv[3];

(async function(){
    let browser = await puppeteer.launch({
        headless:false,
        defaultViewport:null,
        args:["--start-maximized"]
    });
    let pages = await browser.pages();
    let page = pages[0];
    /*************************credentails**************************************** */
    let data = await fs.promises.readFile(cFile);
    let {user,pwd} = JSON.parse(data);
    await page.setDefaultNavigationTimeout(0);
    await page.goto("https://www.hackerrank.com/auth/login",{waitUntil:"networkidle0"});
    /************Login*********************************************************** */
    await page.waitForSelector("#input-1",{visible:true,timeout:0});
    await page.type("#input-1",user);
    await page.waitForSelector("#input-2",{visible:true});
    await page.type("#input-2",pwd);
    await page.waitForSelector("button[data-analytics=LoginPassword]",{visible:true});
    await Promise.all([
        page.click("button[data-analytics=LoginPassword]"),
        page.waitForNavigation({waitUntil:"networkidle2"})
    ]);
    /*****************click administration ********************************************* */
    await page.waitForSelector("a[data-analytics=NavBarProfileDropDown]",{visible:true,timeout:0});
    await page.click("a[data-analytics=NavBarProfileDropDown]");
    await page.waitForSelector("a[data-analytics=NavBarProfileDropDownAdministration]",
    {visible:true,timeout:0});
    await Promise.all([
        page.click("a[data-analytics=NavBarProfileDropDownAdministration]"),
        page.waitForNavigation({waitUntil:"networkidle2"})
    ]);
    /***************************click on manage challenges ********************************* */
    await page.waitForSelector(".administration ul",{visible:true,timeout:0});
    let options = await page.$$(".administration ul li a");
    await Promise.all([
        options[1].click(),page.waitForNavigation({waitUntil:"networkidle2"})
    ]);
    await handleQuestionsInASinglePage(page,browser,moderatorToAdd,pageNo);
    console.log("successful!");
})()

let pageNo = 0;

async function handleQuestionsInASinglePage(page,browser,moderatorToAdd,pageNo){
    await page.waitForSelector(".backbone.block-center",{visible:true,waitUntil:"networkidle2"});
    let questions = await page.$$(".backbone.block-center");
    let pArr = []
    for(let i=0;i<questions.length;i++){
        let newTab = await browser.newPage();
        let href = await page.evaluate(function(el){
            return el.getAttribute("href")
        },questions[i])
        let url = "https://www.hackerrank.com"+href;
        let newPage = handleSingleQuestion(newTab,url,moderatorToAdd);
        pArr.push(newPage);
    }
    await Promise.all(pArr);
    pageNo++;
    console.log("added moderator to all challenges of page no "+pageNo);
    await page.waitForSelector(".pagination",{visible:true,timeout:0});
    let pagination = await page.$$(".pagination li");
    let nextBtnElement = pagination[pagination.length-2];
    let checkDisable = await page.evaluate(function(el){
        return el.getAttribute("class")
    },nextBtnElement);
    if(checkDisable==="disabled"){
        return;
    } else {
        await Promise.all([
            nextBtnElement.click(),
            page.waitForNavigation({waitUntil:"networkidle2"})
        ]);
        handleQuestionsInASinglePage(page,browser,moderatorToAdd,pageNo);
    }
}

async function handleSingleQuestion(newTab,url,moderatorToAdd){
    await newTab.goto(url,{waitUntil:"networkidle2"});
    await newTab.waitForSelector(".tag");
    await newTab.waitForSelector("li[data-tab=moderators]",{visible:true,timeout:0});
    await Promise.all([
        newTab.click("li[data-tab=moderators]"),newTab.waitForNavigation({waitUntil:"networkidle2"})
    ]);
    await newTab.waitForSelector("#moderator",{visible:true,timeout:0});
    await newTab.type("#moderator",moderatorToAdd);
    await newTab.keyboard.press("Enter");
    await newTab.waitForSelector(".save-challenge.btn.btn-green",{visible:true,timeout:0});
    await newTab.click(".save-challenge.btn.btn-green");
    await newTab.close();
}