// ==UserScript==
// @name 						Sewage Surfer Helper
// @namespace 			GreaseMonkey
// @version 				1.0
// @description 		Places pipes onto the grid. DEBUG mode added for testing and a bit of manual play.
// @author 					@willnjohnson
// @match 					*://www.neopets.com/games/sewage/sewage.phtml*
// @grant 					none
// ==/UserScript==

// This autoplayer uses pre-set solutions (based on JellyNeo's "guide")
// 	Note 1: The pieces you get are purely based on RNG, so it's possible to fail a level, especially the DREADED level 10.
// 	Note 2: Recommend using this script for just the AVATAR since the HIGH SCORE route is nearly impossible
//
// Idea for Potential Improvement:
//			 - Perform Monte Carlo simulation to find optimal number of pipes with a success rate >= XX% (pre-computed) -- requires knowing what pieces are available and what the initial maze looks like
//			 - Algorithm to solve maze... perhaps BFS with lookahead of the three pipes in hand?
//
//			 (I have no plans on revising this script since it requires a lot of manual work checking every level, but you are welcome to modify this script, if you think you can improve on it.)
//
// Links that might be useful to force a new game entirely:
// - https://www.neopets.com/games/sewage/sewage.phtml?quit=2
// - https://www.neopets.com/games/sewage/sewage.phtml?delete=1
//

