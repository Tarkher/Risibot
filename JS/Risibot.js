// ==UserScript==
// @name         Risibot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Risitop
// @match        http://play.pokemonshowdown.com/*
// @grant        none
// ==/UserScript==

function Risibot() { // Room <-> Bot <-> AI

  this.room = getRoom();
  this.currentTurn = 0;

  this.movesParsed = false;
  this.parsingMoves = false;
  this.moves = undefined;
  this.buttonsMove = undefined;
  this.lastMove = 0;

  this.ennemyParsed = false;
  this.ennemy = undefined;

  this.pokemonParsed = false;
  this.pokemon = undefined;

  this.havePlayed = false;

  this.AI = new PokeyI(this);

  console.log("Risibot: Risibot initialized.");
};

Risibot.prototype.choseMove = function() {
  movesInterests = [0, 0, 0, 0];
  for (var moveType in this.moves) {
    for (var j = 0; j < this.moves[moveType].length; j++) {
      move = this.moves[moveType][j][0];
      k = this.moves[moveType][j][1];
      switch (moveType) {
        case 'physical':
        case 'physicalS':
        case 'special':
        case 'specialS':
          movesInterests[k - 1] = this.AI.evalDamagingMove(move);
          break;
        case 'status':
          movesInterests[k - 1] = this.AI.evalStatus(move);
          break;
        case 'traps':
          movesInterests[k - 1] = this.AI.evalTraps(move);
          break;
        case 'heal':
          movesInterests[k - 1] = this.AI.evalHeal(move);
          break;
        case 'spin':
          movesInterests[k - 1] = this.AI.evalsSpin(move);
          break;
      }
      console.log("Risibot: choseMove: Move " + move.name + ".");
    }
  }
  console.log("Risibot: choseMove: " + movesInterests);
  choice = getMaxIndex(movesInterests);
	
	if (moveInterests[choice] < 100) {
		pos = this.safeSwitch();
		if (pos >= 0)
			choice = -1;
	}
	
  return choice;
};

// Gets a formatted moves object
Risibot.prototype.parseMoves = function() {
  this.movesParsed = false;
  this.moves = {
    'traps': [], // Entry hazards
    'status': [], // Thunder wave
    'special': [], // Hydro pump
    'physical': [], // Earthquake
    'boost': [], // Swords dance
    'specialS': [], // Scald
    'physicalS': [], // Dynamic punch
    'specialB': [], // Power up punch
    'physicalB': [], // ?
    'protect': [],
    'seeds': [],
    'defog': [],
    'spin': [],
    'taunt': [],
    'heal': [],
    'cure': [],
    'roar': [],
    'uTurn': [],
    'voltSwitch': [],
    'trick': [],
    'fakeOut': []
  };

  movesTab = [];
  this.buttonsMoves = document.getElementsByName("chooseMove");
  if (this.buttonsMoves.length == 0) {
    console.log("Risibot: parseMoves: " + this.buttonsMoves.length + " moves parsed. Retrying...");
    that = this;
    this.parsingMoves = true;
    setTimeout(function() {
      that.parseMoves();
    }, 1000);
    return;
  }

  for (var i = 0; i < this.buttonsMoves.length; i++) {
    movesTab.push(Tools.getMove(this.buttonsMoves[i].attributes['data-move'].nodeValue));
  }

  for (i = 0; i < movesTab.length; i++) {
    m = movesTab[i];
    k = parseInt(this.buttonsMoves[i].value);

    // Particular moves
    if (m.id == 'leechseed')
      this.moves.seeds.push([m, k]);
    else if (m.id == 'rapidspin')
      this.moves.spin.push([m, k]);
    else if (m.id == 'defog')
      this.moves.defog.push([m, k]);
    else if (m.id == 'taunt')
      this.moves.taunt.push([m, k]);
    else if (m.priority == -6)
      this.moves.roar.push([m, k]);
    else if (m.heal)
      this.moves.heal.push([m, k]);
    else if (m.target == 'allyTeam')
      this.moves.cure.push([m, k]);
    else if (m.selfSwitch)
      if (m.baseType == 'bug')
        this.moves.uTurn.push([m, k]);
      else
        this.moves.voltSwitch.push([m, k]);
    else if (m.id == 'trick' || m.id == 'switcheroo')
      this.moves.trick.push([m, k]);
    else if (m.id == 'fakeout')
      this.moves.fakeOut.push([m, k]);

    else if (m.category == 'Status') {
      if (m.target == 'foeSide')
        this.moves.traps.push([m, k]);
      else if (m.status)
        this.moves.status.push([m, k]);
      else if (m.target == 'self')
        if (m.volatileStatus == 'protect')
          this.moves.protect.push([m, k]);
        else
          this.moves.boost.push([m, k]);
    } else if (m.category == 'Special') {
      if (m.secondaries)
        if (m.boosts)
          this.moves.specialB.push([m, k]);
        else
          this.moves.specialS.push([m, k]);
      else
        this.moves.special.push([m, k]);
    } else if (m.category == 'Physical') {
      if (m.secondaries)
        if (m.boosts)
          this.moves.physicalB.push([m, k]);
        else
          this.moves.physicalS.push([m, k]);
      else
        this.moves.physical.push([m, k]);
    }
  }

  console.log("Risibot: parseMoves: " + this.buttonsMoves.length + " moves parsed.");
  this.movesParsed = true;
};

