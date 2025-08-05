# Sewage Surfer Helper

This Greasemonkey script helps you play the Sewage Surfer game by automatically placing pipes to create a path.
Available modes: avatar mode (recommended) or high score mode.

## Features

* **Autoplay:** The script automatically places pipes for you.
* **Avatar Route:** This route is designed to quickly go through Sewage Surfer to help the player earn the avatar (and possibly a trophy, if the user submits a score early in the month).
* **High Score Route:** This route attempts to create the longest possible path for a high score, but is less reliable due to the random nature of the pipes given.

## Installation

This script requires a user script manager like **Tampermonkey** or **Greasemonkey**.

1.  **Install a User Script Manager:** If you don't already have one, install a user script manager extension for your browser.
2.  **Create a New User Script:**
    * Click on the Greasemonkey/Tampermonkey icon in your browser's toolbar.
    * Select "Create a new script..." (or "New script").
3.  **Paste the Script:**
    * Delete any existing code in the new script editor.
    * Copy the entire code from the Sewage Surfer Helper script and paste it into the editor.
4.  **Save the Script:** Save the script (usually Ctrl+S or File > Save).

## Usage

1.  Start a new game of Sewage Surfer.
2.  The script will automatically detect the game and start placing pipes based on JellyNeo's pre-set solutions.
3.  The script's default behavior is to use the **Avatar Route**, as the pipes given are random and this is the most reliable strategy.
4.  If you wish to attempt the **High Score Route**, you can toggle this feature within the script code. I highly recommend turning on DEBUG_MODE if you choose this route, since you may want to alter your path midway through a level.

## Compatibility

* **Browser:** Compatible with modern web browsers (Chrome, Firefox, Edge, Opera) using a user script manager.
* **Game:** Designed specifically for the Neopets Sewage Surfer game.

## Contributing

Contributions are welcome! If you have suggestions for improvements, bug fixes, or new features, feel free to open an issue or submit a pull request.

## License

This project is open-source and available under the MIT License.

**Disclaimer:** "Neopets" is a registered trademark of Neopets, Inc. This script is an unofficial fan-made helper and is not affiliated with or endorsed by Neopets, Inc. The solutions used by this script are based on information from JellyNeo, which is also an unofficial fan site.
