# TWITTER THRONE NOTIFICATION SCRAPPER

This git repo contains code for scanning throne notifications from a twitter account to then do things based on the donation.

In the example pushed on the repository, it was used to do *fun* things to someone on specific donations.

You WILL need to change some variables/constants in the `index.js` file, but it should be the only one you need to modify to make the bot work!

How to use?
- First download geckodriver and put it in this directory (or in your PATH). I'm using firefox. You could just change that in the `index.js` file.
- Run `node index.js`
- It's THAT easy.


# MANUAL GEARS
The bot has some manual controls:
- `print`: Shows the current state of the queue in pretty format
  - You can use `print debug` to print it as a "minified" JSON string. Is useful for another command
  - Also `print pretty` which is the same as `print` without arguments. Idk why
- `pause`: Will pause reading the queue
- `resume`: Will resume reading the queue
- `add <JSON_ARR>`: Will add to the queue a JSON Array. I'm not doing any schema validation or whatnot in here because you're supposed to know what you're doing here. It's mainly been done to take in the input of `print debug` but you could also just yolo JSON inside.