Risibot.prototype.getPokemon = function() {
  this.pokemon = undefined;
  pokemonPerso = undefined;
  for (i = 0; i < this.room.myPokemon.length; i++) {
    if (this.room.myPokemon[i].active)
      pokemonPerso = this.room.myPokemon[i];
  }
  pokemonGeneral = this.room.battle.mySide.active[0];
  if (pokemonPerso && pokemonGeneral) {
    this.pokemonParsed = true;
    this.pokemon = new FullPokemon(pokemonPerso, pokemonGeneral);
    console.log("Risibot: getPokemon: Pokemon parsed.");
  }
};

Risibot.prototype.getEnnemyPokemon = function() {
  this.ennemy = this.room.battle.yourSide.active;
  if (this.ennemy) {
    this.ennemyParsed = true;
    console.log("Risibot: getPokemon: Ennemy pokemon parsed.");
  }
};

Risibot.prototype.waitingForMe = function() {
  if (!this.room)
    return false;
  else if (!this.room.choice)
    return false;
  else if (!this.room.choice.waiting)
    return true;
  return false;
};

Risibot.prototype.attack = function(id) {

  if (!this.buttonsMoves[0])
    return;

  console.log("Risibot: attack: Trying to execute move " + id + ".");

  var k = 0;
  while (parseInt(this.buttonsMoves[k].value) != id)
    k++;
  this.room.chooseMove(id, this.buttonsMoves[k]);
  return true;
};

Risibot.prototype.routine = function() {

  if (this.currentTurn < this.room.battle.turn) {
    this.movesParsed = false;
    this.parsingMoves = false;
    this.getEnnemyPokemon();
    this.getPokemon();
    this.currentTurn = this.room.battle.turn;
  }

  if (!this.movesParsed && !this.parsingMoves) {
    this.parseMoves();
  }

  if (this.waitingForMe()) {
    if (this.pokemon && this.room.battle.mySide.active && !this.pokemon.fainted && this.movesParsed) {
      m = this.choseMove();
			if (m != -1) // If swiching is not a better choice
				this.attack(m + 1);
    } else { //Chose another pokemon
      placeholder = 1;
    }
  }

  that = this;
  setTimeout(function() {
    that.routine();
  }, 500);
};

Risibot.prototype.safeSwitch = function() {
	
	pokemonIndex = -1;
	maxPower = 0;
	for (i = 0; i < this.room.myPokemon.length; i++) {
		pkm = new FullPokemon(this.room.myPokemon[i], this.room.battle.mySide.pokemon[i])
		newPower = this.AI.evalSwitch(pkm);
		if (newPower > maxPower) {
			maxPower = newPower;
			pokemonIndex = pokemonIndex;
		}
	}
	return (pokemonIndex == 0) ? -1 : pokemonIndex;
}

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