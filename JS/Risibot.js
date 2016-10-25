// ==UserScript==
// @name         Risibot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Risitop
// @match        http://play.pokemonshowdown.com/*
// @grant        none
// ==/UserScript==

getRoom = function() {
  url = window.location.href;
  while (url[0] != 'b') {
      url = url.slice(1);
  }
  return app.rooms[url];
};

getMaxIndex = function(tab) {
	iM = 0;
	for (i = 1; i < tab.length; i++) {
		if (tab[i] > tab[iM])
			iM = i;
	}
	return iM;
};

///////////////////////////////////////////////////////////////////////////////

function Risibot() {
    
	this.room = getRoom();
    
    this.movesParsed = false;
	this.moves = undefined;
    this.buttonsMove = undefined;
    this.lastMove = 3;
	
	this.ennemyParsed = false;
	this.ennemy = undefined;
	
	this.pokemonParsed = false;
	this.pokemon = undefined;
	
	this.havePlayed = false;
	
	this.stealthSet = false;
	this.spikesLayers = 0;
	this.stickySet = false;
	
	this.context = {
		'stealth_a': false,
		'spikes_a': 0,
		'sticky_a': false,
		
		'stealth_e': false,
		'spikes_e': 0,
		'sticky_e': false
	};
	
	this.AI = new PokeyI(this);
};

Risibot.prototype.choseMove = function() {
	movesInterests = [0, 0, 0, 0];
	for (var moveType in this.moves) {
        for (var j=0; j < this.moves[moveType].length; j++) {
            move = this.moves[moveType][j][0];
            k = this.moves[moveType][j][1];
            console.log(j + " " + k + " " + this.moves[moveType].length);
            switch (moveType) {
                case 'physical':
                    movesInterests[k - 1] = this.AI.evalP(move);
                    break;
                case 'special':
                    movesInterests[k - 1] = this.AI.evalS(move);
                    break;
                case 'specialS':
                    movesInterests[k - 1] = this.AI.evalSS(move);
                    break;
            }
		}
	}
    console.log(movesInterests);
	return getMaxIndex(movesInterests);
};

// Gets a formatted moves object
Risibot.prototype.parseMoves = function() {
	movesTab = [];
	this.buttonsMoves = document.getElementsByName("chooseMove");
    if (this.buttonsMoves.length == 0)
        return undefined;
    
	for (var i = 0; i < this.buttonsMoves.length; i++) {
		movesTab.push(Tools.getMove(this.buttonsMoves[i].attributes['data-move'].nodeValue));
	}
    
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
	
	for (i = 0; i < movesTab.length; i++) {
		m = movesTab[i];
        k = parseInt(this.buttonsMoves[i].value);
		
		// Particular moves
		if (m.id == 'leechseed')
			this.moves.seeds.push( [m, k] );
		else if (m.id == 'rapidspin')
			this.moves.spin.push( [m, k] );
		else if (m.id == 'defog')
			this.moves.defog.push( [m, k] );
		else if (m.id == 'taunt')
			this.moves.taunt.push( [m, k] );
        else if (m.priority == -6)
			this.moves.roar.push( [m, k] );
		else if (m.heal)
			this.moves.heal.push( [m, k] );
		else if (m.target == 'allyTeam')
			this.moves.cure.push( [m, k] );
		else if (m.selfSwitch)
			if (m.baseType == 'bug')
				this.moves.uTurn.push( [m, k] );
			else
				this.moves.voltSwitch.push( [m, k] );
		else if (m.id == 'trick' || m.id == 'switcheroo')
			this.moves.trick.push( [m, k] );
		else if (m.id == 'fakeout')
			this.moves.fakeOut.push( [m, k] );
		
		else if (m.category == 'Status')	{
			if (m.target == 'foeSide')
				this.moves.traps.push( [m, k] );
			else if (m.status)
				this.moves.status.push( [m, k] );
			else if (m.target == 'self')
				if (m.volatileStatus == 'protect')
					this.moves.protect.push( [m, k] );
				else
					this.moves.boost.push( [m, k] );
		}	else if (m.category == 'Special') {
			if (m.secondaries)
				if (m.boosts)
					this.moves.specialB.push( [m, k] );
				else
					this.moves.specialS.push( [m, k] );
			else
				this.moves.special.push( [m, k] );
		}		else if (m.category == 'Physical') {
			if (m.secondaries)
				if (m.boosts)
					this.moves.physicalB.push( [m, k] );
				else
					this.moves.physicalS.push( [m, k] );
			else
				this.moves.physical.push( [m, k] );
		}
	}
    
    this.movesParsed = true;
};

