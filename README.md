# upwork-bot

You can a "how i did it" [here](https://www.ridaennasry.me/posts/scraping-upwork-jobs-using-nodejs/)<br>
This is a simple bot i scrambled toghether cause i was sick and tired of **you know** (referesh, refresh...) it bassicaly scrape 
upwork.com for jobs using configurable keywords and filter those jobs based on a creteria.

The script is diveded into 2 parts for decoupling sake, `bot.js` do all the scraping stuff and fill in `jobs.json` file with an array of json objects each
representing a job listing something like this:



```
[
  {
    "posted": "5 minutes ago",
    "title": "Senior Software and App Engineer",
    "link": "https://www.upwork.com/jobs/Senior-Software-and-App-Engineer_~012d16e9ca1001988c/",
    "description": "We need an absolute ninja to go through and clean up our entire platform, and our mobile apps to perform at their highest levels possible to increase our satisfaction and functionality in the field. We need a perfectionist, and someone who works efficiently because of their superior abilities. We have several integrations that need fine-tuned and more in the pipeline that will need done. So intimate knowledge of Api and SDK integrations will be necessary. He will also assist an IT support and be available for emergency service in the case of complete failure. We do not see this being the case as we are hiring you to make the system fail proof. We are young growing, high definition, video intercom system, and there is long-term potential be on this contract term.",
    "typeOfJob": {
      "type": "Hourly: ",
      "budget": "$35.00-$46.00"
    },
    "paymentverified": true
  },
  {
    "posted": "7 minutes ago",
    "title": "Build a web and mobile application",
    "link": "https://www.upwork.com/jobs/Build-span-web-span-and-mobile-application_~015ad09536ea065d5d/",
    "description": "You can read the specification document attached. This document contains all what you need.",
    "typeOfJob": {
      "type": "Fixed-price",
      "budget": "$1000 "
    },
    "paymentverified": false
  },
  {
    "posted": "7 minutes ago",
    "title": "Order platform",
    "link": "https://www.upwork.com/jobs/Order-platform_~0185808b1d24763136/",
    "description": "Looking to get a orders platform for a remittance company. Using Laravel Customer must be able to sign up, login, get live rate, book transaction and manage beneficiary and linked attributes. What would be the time line and approx cost",
    "typeOfJob": {
      "type": "Hourly",
      "budget": "not specified"
    },
    "paymentverified": true
  },
 ]

```

then there's `notifyjobs.sh` which just a bash script that display those as notifications in macos.
so if you want to get the jobs in discord or telegram or whataver you could go throught step one  (and optionally three) and then go yourway. 


## How to use

 1. create a `.env` file and add to it:
 
 ```
 EMAIL=yourupworkemail
 PASSWORD=yourupworkpassword
 ```
 the reason i log in before scraping is that i noticed the quality of search results for authenticated versus not authenticated users are fairly obvious.
 
 2. install required packages using whatever method, i use `brew`

```
brew install alerter jq
```
`jq` to parse json files and `alerter` is an awaesome wrapper to display notification in macos.

then install packages needed by the bot:
```
cd /root/directory/ && npm install
```
 
 3. automate the scripts using whatever method, i use `cron` 
 
 ```
 crontab -e 
 ```
 and add for the bot (i scrap each 5 minutes, change to your liking)
 ```
 */5 * * * * /path/to/node /path/to/bot.js
 ```
 and to display notification 
 ```
 */7 * * * * /path/to/notifyjob.sh
 ```
 
 
 The notification looks something like, if you feel adventurous you click `open` to open it in your fav browser

 <img width="392" alt="Screenshot 2022-12-17 at 20 53 29" src="https://user-images.githubusercontent.com/65143740/208701242-2efa0943-dcb2-43fd-9da7-d822760cac4e.png">

 