(function () {
    'use strict';

    const DEBUG_MODE = false; 							// Set to true for manual 'A' key press. Set to false for autoplay. (Might be handy, if you want to tweak your route mid-way through a level.)
    const AUTOPLAY_DELAY_MIN_MS = 700; 			// Minimum delay for autoplay in milliseconds (700 second)
    const AUTOPLAY_DELAY_MAX_MS = 1500;			// Maximum delay for autoplay in milliseconds (1.5 seconds)
  	const PATH = 0;													// 0 = AVATAR PATH, 1 = HIGH SCORE PATH

    let autoplayTimer = null;

  	// Avatar routes denoted with 'a'; if there's no 'a', route is defaulted to high score route
  	const sewageSolutions = {
      "1": [
        "OOOOO",
        "O   O",
        "─────",
        "O   O",
        "OOOOO"
      ],
      "2": [
        "OOOOO",
        "O┌─┐O",
        "─┘O└─",
        "O   O",
        "OOOOO"
      ],
      "3": [
        "OOOOO",
        "O┌┬┐O",
        "─┼┼┼─",
        "O└┴┘O",
        "OOOOO"
      ],
      "4": [
        "OOOOOO",
        "O┌─┐ O",
        "─┘O└┐O",
        "O  O└─",
        "O    O",
        "OOOOOO"
      ],
      "5": [
        "OOOOOO",
        "──┐O O",
        "OO└─┐O",
        "O  O|O",
        "O   |O",
        "OOOO|O"
      ],
      "6": [
        "OOOOOO",
        "OO┌┐ O",
        "──┘| O",
        "OO └──",
        "O   OO",
        "OOOOOO"
      ],
      "6a": [
        "OOOOOO",
        "OO   O",
        "──┐  O",
        "OO└───",
        "O   OO",
        "OOOOOO"
      ],
      "7": [
        "OO|OOO",
        "O┌┴─┐O",
        "O|  |O",
        "O|  |O",
        "O└─┬┘O",
        "OOO|OO"
      ],
      "8": [
        "OOOOOOO",
        "O┌───┐O",
        "O|O O|O",
        "─┘   └─",
        "O O O O",
        "O     O",
        "OOOOOOO"
      ],
      "8a": [
        "OOOOOOO",
        "O     O",
        "O O O O",
        "───────",
        "O O O O",
        "O     O",
        "OOOOOOO"
      ],
      "9": [
        "O|OOOOO",
        "O|O┌─┐O",
        "O├┬┘O|O",
        "O└┘O┌┤O",
        "O O └┤O",
        "O   O|O",
        "OOOOO|O"
      ],
      "10": [
        "OOOOOOOOO",
        "O┌──┬──┐O",
        "O|OO|OO|O",
        "─┤O┌┴┐O|O",
        "O├─┤O├─┤O",
        "O|O└┬┘O├─",
        "O|OO|OO|O",
        "O└──┴──┘O",
        "OOOOOOOOO"
      ],
      "10a": [
        "OOOOOOOOO",
        "O┌──┐   O",
        "O|OO|OO O",
        "─┤O┌┴┐O O",
        "O└─┤O├─┐O",
        "O O└┬┘O├─",
        "O OO|OO|O",
        "O   └──┘O",
        "OOOOOOOOO"
      ],
      "11": [
        "OO|OOO",
        "O ├─┐O",
        "OO|O|O",
        "──┼─┤O",
        "OO|O|O",
        "Oc┴─┘O",
        "OOOOOO"
      ],
      "11a": [
        "OO|OOO",
        "O |  O",
        "OO|O O",
        "──┼─ↄO",
        "OO|O O",
        "O ∪  O",
        "OOOOOO"
      ],
      "12": [
        "OO|OOOOOOO",
        "O┌┘O ┌──┐O",
        "O└┐O┌┘ ┌┘O",
        "O┌┘O└┐O└┐O",
        "O└┐O┌┘O┌┘O",
        "O┌┘O└┐O└┐O",
        "O|┌─┐|O┌┘O",
        "O└┘ └┘O└┐O",
        "OOOOOOOO|O"
      ],
      "12a": [
        "OO|OOOOOOO",
        "O┌┘O     O",
        "O└┐O ┌─┐ O",
        "O┌┘O┌┘O└┐O",
        "O└┐O└┐O┌┘O",
        "O┌┘O┌┘O└┐O",
        "O|┌─┘ O┌┘O",
        "O└┘   O└┐O",
        "OOOOOOOO|O"
      ],
      "13": [
        "OOOOOOOOOOOO",
        "──┐  ∩  ∩  O",
        "Oc┼┬─┼┬─┼┐ O",
        "O ├┼┬┴┼┐└┼ↄO",
        "O |├┼┬┴┼┐| O",
        "Oc┼┤├┼┬┴┼┤ O",
        "O ├┼┤└┼┬┴┼ↄO",
        "O |└┼┐└┼┐| O",
        "Oc┼┐└┼┐└┼┤ O",
        "O └┼─┴┼─┴┼ↄO",
        "O  ∪  ∪  └──",
        "OOOOOOOOOOOO"
      ],
      "13a": [
        "OOOOOOOOOOOO",
        "────┐∩     O",
        "O ┼ └┼┬┐┼  O",
        "O  ┼ └┼┤ ┼ O",
        "O   ┼ └┼┐  O",
        "O ┼  ┼ └┼┐ O",
        "O  ┼  ┼ └┼ↄO",
        "O   ┼  ┼ └┐O",
        "O ┼  ┼  ┼ |O",
        "O  ┼  ┼  ┼|O",
        "O         └─",
        "OOOOOOOOOOOO"
      ],
      "14": [
        "OOOOOO",
        "───┐OO",
        "OOO|OO",
        "O┌─┼──",
        "O|O|OO",
        "O└─┘OO",
        "OOOOOO"
      ],
      "15": [
        "OOOOOOOOOOO",
        "O┌┐┌┐┌┐┌─┐O",
        "O|└┘└┘|└┐|O",
        "O└─┐┌─┘┌┘|O",
        "O┌─┘└─┐└┐|O",
        "O|┌──┐└─┘|O",
        "O|└┐┌┘┌┐┌┘O",
        "O|┌┘|O||└┐O",
        "O|└┐|O|├ↄ|O",
        "O└─┘┌─┐└─┘O",
        "OOOO|O|OOOO"
      ],
      "16": [
        "OOOOOOOOOOO",
        "O┌ ┐ ┌─┐ ┐O",
        "O └ ┌┘┐└┐ O",
        "O└ ┐|└ └|┘O",
        "O┌┐┌┘ ┌ └┐O",
        "─┘└┘ ┐ ┌ └─",
        "O ┐ ┌ └ ┘ O",
        "O┌ ┐ ┘ ┐ ┐O",
        "O ┐ ┌ ┌ ┌ O",
        "O└ └ └ ┘ ┘O",
        "OOOOOOOOOOO"
      ],
      "17": [
        "O|OOOOO",
        "O└─┐  O",
        "O O|O∩O",
        "Oc─┼─┤O",
        "O O|O|O",
        "O  └─┤O",
        "OOOOO|O"
      ],
      "17a": [
        "O|OOOOO",
        "O├─┐  O",
        "O∪O|O O",
        "O c┼ↄ O",
        "O O|O∩O",
        "O  └─┤O",
        "OOOOO|O"
      ],
      "18": [
        "OOOOOOO",
        "O ┬  ┌─",
        "OO OO|O",
        "O  O┌┘O",
        "O OO|OO",
        "────┴ↄO",
        "OOOOOOO"
      ],
      "19": [
        "OOOOOO|OO",
        "O ┌─┐O└┐O",
        "O┌┘O|O┌┘O",
        "O└┐O|O└┐O",
        "O┌┘O|O┌┘O",
        "O└┐O└─┘ O",
        "OO|OOOOOO"
      ],
      "19a": [
        "OOOOOO|OO",
        "O ┌─┐O| O",
        "O┌┘O|O| O",
        "O└┐O|O└┐O",
        "O┌┘O|O┌┘O",
        "O└┐O└─┘ O",
        "OO|OOOOOO"
      ],
      "20": [
        "OOOO|OOOO",
        "O┌─┐└──┐O",
        "O|O└┬┐O|O",
        "O├┬─┘|┌┤O",
        "O├┴┐O└┘├─",
        "O| |┌──┤O",
        "O|O|| O|O",
        "O└─┴┴──┘O",
        "OOOOOOOOO"
      ],
      "20a": [
        "OOOO|OOOO",
        "O┌─ └──┐O",
        "O|O   O|O",
        "O  ─ | |O",
        "O   O  └─",
        "O  | ─  O",
        "O|O   O|O",
        "O└─  ──┘O",
        "OOOOOOOOO"
      ],
      "21": [
        "OOOOOO",
        "─┬┬─┐O",
        "O|├┬┤O",
        "O├┴┤|O",
        "O└─┴┴─",
        "OOOOOO"
      ],
      "22": [
        "OOOOOOO",
        "─┐    O",
        "O|O   O",
        "O└┐ O O",
        "O |O  O",
        "O └┐  O",
        "O O└┐OO",
        "O   └┐O",
        "O  O |O",
        "OO   |O",
        "O   O└─",
        "OOOOOOO"
      ],
      "22a": [
        "OOOOOOO",
        "─┐    O",
        "O|O   O",
        "O|  O O",
        "O| O  O",
        "O|    O",
        "O|O  OO",
        "O|┌──┐O",
        "O└┘O |O",
        "OO   |O",
        "O   O└─",
        "OOOOOOO"
      ],
      "23": [
        "OOOOOOOOOO",
        "────────┐O",
        "O┌──────┘O",
        "O└──────┐O",
        "O┌──────┘O",
        "O└──────┐O",
        "────────┘O",
        "OOOOOOOOOO"
      ],
      "24": [
        "OOOOOOOOOOO",
        "──┬───┬──┐O",
        "OO|OOO|OO|O",
        "O┌┼┐O┌┴┐O|O",
        "O└┴┘O└─┘O|O",
        "OOOOOOOOO|O",
        "O┌─┐O┌─┐O|O",
        "O└┬┘O└┬┘O|O",
        "OO|OOO|OO|O",
        "──┴───┴──┘O",
        "OOOOOOOOOOO"
      ],
      "24a": [
        "OOOOOOOOOOO",
        "─────────┐O",
        "OO OOO OO|O",
        "O ┼ O ┴ O|O",
        "O   O   O|O",
        "OOOOOOOOO|O",
        "O ┬ O ┬ O|O",
        "O   O   O|O",
        "OO OOO|OO|O",
        "─────────┘O",
        "OOOOOOOOOOO"
      ],
      "25": [
        "OOOOO|OOOOO",
        "O    ├───┐O",
        "O  O | O |O",
        "O OOO| OO|O",
        "O  OO|   |O",
        "O┌───┼───┘O",
        "O|   |OO  O",
        "O|OO |OOO O",
        "O| O | O  O",
        "O└───┤    O",
        "OOOOO|OOOOO"
      ],
      "25a": [
        "OOOOO|OOOOO",
        "O    |    O",
        "O  O | O  O",
        "O OOO| OO O",
        "O  OO|    O",
        "O ─ ┌┼───┐O",
        "O   └┘OO |O",
        "O OO  OOO|O",
        "O  O | O |O",
        "O    ┌───┘O",
        "OOOOO|OOOOO"
      ],
      "26": [
        "OOOOOOOOOOO",
        "O┌┐┌─────┐O",
        "O|└┤OOOOO|O",
        "─┘ └┐ ┌──┘O",
        "O┌──┴─┴┐ ┌─",
        "O|OOOOO├┐|O",
        "O└─────┘└┘O",
        "OOOOOOOOOOO"
      ],
      "26a": [
        "OOOOOOOOOOO",
        "O  ┌     ┐O",
        "O   OOOOO O",
        "──┐└┌───┐┘O",
        "O┌└─┘  ┐└──",
        "O OOOOO   O",
        "O└     ┘  O",
        "OOOOOOOOOOO"
      ],
      "27": [
        "OOOOOOOOO",
        "O┌┬┐O┌┬┐O",
        "O└┼┤O├┼┘O",
        "O └┤O├┘ O",
        "──┐├─┤┌──",
        "O ||O|| O",
        "O┌┼┐O├┼┐O",
        "O└┴┘O└┴┘O",
        "OOOOOOOOO"
      ],
      "27a": [
        "OOOOOOOOO",
        "O   O   O",
        "O ┼ O ┼ O",
        "O ┌┐O┌┐ O",
        "──┤├─┤├──",
        "O └┘O└┘ O",
        "O ┼ O ┼ O",
        "O   O   O",
        "OOOOOOOOO"
      ],
      "28": [
        "OO|OOOOOOOO",
        "O┌┴┬─┬─┐  O",
        "O|O| | |O O",
        "O|O|O|O|O O",
        "O|O|O|O|O O",
        "O|O|O|O|O O",
        "O|O| | |O O",
        "O└─┴─┴─┴┐ O",
        "OOOOOOOO|OO"
      ],
      "28a": [
        "OO|OOOOOOOO",
        "O┌┴┐      O",
        "O|O|    O O",
        "O|O|O O O O",
        "O|O|O O O O",
        "O|O|O O O O",
        "O|O|    O O",
        "O└─┴────┐ O",
        "OOOOOOOO|OO"
      ],
      "29": [
        "OOOOOOO|O",
        "O   ┌──┘O",
        "O  O└┐ OO",
        "O OO┌┘OOO",
        "O┌──┘OOOO",
        "O|  OOOOO",
        "O| OOOOOO",
        "O|OOOOOOO",
        "O|OOOOOOO"
      ],
      "29a": [
        "OOOOOOO|O",
        "O   ┌──┘O",
        "O  O|  OO",
        "O OO| OOO",
        "O┌──┘OOOO",
        "O|  OOOOO",
        "O| OOOOOO",
        "O|OOOOOOO",
        "O|OOOOOOO"
      ],
      "30": [
        "OOOOOOOOOOO",
        "O┌┐O   O  O",
        "O└┤O   O┌──",
        "OO├┬┐O┌┬┤OO",
        "O └┤├─┤├┘ O",
        "O O├┘O└┤O O",
        "O ┌┤   ├┐ O",
        "OO├┘ O └┤OO",
        "──┘O   O├┐O",
        "O  O   O└┘O",
        "OOOOOOOOOOO"
      ],
      "30a": [
        "OOOOOOOOOOO",
        "O  O   O  O",
        "O  O   O┌──",
        "OO   O ┌┤OO",
        "O     ┌┴┘ O",
        "O O  O| O O",
        "O ┌┬──┘   O",
        "OO├┘ O   OO",
        "──┘O   O  O",
        "O  O   O  O",
        "OOOOOOOOOOO"
      ],
      "31": [
        "OOOOOOOOOOOOO",
        "─┬┐  OOOOOOOO",
        "O├┤  OOOOOOOO",
        "O├┤  OOOOOOOO",
        "O├┴┬┬┬┬┬┐   O",
        "O└┬┴┴┴┘└┴┐  O",
        "O ∪     ┌┤  O",
        "OOOOOOOO├┤  O",
        "OOOOOOOO├┤┌┐O",
        "OOOOOOOO└┴┘└─",
        "OOOOOOOOOOOOO"
      ],
      "31a": [
        "OOOOOOOOOOOOO",
        "─┐   OOOOOOOO",
        "O├┐  OOOOOOOO",
        "O└┤  OOOOOOOO",
        "O └┬┬┬┬┐    O",
        "O  └┴┴┴┴┬┐  O",
        "O       ├┤  O",
        "OOOOOOOO├┤  O",
        "OOOOOOOO└┤┌┐O",
        "OOOOOOOO └┘└─",
        "OOOOOOOOOOOOO"
      ],
      "32": [
        "OOOOOOOOOOOOOO",
        "O ┌───┬┬───┐ O",
        "O ├───┴┴───┤ O",
        "O |OOOOOOOO| O",
        "──┤┌┐┌┐┌┐┌┐├┐O",
        "O ├┘└┘└┘└┘└┤└─",
        "O |OOOOOOOO| O",
        "O ├┬┬┬┬┬┬┬┬┤ O",
        "O └┴┴┴┴┴┴┴┴┘ O",
        "OOOOOOOOOOOOOO"
      ],
      "32a": [
        "OOOOOOOOOOOOOO",
        "O  ─ ─  ─ ─  O",
        "O  ─ ─  ─ ─  O",
        "O┌┐OOOOOOOO  O",
        "─┤|┌┐┌┐┌┐┌┐┌┐O",
        "O└┴┘└┘└┘└┘└┤├─",
        "O  OOOOOOOO└┘O",
        "O   ┬ ┬ ┬ ┬  O",
        "O  ┴ ┴ ┴ ┴   O",
        "OOOOOOOOOOOOOO"
      ],
      "33": [
        "OOO|OOO",
        "O ┌┴┐ O",
        "O |O| O",
        "O┌┤ ├┐O",
        "O├┤O├┤O",
        "O└┤O├┘O",
        "O | | O",
        "O |O| O",
        "O └┬┘ O",
        "OOO|OOO"
      ],
      "33a": [
        "OOO|OOO",
        "O  └┐ O",
        "O  O| O",
        "O   | O",
        "O ┤O├┐O",
        "O ┤O├┘O",
        "O   | O",
        "O  O| O",
        "O  ┌┘ O",
        "OOO|OOO"
      ],
      "34": [
        "OOOOOOOOOOO",
        "O         O",
        "O  OOOOO  O",
        "O O     O O",
        "O O  O  O O",
        "─┬───────┬─",
        "O|O O O O|O",
        "O|O   O O|O",
        "O└┐OOO  O|O",
        "O └──────┘O",
        "OOOOOOOOOOO"
      ],
      "34a": [
        "OOOOOOOOOOO",
        "O         O",
        "O  OOOOO  O",
        "O O     O O",
        "O O  O  O O",
        "───────────",
        "O O O O O O",
        "O O   O O O",
        "O  OOO  O O",
        "O         O",
        "OOOOOOOOOOO"
      ],
      "35": [
        "OOOOOOOOOOOOOO",
        "OO   O   O   O",
        "O O   O  ∩O  O",
        "O  O┌─┐O┌┴┐O O",
        "─┬┬─┤ ├─┤┌┴─┬─",
        "O└┘O├┬┘O├┤ O∪O",
        "O O └┘O └┘O  O",
        "OO   O   O   O",
        "OOOOOOOOOOOOOO"
      ],
      "35a": [
        "OOOOOOOOOOOOOO",
        "OO   O   O   O",
        "O O   O   O  O",
        "O┌┐O∩  O   O O",
        "─┘└─┴┬──┬─────",
        "O  O ∪ O∪  O O",
        "O O   O   O  O",
        "OO   O   O   O",
        "OOOOOOOOOOOOOO"
      ],
      "36": [
        "OOOOOOOOOOO",
        "OOOOOOOOOOO",
        "OOO     OOO",
        "OO┌┐   ┌┐OO",
        "OO├┼───┼┤OO",
        "──┘|OOO|└──",
        "OO┌┼───┼┐OO",
        "OO└┴───┴┘OO",
        "OOO     OOO",
        "OOOOOOOOOOO",
        "OOOOOOOOOOO"
      ],
      "36a": [
        "OOOOOOOOOOO",
        "OOOOOOOOOOO",
        "OOO     OOO",
        "OO┌┐   ┌┐OO",
        "OO├┼───┼┤OO",
        "──┤|OOO|└──",
        "OO├┼───┼┐OO",
        "OO└┘   └┘OO",
        "OOO     OOO",
        "OOOOOOOOOOO",
        "OOOOOOOOOOO"
      ],
      "37": [
        "OOOOOOOOOOO",
        "OO       OO",
        "O   ┌┐    O",
        "O  O└┼┐O  O",
        "O ┌┐┌┘└┐┌┐O",
        "─┐└┼┘O┌┼┘└─",
        "O└┐└┐┌┘└┐ O",
        "O┌┘O└┼┐O└┐O",
        "O└─┐┌┘└┐┌┘O",
        "OO └┘  └┘OO",
        "OOOOOOOOOOO"
      ],
      "37a": [
        "OOOOOOOOOOO",
        "OO       OO",
        "O    ┌┐   O",
        "O  O┌┼┘O  O",
        "O  ┌┘└┐┌┐ O",
        "─┐┌┼┐O└┼┘┌─",
        "O└┘└┘  └┐|O",
        "O  O ┼ O└┘O",
        "O         O",
        "OO       OO",
        "OOOOOOOOOOO"
      ],
      "38": [
        "OOOOOOOOO",
        "O       O",
        "O ┌─┐O  O",
        "O┌┘┌┴┐O┌─",
        "O|O├┬┤O|O",
        "─┘O└┤├┬┘O",
        "O  O└┴┘ O",
        "O       O",
        "OOOOOOOOO"
      ],
      "38a": [
        "OOOOOOOOO",
        "O       O",
        "O ┌  O  O",
        "O     O┌─",
        "O O├ ┤O|O",
        "─┐O    |O",
        "O| O  ┘|O",
        "O└─────┘O",
        "OOOOOOOOO"
      ],
      "39": [
        "OO|OO",
        "O └┐O",
        "O O|O",
        "O┌┐|O",
        "O├┼┤O",
        "O|└┘O",
        "O|O O",
        "O└┐ O",
        "OO|OO"
      ],
      "40": [
        "OOO|OOOOOOOOO",
        "O ┌┴┐ O ┌─┐ O",
        "O | ├───┤ | O",
        "O | | O └┬┘ O",
        "O └─┘ O  |  O",
        "OOOOOOOOO|OOO",
        "O ┌┬┐ O┌─┘  O",
        "O └┼┘ O└┬┬┬┐O",
        "O ┌┤┌──┐||||O",
        "O └┼┘ O└┴┴┴┘O",
        "OOO|OOOOOOOOO"
      ],
      "40a": [
        "OOO|OOOOOOOOO",
        "O  └─┐O ┌ ┐ O",
        "O    └─┐    O",
        "O | | O|└ ┘ O",
        "O     O└─┐  O",
        "OOOOOOOOO|OOO",
        "O     O┌─┘  O",
        "O  ┼  O|┬ ┬ O",
        "O ┌┐┌──┘    O",
        "O └┼┘ O ┴ ┴ O",
        "OOO|OOOOOOOOO"
      ],
      "41": [
        "OO|OOOOOOOO",
        "O └┐OOOOOOO",
        "OO └┐OOOO O",
        "OOO └┐OO  O",
        "OOOO ├┐   O",
        "OOOOO├┤  OO",
        "OOOOO├┘ OOO",
        "OOOO┌┘ OOOO",
        "OOO┌┘ OOOOO",
        "OO┌┘ OOOOOO",
        "OO|OOOOOOOO"
      ],
      "42": [
        "OOOO|OO",
        "Oc─┬┤ O",
        "O  |∪ O",
        "O ─|─ O",
        "O  |  O",
        "O ─|─ O",
        "O  |  O",
        "Oc┬┴─ↄO",
        "OO|OOOO"
      ],
      "43": [
        "OOOOOOOOOOO",
        "O┌┐O┌┬┐O┌┐O",
        "O└┼┐└┼┘┌┼┘O",
        "OO└┼┐|┌┼┘OO",
        "O  └┼┼┼┘  O",
        "────┼┼┼────",
        "O  ┌┼┼┼┐  O",
        "OO┌┼┘|└┼┐OO",
        "O┌┼┘┌┼┐└┼┐O",
        "O└┘O└┴┘O└┘O",
        "OOOOOOOOOOO"
      ],
      "43a": [
        "OOOOOOOOOOO",
        "O  O┌┬┐O  O",
        "O ┼ └┼┘ ┼ O",
        "OO ┼┌┼┐┼ OO",
        "O  ┌┼┼┼┐  O",
        "───┼┼┼┼┼───",
        "O  └┼┼┼┘  O",
        "OO ┼└┼┘┼ OO",
        "O ┼ ┌┼┐ ┼ O",
        "O  O└┴┘O  O",
        "OOOOOOOOOOO"
      ],
      "44": [
        "OOOOOO||OOOOOO",
        "O ┌┬┬─┘└─┬┬┐ O",
        "O ├┼┤ OO ├┼┤ O",
        "O ||| OO |├┘ O",
        "O ├┼┘ OO └┼┐ O",
        "O ||  OO  || O",
        "O ├┼┐ OO ┌┼┘ O",
        "O └┴┴────┴┘  O",
        "OOOOOOOOOOOOOO"
      ],
      "44a": [
        "OOOOOO||OOOOOO",
        "O    ┌┘└┐    O",
        "O  ┼ |OO| ┼  O",
        "O    |OO|    O",
        "O  ┼ |OO| ┼  O",
        "O    |OO|    O",
        "O  ┼ |OO| ┼  O",
        "O    └──┘    O",
        "OOOOOOOOOOOOOO"
      ],
      "45": [
        "OOOO",
        "─┐ O",
        "O| O",
        "O├┐O",
        "O||O",
        "O├┤O",
        "O||O",
        "O└┤O",
        "O |O",
        "O └─",
        "OOOO"
      ],
      "46": [
        "OOOOOOOOOOOO",
        "O          O",
        "O    ┌┐    O",
        "─────┘└─────",
        "O          O",
        "O          O",
        "OOOOOOOOOOOO"
      ],
      "47": [
        "OOOOOOOOOOO",
        "─┬┐ ∩ ∩ ∩┌─",
        "O|├┐├─┴─┤|O",
        "O├┴┤├┬┬┬┴┤O",
        "O|┬├┴┴┴┘┴∪O",
        "O├ↄ├┬┬┐├ ┤O",
        "O|┴├┤├┤ ┴ O",
        "O├┬┤└┴┘├ ┤O",
        "O└┴┘┴ ┴ ┴ O",
        "OOOOOOOOOOO"
      ],
      "47a": [
        "OOOOOOOOOOO",
        "─┐       ┌─",
        "O|├ ├ ┴ ┤|O",
        "O├ↄ┤∩┬∩┬┌┤O",
        "O└┬─┴─┴─┴┘O",
        "O├∪├ ┬ ├ ┤O",
        "O ┴ ┤ ┤ ┴ O",
        "O├ ┤ ┴ ├ ┤O",
        "O ┴ ┴ ┴ ┴┐O",
        "OOOOOOOOOOO"
      ],
      "48": [
        "OOOOOOOOO",
        "O   O   O",
        "O O c┐O O",
        "O┌┐O┌┴┐ O",
        "─┤├┬┘O├┬─",
        "O└┴┘O └┘O",
        "O O   O O",
        "O    O  O",
        "OOOOOOOOO"
      ],
      "48a": [
        "OOOOOOOOO",
        "O   O   O",
        "O O c┐O O",
        "O┌┐O┌┴┐ O",
        "─┤├┬┘O├┬─",
        "O└┘∪O └┘O",
        "O O   O O",
        "O    O  O",
        "OOOOOOOOO"
      ],
      "49": [
        "OOOOO|OOOOO",
        "O   c┴┬ↄ  O",
        "O    c┴┬ↄ O",
        "O     ┌┘  O",
        "O    ┌┘   O",
        "O   ┌┘    O",
        "O c┬┘     O",
        "O ┌┘ ∩    O",
        "Oc┴┬┬┘    O",
        "O c┴┴┬ↄ   O",
        "OOOOO|OOOOO"
      ],
      "50": [
        "OOOOOOOOOOOOO",
        "─┬┬─┐       O",
        "O├┘O└ↄ  ┘O└ O",
        "O|OOO   OOO O",
        "O├┐O┌ↄ  ┐O┌ O",
        "O|└┬┘       O",
        "O├ↄ∪       ∩O",
        "O|┌─┐∩∩∩∩ ┌┤O",
        "O├┘O└┴┴┴┘O└┤O",
        "O|OOO∩ ∩OOO|O",
        "O└┐O┌┴┬┴┐O┌┤O",
        "O └─┘ ∪ └─┴┴─",
        "OOOOOOOOOOOOO"
      ]
    };
  
		const imgToChar = {
        'pc0': ' ', // space
        'pc1': 'O', // wall
        'pc2': '|', 'source-n': '|', 'source-s': '|', 'drain-n': '|', 'drain-s': '|', // two-way (vertical)
        'pc3': '─', 'source-e': '─', 'source-w': '─', 'drain-e': '─', 'drain-w': '─', // two-way (horizonal)
        'pc4': '├', 'pc5': '┤', 'pc6': '┴', 'pc7': '┬', // three-way
        'pc8': '┼', // four-way
        'pc9': '∪', 'pca': '∩', 'pcb': 'c', 'pcc': 'ↄ', // cap to block ends
        'pcd': '└', 'pce': '┘', 'pcf': '┌', 'pcg': '┐', // two-way (angle)
        'cor-nw': 'O', 'cor-ne': 'O', 'cor-sw': 'O', 'cor-se': 'O', // wall
        'side-n': 'O', 'side-e': 'O', 'side-s': 'O', 'side-w': 'O' // wall
    };

    const toChar = (src) => {
        const match = src?.match(/\/([a-z0-9-]+)\.gif$/);
        return match ? (imgToChar[match[1]] || '?') : '?';
    };

    function getNextPipe() {
        const nextImg = Array.from(document.querySelectorAll('img[src*="next.gif"]'))[0];
        if (!nextImg) return null;

        const td = nextImg.closest('td');
        const table = td?.closest('table');
        if (!table) return null;

        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length < 2) return null;

        const pipeImg = rows[1].querySelectorAll('td')[1]?.querySelector('img');
        return pipeImg ? toChar(pipeImg.src) : null;
    }

    function getNextPipes() {
      const nextImg = Array.from(document.querySelectorAll('img[src*="next.gif"]'))[0];
      if (!nextImg) return [];

      const td = nextImg.closest('td');
      const table = td?.closest('table');
      if (!table) return [];

      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 2) return [];

      const pipeRow = rows[1];
      const pipeTds = Array.from(pipeRow.querySelectorAll('td'));

      const pipeChars = [];
      // td indexes 1, 3, 5 are actual pipes
      for (let i of [1, 3, 5]) {
          const pipeImg = pipeTds[i]?.querySelector('img');
          if (pipeImg) {
              pipeChars.push(toChar(pipeImg.src));
          }
      }

      return pipeChars;
  	}
  
    function getLevelGrid() {
        const table = Array.from(document.querySelectorAll('table')).find(t => t.bgColor === '#555555');
        if (!table) return [];

        const grid = [];
        const rows = Array.from(table.querySelectorAll('tr'));

        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td'));
            let rowStr = "";

            for (const cell of cells) {
                const img = cell.querySelector('img[src*="/sewage/"]');
                if (!img) continue;

                rowStr += toChar(img.src);
            }

            if (rowStr.trim().length > 0) grid.push(rowStr);
        }

        return grid;
    }

    function getCurrentLevel() {
        const levelText = document.body.innerText.match(/Level: (\d+)/i);
        return levelText ? parseInt(levelText[1], 10) : null;
    }

    function getDiscardsLeft() {
        // Find all <b> tags on the page
        const bTags = document.querySelectorAll('b');
        for (const bTag of bTags) {
            // Check if the parent <td> of this <b> tag contains "discards" and "left"
            const parentTd = bTag.closest('td');
            if (parentTd && parentTd.innerText.includes('discards') && parentTd.innerText.includes('left')) {
                const discardsValue = bTag.innerText.trim();
                if (!isNaN(parseInt(discardsValue, 10))) { // Ensure it's a valid number
                    return parseInt(discardsValue, 10);
                }
            }
        }
        console.warn("Could not find discards left element or value.");
        return NaN;
    }

    function isGridFull(grid) {
        // We need to check only the *playable* area, not the border 'O' cells.
        // The playable grid is typically rows 1 to (grid.length - 2) and columns 1 to (grid[r].length - 2).
        for (let r = 1; r < grid.length - 1; r++) {
            for (let c = 1; c < grid[r].length - 1; c++) {
                if (grid[r][c] === ' ') {
                    return false;
                }
            }
        }
        return true;
    }


    function doesGridMatchSolution(currentGrid, solutionGrid) {
        if (!solutionGrid || currentGrid.length !== solutionGrid.length) {
            return false;
        }

        for (let r = 0; r < currentGrid.length; r++) {
            if (currentGrid[r].length !== solutionGrid[r].length) {
                return false;
            }
            for (let c = 0; c < currentGrid[r].length; c++) {
                // Ignore blank tiles in the solution for matching purposes
                if (solutionGrid[r][c] !== ' ' && currentGrid[r][c] !== solutionGrid[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }

    function checkAndProceedIfWon() {
        const winButton = document.querySelector('a[href*="proceed=1"] img[src*="win.gif"]');
        if (winButton) {
            console.log("Neopets Sewage Solver: 'Win' button detected. Clicking to proceed to next level.");
            winButton.closest('a').click();
            return true; // Indicates button was found and clicked
        }
        return false; // Indicates button was not found
    }

  	function autoplay() {
        if (!DEBUG_MODE) {
            const delay = Math.random() * (AUTOPLAY_DELAY_MAX_MS - AUTOPLAY_DELAY_MIN_MS) + AUTOPLAY_DELAY_MIN_MS;
            autoplayTimer = setTimeout(performAction, delay);
        }
    }
  
    function performAction() {
        console.log("Performing action...");

        // ALWAYS check for the win button first
        if (checkAndProceedIfWon()) {
            return; // If we clicked the win button, no further action needed
        }

        const nextPipes = getNextPipes();
        const currentGrid = getLevelGrid();
        const currentLevel = getCurrentLevel();
        const discardsLeft = getDiscardsLeft();
        let solutionGrid = PATH ? sewageSolutions[currentLevel] : sewageSolutions[currentLevel + 'a'];

      	// Some avatar paths are the same as the high score path, so default to the high score path
      	if (!solutionGrid) solutionGrid = sewageSolutions[currentLevel];
      
        // Additional safety check for missing solution or invalid level
        if (!solutionGrid) {
            console.error(`No solution defined for Level: ${currentLevel}. Stopping.`);
            return;
        }
        if (isNaN(discardsLeft)) {
            console.error("Could not determine discards left. Script might not behave as expected.");
        }

        // If grid matches solution (ignoring the blank tiles in the solution), press start flow
        if (doesGridMatchSolution(currentGrid, solutionGrid)) {
            console.log("Grid matches solution. Pressing Start Flow.");
            document.querySelector('a[href*="startflow=1"]').click();
            return;
        }

        // Try to place the pipe
        let placed = false;
        if (nextPipes[0]) {
            // First Priority: Place if nextPipes[0] directly matches a blank spot in the SOLUTION
            // (original logic from your v1.0, adjusted slightly for clarity)
            for (let r = 1; r < currentGrid.length - 1; r++) {
                for (let c = 1; c < currentGrid[r].length - 1; c++) {
                    const currentCellChar = currentGrid[r][c];
                    const solutionCellChar = solutionGrid[r] ? solutionGrid[r][c] : null;

                    if (currentCellChar === ' ') { // Only consider placing if the game cell is currently blank
                        if (solutionCellChar === nextPipes[0]) { // AND the solution indicates this specific pipe
                            const cellToClick = document.querySelector(`a[href*="move=1&play_row=${r - 1}&play_col=${c - 1}"] img[src*="pc0.gif"]`);
                            if (cellToClick) {
                                console.log(`Placing pipe '${nextPipes[0]}' at (${r - 1}, ${c - 1}) based on solution match.`);
                                cellToClick.closest('a').click();
                                placed = true;
                                break;
                            }
                        }
                    }
                }
                if (placed) break;
            }

            // If not placed AND discards are 0,
            // place the nextPipes[0] into any BLANK spot in the game grid
            // that is ALSO a BLANK spot in the SOLUTION grid.
            if (!placed && discardsLeft === 0) {
                console.log("Neopets Sewage Solver: 0 discards left. Attempting to place pipe in a solution-blank spot.");
                for (let r = 1; r < currentGrid.length - 1; r++) {
                    for (let c = 1; c < currentGrid[r].length - 1; c++) {
                        const currentCellChar = currentGrid[r][c];
                        const solutionCellChar = solutionGrid[r] ? solutionGrid[r][c] : null;

                        // Check if the current game cell is blank AND the solution expects a blank there
                        if (currentCellChar === ' ' && solutionCellChar === ' ') {
                            const cellToClick = document.querySelector(`a[href*="move=1&play_row=${r - 1}&play_col=${c - 1}"] img[src*="pc0.gif"]`);
                            if (cellToClick) {
                                console.log(`Placing pipe '${nextPipes[0]}' at (${r - 1}, ${c - 1}) into a blank solution spot.`);
                                cellToClick.closest('a').click();
                                placed = true;
                                break;
                            }
                        }
                    }
                    if (placed) break;
                }
            }
        }

        // Action if pipe wasn't placed:
        // If we still have discards, discard the pipe.
        if (!placed && discardsLeft > 0) {
            console.log("Pipe doesn't belong or no optimal placement found. Discarding pipe.");
            document.querySelector('a[href*="discard=1"]').click();
        }
        // Restart level when no useful action can be taken
        else if (!placed && discardsLeft === 0) {
          	// Ceci n'est pas une pipe?
            if (isGridFull(currentGrid)) {
                console.log("Grid is full, no discards left, and pipe could not be placed.");
                window.location.href = "https://www.neopets.com/games/sewage/sewage.phtml?restart=1";
                return;
              
            } else {
                console.log("No discards left and no valid placement found for the current pipe.");
              	window.location.href = "https://www.neopets.com/games/sewage/sewage.phtml?restart=1";
                return;
            }
        }
    }

  	if (DEBUG_MODE) {
      document.addEventListener('keydown', (e) => {
          if (e.key === 'a' || e.key === 'A') {
              e.preventDefault();
              performAction();
          }
      });
    }

    // Logging
    if (!checkAndProceedIfWon()) { // If we didn't proceed, then log initial state
        const nextPipes = getNextPipes();
        const initialGrid = getLevelGrid();
        const initialLevel = getCurrentLevel();
        const initialDiscards = getDiscardsLeft();

        console.log(`Current pipe to place: ${nextPipes[0]}`);
      	console.log(`Next two pipes: ${nextPipes[1]} and ${nextPipes[2]}`);
        console.log(`Level: ${initialLevel}`);
        console.log(`Current Level Grid:\n${initialGrid.join('\n')}`);
        console.log(`Solution Grid:\n${sewageSolutions[initialLevel]?.join('\n') || 'Not available'}`);
        console.log(`Discards left: ${initialDiscards}`);

      	if (!DEBUG_MODE) {
            autoplay();
        }
    }
})();
