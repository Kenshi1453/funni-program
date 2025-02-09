import * as webdriver from "selenium-webdriver";
import { By } from "selenium-webdriver";

import { PiShockAPI } from "./pishock.js";
import { AsyncQueue } from "./queue.js";
import {
  getTextContentFromTweet,
  getTweetID,
  setTweetSeen,
  sleep,
  waitForAllElemThenGet,
  waitForElemThenGet,
  waitUntil,
} from "./utils.js";
import * as firefox from "selenium-webdriver/firefox.js";

const USERNAME = "YOUR TWITTER ACCOUNT USERNAME";
const PASSWORD = "YOUR TWITTER ACCOUNT PASSWORD";
const TWITTER_PAGE_URL = "THE TWITTER PAGE YOU WANT TO SCAN"
// The regex you use to capture donation name and donation type from a Throne notification. It HAS to have 2 capturing groups
const MATCH_REGEX = /I just received (.+) from (.+) via Throne\./
const PISHOCK_API_KEY = "YOUR PISHOCK ACCOUNT'S API KEY";
const PISHOCK_USERNAME = "YOUR PISHOCK ACCOUNT USERNAME";
const PISHOCK_SHARE_CODE = "THE PISHOCK SHARECODE OF THE ONE YOU WANT TO SHOCK";
const PISHOCK_API_URL = "https://do.pishock.com/api/apioperate/";

/** @type {AsyncQueue<{type: string, name: string}>} */
const DONATION_QUEUE = new AsyncQueue();

let SHOULD_READ_QUEUE = true;

(async function main() {
  const options = new firefox.Options()
  .addArguments("-headless");
  const driver = new webdriver.Builder()
    .forBrowser(webdriver.Browser.FIREFOX)
    .setFirefoxOptions(options)
    .build();

  try {
    /// ######## LOGGING INTO TWITTER ########
    /** @type {(str)} */
    let latestSeen = "";
    //
    // console.info("LOGGING ON X...");
    await driver.get("https://x.com/i/flow/login");
    const userNameInput = await waitForElemThenGet(
      driver,
      webdriver.By.css("input[autocomplete='username']")
    );
    userNameInput.sendKeys(USERNAME);
    const nextButtonLocator = webdriver
      .locateWith(webdriver.By.css("button"))
      .below(webdriver.By.css("button[data-testid='apple_sign_in_button']"));
    const nextButton = await driver.findElement(nextButtonLocator);
    await nextButton.click();
    const passwordInput = await waitForElemThenGet(
      driver,
      webdriver.By.css("input[name='password']")
    );
    await passwordInput.sendKeys(PASSWORD);
    const connectButton = await driver.findElement(
      webdriver.By.css('button[data-testid="LoginForm_Login_Button"]')
    );
    await connectButton.click();
    await driver.sleep(1000);

    /// ######## MAIN SCRAPPING LOOP ########
    while (true) {
      await driver.get(TWITTER_PAGE_URL);

      // Do funky stuff to visualise data seen
      await driver.executeScript(`
var styles = \`
    *[data-seen]{
    	border: red 1px solid;
    }
\`

var styleSheet = document.createElement("style")
styleSheet.textContent = styles
document.head.appendChild(styleSheet)`);

      // console.info("FETCHING NEW DATA 🔥");
      let tweets = await waitForAllElemThenGet(
        driver,
        webdriver.By.css("article[data-testid='tweet']")
      );
      await setTweetSeen(driver, tweets[0]);

      // console.info(`Got ${tweets.length} tweets...`);
      const firstTweet = tweets[1];
      const id = await getTweetID(firstTweet);
      if (latestSeen === "") {
        latestSeen = id;
        console.log("BOT HAS BEEN WARMED UP!")
      } else {
        if (latestSeen !== id) {
          /**
           * At this point in the code, we know there has been at least 1 new post.
           * However, because twitter lazy loads the tweets, we need to scroll down
           * the timeline until we find the latest tweet we saw. To do that, we inject
           * an attribute to the DOM to know which nodes we have seen, and only get the tweets
           * AFTER the nodes seen (to avoid duplicates). This allows us to not hold references to DOM
           * elements for too long as to avoid stale references. However, they sometimes still happen (very rarely and only when scrolling
           * very far down). In that case (and if the program doesn't manage to recover and hangs), there are manual commands
           * you can input to recover state and transfer it between executions.
           */
          // console.info("CATCHING UP! GETTING ALL TWEETS BEFORE LATEST SEEN!");
          let cpt = 0;
          let donationCpt = 0;
          while (true) {
            let lastSeenSaw = false;
            let errored = false;
            do {
              errored = false;
              for (const tweet of tweets) {
                try {
                  await setTweetSeen(driver, tweet);
                  const id = await getTweetID(tweet);
                  if (id === latestSeen) {
                    lastSeenSaw = true;
                    break;
                  }
                  const text = await getTextContentFromTweet(tweet);
                  
                  const match = MATCH_REGEX.exec(text);
                  if (match !== null) {
                    const donation = match[1].trim();
                    const donatorName = match[2].trim();
                    const dono = { type: donation, name: donatorName };
                    DONATION_QUEUE.enqueue(dono);
                    donationCpt += 1;
                  }
                  cpt += 1;
                } catch (e) {
                  errored = true;
                  console.error("STALE ELEMENT AT CATCHING UP STEP, RESTART OR IT WILL SURELY HANG! TRYING TO RECOVER...");
                  tweets = await waitForAllElemThenGet(
                    driver,
                    By.css(
                      "div[data-seen] ~ div:not([data-seen]) > div > div > article"
                    )
                  );
                  break;
                }
              }
            } while (errored);

            if (lastSeenSaw) break;

            do {
              errored = false;
              let lastTweet = tweets[tweets.length - 1];
              try {
                await driver.executeScript(
                  "arguments[0].scrollIntoView()",
                  lastTweet
                );
              } catch (e) {
                errored = true;
                console.error(
                  "STALE ELEMENT AT SCROLL STEP! RESTART BECAUSE IT WILL SURELY HANG! TRYING TO RECOVER..."
                );
                tweets = await waitForAllElemThenGet(
                  driver,
                  By.css(
                    "div[data-seen] ~ div:not([data-seen]) > div > div > article"
                  )
                );
              }
            } while (errored);
            tweets = await waitForAllElemThenGet(
              driver,
              By.css(
                "div[data-seen] ~ div:not([data-seen]) > div > div > article"
              )
            );
          }

          // console.info(
          //   `CATCHED UP WITH ${cpt} TWEETS AND ${donationCpt} DONATIONS!`
          // );
          latestSeen = id;
        }
      }
      const MINUTES = 1;
      // console.info(`Waiting ${MINUTES}minutes`);

      await driver.sleep(MINUTES * 60 * 1000);
    }
  } finally {
    await driver.quit();
  }
})();

