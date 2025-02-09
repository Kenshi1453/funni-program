import * as webdriver from 'selenium-webdriver'

/**
 *
 * @param {() => boolean} cond
 * @param {number} intervalMs
 */
async function waitUntil(cond, intervalMs = 100) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (cond()) {
        clearInterval(interval);
        resolve();
      }
    }, intervalMs);
  });
}

/**
 *
 * @param {webdriver.WebElement} tweet
 */
async function getTextContentFromTweet(tweet) {
  const content = await tweet.findElement(
    webdriver.By.css('div[data-testid="tweetText"]')
  );
  return await content.getText();
}

/**
 *
 * @param {webdriver.WebElement} tweet
 */
async function getTweetID(tweet) {
  //querySelector('div[data-testid="User-Name"]').querySelectorAll("a[aria-label]")
  return await tweet
    .findElement(webdriver.By.css('div[data-testid="User-Name"]'))
    .then((e) => e.findElement(webdriver.By.css("a[aria-label]")))
    .then((l) => l.getAttribute("href"));
}

/**
 *
 * @param {webdriver.WebDriver} driver
 * @param {webdriver.Locator} locator
 */
async function waitForElemThenGet(driver, locator) {
  await driver.wait(webdriver.until.elementLocated(locator));
  return await driver.findElement(locator);
}

/**
 *
 * @param {webdriver.WebDriver} driver
 * @param {webdriver.Locator} locator
 */
async function waitForAllElemThenGet(driver, locator) {
  await driver.wait(webdriver.until.elementLocated(locator));
  return await driver.findElements(locator);
}

/**
 *
 * @param {webdriver.WebDriver} driver
 * @param {webdriver.WebElement} tweet
 */
async function setTweetSeen(driver, tweet) {
  await driver.executeScript(
    'arguments[0].parentElement.parentElement.parentElement.setAttribute("data-seen", "")',
    tweet
  );
}

async function sleep(ms){
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export {getTextContentFromTweet, getTweetID, setTweetSeen, waitForAllElemThenGet, waitForElemThenGet, waitUntil, sleep}