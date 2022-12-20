
// if there's a timeout error, wait for 10 seconds and run the script again 

const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

function getRndm(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// get the type of job
async function getTypeOfJob(listing) {
    let type = await listing.$eval('strong[data-test="job-type"]', (strong) => strong.innerText);
    // if type is hourly get the budget from the same element <strong data-test="job-type">
    // let budget = '';
    if (type.includes('Hourly')) {
        // search for $ sign in the text
        let index = type.indexOf('$');
        // console.log(index);
        // if budget is specified
        if (index !== -1) {
            // get the budget
            let budget = type.substring(index);
            // remove the budget from the type
            type = type.substring(0, index);
            return { type, budget };
        } else {
            // if budget is not specified
            let budget = 'not specified';
            return { type, budget };
        }
        // get the budget
    }
    else if (type.includes('Fixed')) {
        let budget = await listing.$eval('span[data-test="budget"]', (span) => span.innerText);
        return { type, budget };
    }
}

async function isVerified(listing) {
    // check if the payment is verified
    let status = await listing.$eval('small[data-test="payment-verification-status"] strong', (strong) => strong.innerText);
    if (status === "Payment verified") {
        return true;
    }
    return false;
}

async function getTitle(listing) {
    // get the title of the job which in <a href="/jobs/..."> title </a>
    let title = await listing.$eval('a[href^="/jobs/"]', (a) => a.innerText);
    return title;

}

async function getLink(listing) {
    // get the link of the job which is in <h4 class="job-tile-title"> <a href="link"> </a> </h4>
    return await listing.$eval('a[href^="/jobs/"]', (a) => a.href);

}

async function getDescription(listing) {
    // get the description of the job which in <span data-test="job-tile-description">
    let description = await listing.$eval('span[data-test="job-description-text"]', (span) => span.innerText);
    return description;
}

async function getTime(listing) {
    // get the time of the job which in <span data-test="UpCRelativeTime">
    let time = await listing.$eval('span[data-test="UpCRelativeTime"]', (span) => span.innerText);
    return time;
}

function tooOld(time) {
    if (time.includes('hour') || time.includes('day'))
        return true;
    // get the number of number 
    let index = time.indexOf(' ');
    let number = time.substring(0, index);
    number = parseInt(number);
    if (number > 15) {
        return true;
    }
    return false;
}

function tooCheap(typeOfJob) {
    // console.log(typeOfJob.type);
    if (typeOfJob.type.includes('Fixed')) {
        if (typeOfJob.budget.includes(',')) {
            typeOfJob.budget = typeOfJob.budget.replace(',', '');
        }
        let budget = parseInt(typeOfJob.budget.substring(1));
        // if it includes a comma remove it
        if (budget < 300) {
            return true;
        }
    }
    else if (typeOfJob.type.includes('Hourly')) {
        let budget = parseInt(typeOfJob.budget.substring(1, typeOfJob.budget.indexOf('-')));
        if (budget < 15) {
            return true;
        }
    }
    return false;
}

(async () => {
    // reading keywords from keywords.txt file
    let keywords = fs.readFileSync('./keywords.txt', 'utf-8');
    keywords = keywords.split('\n');
    for (let i = 0; i < keywords.length; i++) {
        keywords[i] = keywords[i].trim();
    }
    // Launch the browser in non-headless mode
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // Set a realistic user agent string
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');

    // set the viewport to 1920x1080 to avoid the cookie banner 
    await page.setViewport({
        width: 1920,
        height: 1080
    });
    await page.goto('https://www.upwork.com/ab/account-security/login');
    // Wait for the page to load 
    await page.waitForTimeout(1000);

    // getting the email and password from the .env file
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    // enter the email and password
    await page.type('#login_username', email);
    // click the "continue with email" button
    await page.click('#login_password_continue');
    // some randomness to the mouse movement
    for (let i = 0; i < 10; i++) {
        await page.mouse.move(getRndm(0, 10000), getRndm(0, 1000));
        await page.waitForTimeout(1000);
    }
    // password
    await page.type('#login_password', password);
    await page.click('#login_control_continue');
    // move the mouse randomly to be more human 🤡
    for (let i = 0; i < 10; i++) {
        await page.mouse.move(getRndm(0, 20000), getRndm(0, 10000));
        await page.waitForTimeout(1000);
    }
    // wait for the page to load
    // wait for the search input to load 
    let allJobs = [];

    // wait for search input to load
    // await page.waitForSelector('input[placeholder="Search for job"]', { visible: true });
    for (let i = 0; i < keywords.length; i++) {
        // console.log('searching for ' + keywords[i]);
        for (let j = 0; j < 5; j++) {
            // scrolling throught 5 pages 
            await page.goto('https://www.upwork.com/ab/jobs/search/?q=' + keywords[i] + '&page=' + j + '&sort=recency');
            await page.waitForTimeout(3000);
            await page.waitForSelector('div[data-test="main-tabs-index"]', { visible: true });
            // get all sections with data-test="JobTile"
            const listings = await page.$$('section[data-test="JobTile"]');
            // change the page number of jobs
            let jobs = await Promise.all(listings.map(async (listing) => {
                // get the title of the job which in <h4 class="job-tile-title"> <a> </a> </h4>
                let posted = await getTime(listing);
                // if it's too old, then skip it
                if (tooOld(posted) === true)
                    return;
                // get title of the job
                let title = await getTitle(listing);
                // get the link of the job 
                let link = await getLink(listing);
                // get the description of the job 
                let description = await getDescription(listing);
                // get type of job {type, budget}
                let typeOfJob = await getTypeOfJob(listing);
                if (tooCheap(typeOfJob) === true)
                    return;
                // // is client's payment verified (true or false)
                let paymentverified = await isVerified(listing);
                return { posted, title, link, description, typeOfJob, paymentverified };
            }
            ));
            // filter out the undefined jobs and already pushed jobs
            jobs = jobs.filter((job) => job !== undefined && !jobs.includes(job));
            // push jobs to alljobs
            allJobs.push(...jobs);
        }

    }
    // Add some randomness to the requests
    const randomDelay = Math.random() * 2000;
    await page.waitForTimeout(randomDelay);
    // Close the browser
    await browser.close();
    // write to json file by overriding the file
    fs.writeFileSync('./jobs.json', JSON.stringify(allJobs, null, 2));
})();