/// ######## MANUAL CONTROLS ########
process.stdin.on("data", (input) => {
  const textInput = input.toString().trim();
  if (textInput.startsWith("print")) {
    const splitted = textInput.split(" ");
    let arg = "";
    if (splitted.length == 1) arg = "pretty";
    else arg = splitted[1];
    if (arg === "pretty") {
      console.log("[MANUAL]", DONATION_QUEUE._list);
    } else if (arg === "debug") {
      console.log("[MANUAL]", JSON.stringify(DONATION_QUEUE._list));
    }
  } else if (textInput === "pause") {
    SHOULD_READ_QUEUE = false;
    console.log("[MANUAL] pausing queue...");
  } else if (textInput === "resume") {
    SHOULD_READ_QUEUE = true;
    console.log("[MANUAL] resuming queue...");
  } else if (textInput.startsWith("add")) {
    const i = textInput.indexOf(" ");
    if (i === -1) {
      console.log("[MANUAL] give an argument dumbass");
      return;
    }
    const arr = JSON.parse(textInput.substring(i));
    console.log("Adding %O to queue", arr);
    if (Array.isArray(arr)) {
      for (const v of arr) {
        DONATION_QUEUE.enqueue({ ...v });
      }
    }
  }
});

/// ######## DONATION QUEUE LOOP ########
const pishockAPI = new PiShockAPI(
  PISHOCK_API_KEY,
  PISHOCK_USERNAME,
  PISHOCK_SHARE_CODE,
  PISHOCK_API_URL
);

while (true) {
  // console.log("Waiting for queue input...");
  const donation = await DONATION_QUEUE.dequeue();
  if (!SHOULD_READ_QUEUE) {
    await waitUntil(() => SHOULD_READ_QUEUE);
  }
  // This is an example of how to use the queue. If donation is a valid type handle it then wait 30s (15*2)
  // else just go to the next element of the queue
  let duration = 15;
  let intensity = NaN;
  if (donation.type.startsWith("FIRST DONATION TYPE")) {
    intensity = 50;
  } else if (donation.type.startsWith("SECOND DONATION TYPE")) {
    intensity = 100;
  }
  if (!isNaN(intensity)) {
    await pishockAPI.sendShock(donation.name, duration, intensity);
    await sleep(duration * 1000 * 2); // wait for shock AND break time
  }
}
