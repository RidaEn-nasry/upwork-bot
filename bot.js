
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
    if (number > 25) {
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
    // Launch the browser in non-headless mode
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set a realistic user agent string
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');

    // Navigate to the job search results page
    await page.setViewport({
        width: 1920,
        height: 1080
    });
    await page.goto('https://www.upwork.com/ab/account-security/login');

    // Wait for the page to load 
    await page.waitForTimeout(1000);

    // set the high and width of the viewport

    // get email and password from the .env file

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
    await page.waitForSelector('input[placeholder="Search for job"]', { visible: true });
    // then search for javascript jobs , in the input with placeholder 'Search for jobs'
    await page.type('input[placeholder="Search for job"]', 'web development');
    // click the search button
    await page.click('button[data-test="job-search-button"]');


    // wait for the elemnt div[data-test="jobs_per_page"] to load
    await page.waitForSelector('div[data-test="jobs_per_page"]', { visible: true });
    // click the dropdown menu
    await page.click('div[data-test="jobs_per_page"]');
    // wait for the dropdown menu to load
    await page.waitForTimeout(3000);
    // select the 50 jobs per page , which is in <li> <span> 50 </span> </li>
    // select the 50 jobs per page
    await page.click('div[data-test="jobs_per_page"] ul li:nth-child(3)');
    // wait for the page to load
    // await page.waitForTimeout(3000);


    // select the span


    // select the 50 jobs per page

    // then select the span
    // select 50 jobs per page
    // await page.click('div[data-test="jobs_per_page"] ul li:nth-child(3)');
    // wait for the page to load
    await page.waitForTimeout(3000);
    await page.waitForSelector('div[data-test="main-tabs-index"]', { visible: true });

    // get all sections with data-test="JobTile"
    // we gonna go through three pagination pages
    // let jobs = [];

    const listings = await page.$$('section[data-test="JobTile"]');

    // console.log(listings.length);


    // change the page number of jobs
    let jobs = await Promise.all(listings.map(async (listing) => {
        // get the title of the job which in <h4 class="job-tile-title"> <a> </a> </h4>
        // title = await listing.$eval('h4.job-tile-title a', (a) => a.innerText);
        // console.log("I'm the listing\n***********************************");
        // console.log(listing.toString());
        // console.log("***********************************");
        let posted = await getTime(listing);

        // if it's too old, then skip it
        if (tooOld(posted) === true)
            return;

        let title = await getTitle(listing);
        // run titles only for once

        // get the link of the job which is in <h4 class="job-tile-title"> <a href="link"> </a> </h4>
        // link = await listing.$eval('h4.job-tile-title a', (a) => a.href);
        let link = await getLink(listing);

        // get the description of the job which in <span data-test="job-tile-description">
        // description = await listing.$eval('span[data-test="job-description-text"]', (span) => span.innerText);
        let description = await getDescription(listing);
        // get type of job {type, budget}
        // typeOfJob = { type: '', budget: '' };
        let typeOfJob = await getTypeOfJob(listing);

        if (tooCheap(typeOfJob) === true)
            return;
        // typeOfJob = "";
        // // is client's payment verified (true or false)
        // paymentverified = false;
        let paymentverified = await isVerified(listing);

        return { posted, title, link, description, typeOfJob, paymentverified };
    }
    ));


    // filter out the undefined jobs
    jobs = jobs.filter((job) => job !== undefined);
    console.log(jobs);
    // Add some randomness to the requests
    const randomDelay = Math.random() * 2000;
    await page.waitForTimeout(randomDelay);

    // Close the browser
    await browser.close();
})();