Risibot.prototype.getPokemon = function() {
	this.pokemon = this.room.battle.mySide.active;
	if (this.pokemon)
		this.pokemonParsed = true;
};

Risibot.prototype.getEnnemyPokemon = function() {
	this.ennemy = this.room.battle.yourSide.active;
	if (this.ennemy)
		this.ennemyParsed = true;
};

Risibot.prototype.waitingForMe = function(){
	if (!this.room)
		return false;
	else if (!this.room.choice)
		return false;
	else if (!this.room.choice.waiting)
		return true;
	return false;
};

Risibot.prototype.attack = function(id) {
    try {
        this.room.chooseMove(id, this.buttonsMoves[id - 1]);
    } catch (TypeError) {
        this.room.chooseMove(this.lastMove, this.buttonsMoves[this.lastMove - 1]);
        return false;
    }
    return true;
};

Risibot.prototype.routine = function() {
    
    if (!this.movesParsed) {
        this.parseMoves();
    }
	if (!this.ennemyParsed)
        this.getEnnemyPokemon();
    if (!this.pokemonParsed)
        this.getPokemon();

	if (this.waitingForMe()) {
        if (this.pokemon[0]) {
            m = this.choseMove();
            success = this.attack(m + 1);
            if (success) {
                this.lastMove = m;
            }
            this.movesParsed = false;
            this.ennemyParsed = false;
            this.pokemonParsed = false;
        } else { //Chose another 
            placeholder = 1;
        }
	}

    that = this;
	setTimeout( function() { that.routine(); }, 500 );
};

///////////////////////////////////////////////////////////////////////////////

PokeyI = function(bot) {
	
	this.bot = bot;
};

PokeyI.prototype.evalP = function(move) {
	coef = 1.0;
	for (i = 0; i < this.bot.ennemy[0].types.length; i++) {
		t = this.bot.ennemy[0].types[i];
		switch (exports.BattleTypeChart[t]['damageTaken'][move.baseType]) {
			case 1:
				coef *= 2;
				break;
			case 2:
				coef /= 2;
				break;
			case 3:
				coef = 0;
				break;
		}
	}
	for (i = 0; i < this.bot.pokemon[0].types.length; i++) {
		if (this.bot.pokemon[0] && this.bot.pokemon[0].types[i] == move.baseType)
			coef *= 1.5;
	}
	
	return coef * move.basePower * (move.accuracy / 100);
	
};

PokeyI.prototype.evalS = function(move) {
	coef = 1.0;
	for (i = 0; i < this.bot.ennemy[0].types.length; i++) {
		t = this.bot.ennemy[0].types[i];
		switch (exports.BattleTypeChart[t]['damageTaken'][move.baseType]) {
			case 1:
				coef *= 2;
				break;
			case 2:
				coef /= 2;
				break;
			case 3:
				coef = 0;
				break;
		}
	}
	for (i = 0; i < this.bot.pokemon[0].types.length; i++) {
		if (this.bot.pokemon[0] && this.bot.pokemon[0].types[i] == move.baseType)
			coef *= 1.5;
	}
	
	return coef * move.basePower * (move.accuracy / 100);
	
};

PokeyI.prototype.evalSS = function(move) {
	coef = 1.0;
	for (i = 0; i < this.bot.ennemy[0].types.length; i++) {
		t = this.bot.ennemy[0].types[i];
		switch (exports.BattleTypeChart[t]['damageTaken'][move.baseType]) {
			case 1:
				coef *= 2;
				break;
			case 2:
				coef /= 2;
				break;
			case 3:
				coef = 0;
				break;
		}
	}
	for (i = 0; i < this.bot.pokemon[0].types.length; i++) {
		if (this.bot.pokemon[0] && this.bot.pokemon[0].types[i] == move.baseType)
			coef *= 1.5;
	}
	
	return coef * move.basePower * (move.accuracy / 100);
	
};

///////////////////////////////////////////////////////////////////////////////

risibotWatcher = function() {
    if (window.location.href != "http://play.pokemonshowdown.com/") {
        room = getRoom();
        if (room)
        {
            if (room.chatHistory.lines[0] === "La chancla !") {
                risitas = new Risibot();
                risitas.routine(null);
                return;
            }
        }
    }
	setTimeout( risibotWatcher, 500 );
};

risibotWatcher();