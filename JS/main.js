// ==UserScript==
// @name         Risibot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Risitop
// @match        http://play.pokemonshowdown.com/*
// @require      https://raw.githubusercontent.com/Zarel/Pokemon-Showdown-Client/master/data/learnsets-g6.js
// @require      https://raw.githubusercontent.com/Risitop/Risibot/master/JS/FullPokemon.js
// @require      https://raw.githubusercontent.com/Risitop/Risibot/master/JS/Tools.js
// @require      https://raw.githubusercontent.com/Risitop/Risibot/master/JS/PokeyI.js
// @grant        none
// ==/UserScript==
///////////////////////////////////////////////////////////////////////////////

risibotWatcher = function() {
  console.log("Watcher");
  if (window.location.href != "http://play.pokemonshowdown.com/") {
    room = getRoom();
    if (room) {
      if (room.chatHistory.lines[room.chatHistory.lines.length - 1] === "La chancla !") {
        risitas = new Risibot();
        risitas.routine(null);
        return;
      }
    }
  }
  setTimeout(risibotWatcher, 500);
};

risibotWatcher();