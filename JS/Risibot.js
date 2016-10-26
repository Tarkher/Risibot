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
  this.lastMove = 0;
	
	this.ennemyParsed = false;
	this.ennemy = undefined;
	
	this.pokemonParsed = false;
	this.pokemon = undefined;
	
	this.havePlayed = false;
	
	this.AI = new PokeyI(this);
};

Risibot.prototype.choseMove = function() {
	movesInterests = [0, 0, 0, 0];
	for (var moveType in this.moves) {
        for (var j=0; j < this.moves[moveType].length; j++) {
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
										movesInterests[k - 1] = this.AI.evalHeal(move);
										break;
            }
		}
	}
  console.log(movesInterests);
	choice = getMaxIndex(movesInterests);
	return choice;
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

PokeyI.prototype.evalDamagingMove = function(move) {
	
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
    
  if (move.id == "lowkick") {
		wgt = this.bot.ennemy[0].weightkg;
		if (wgt < 10)
			move.basePower = 20;
		else if (wgt < 25)
			move.basePower = 40;
		else if (wgt < 50)
			move.basePower = 60;
		else if (wgt < 100)
			move.basePower = 80;
		else if (wgt < 200)
			move.basePower = 100;
		else
			move.basePower = 120;
	}
    
  if (move.accuracy == true)
      move.accuracy = 100;
		
	volatileEffects = this.getMultiplicator(this.bot.pokemon[0], (move.category == "physical") ? 'atk' : 'spa');
	
	return coef * move.basePower * (move.accuracy / 100) * volatileEffects;
	
};

PokeyI.prototype.evalStatus = function(move) {
	coef = 1.0;
	if (this.bot.ennemy[0].status != "" || 
		(move.status == "par" && this.hasType(this.bot.ennemy[0], "Electric")) ||
		(move.status == "brn" && this.hasType(this.bot.ennemy[0], "Fire")) ||
		(move.baseType == "Grass" && this.hasType(this.bot.ennemy[0], "Grass")) ||
		(move.status == "tox" && this.hasType(this.bot.ennemy[0], "Poison"))) {
			return 0;
	}
	
	switch (move.status) {
		case "par":
			coef *= (this.getStat(this.bot.ennemy[0], "spe") / 100);
		case "brn":
			coef *= (this.getStat(this.bot.ennemy[0], "atk") / 100);
		case "slp":
			coef *= (this.getDanger(this.bot.ennemy[0]) / 60);
		case "tox":
			coef *= (this.getBulk(this.bot.ennemy[0]) / 100);
	}
	
	if (coef < 0.5)
		return 30;
	if (coef < 1)
		return 60;
	if (coef < 1.2)
		return 150;
	return 400;
	
};

PokeyI.prototype.evalTraps = function(move) {
	
	if (this.getDanger(this.bot.ennemy[0]) > 100)
		return 0;
	
	switch (move.id) {
		case "stealthrock":
			if (!this.bot.room.battle.yourSide.sideConditions.stealthrock)
				return 150;
			break;
		case "spikes":
			if (!this.bot.room.battle.yourSide.sideConditions.spikes)
				return 150;
			break;
		case "stickyweb":
			if (!this.bot.room.battle.yourSide.sideConditions.stickyweb)
				return 150;
			break;
	}
	return 0;
};

PokeyI.prototype.evalSpin = function(move) {
    
    if(jQuery.isEmptyObject(this.bot.room.battle.mySide.sideConditions))
            return 0;
    return 150;
};

PokeyI.prototype.evalHeal = function(move) {
	
	hp = this.bot.pokemon[0].hp;
    if (hp < 25)
        return 1500;
    if (hp < 50)
        return 1000;
    if (hp < 60)
        return 500;
    if (hp < 75)
        return 100;
    if (hp < 90)
        return 30;
    return 0;
};

PokeyI.prototype.hasType = function(pokemon, type) {
	for (var i = 0; i < pokemon.types.length; i++) {
		if (pokemon.types[i] == type)
			return true;
	}
	return false;
};

PokeyI.prototype.getStat = function(pokemon, stat) {
	return pokemon.baseStats[stat];
};

PokeyI.prototype.getBulk = function(pokemon) {
	return (this.getStat(pokemon, 'hp')/2 + 
		Math.max(this.getStat(pokemon, 'def'), this.getStat(pokemon, 'spd')) / 2);
};

PokeyI.prototype.getDanger = function(pokemon) {
	return (this.getStat(pokemon, 'spe')/2 + 
		Math.max(this.getStat(pokemon, 'atk'), this.getStat(pokemon, 'spa')) / 2);
};

PokeyI.prototype.getMultiplicator = function(pokemon, stat) {
    console.log(pokemon.boosts[stat]);
	if (pokemon.boosts[stat] > 0)
		return 1.0 + 0.5 * pokemon.boosts[stat];
	else if (pokemon.boosts[stat] < 0)
        switch (pokemon.boosts[stat]) {
            case -1:
                return 0.67;
            case -2:
                return 0.5;
            case -3:
                return 0.4;
            case -4:
                return 0.33;
            case -5:
                return 0.29;
            case -6:
                return 0.25;
        }
    return 1.0;
};
///////////////////////////////////////////////////////////////////////////////

risibotWatcher = function() {
    console.log("Watcher");
    if (window.location.href != "http://play.pokemonshowdown.com/") {
        room = getRoom();
        if (room)
        {
            if (room.chatHistory.lines[room.chatHistory.lines.length - 1] === "La chancla !") {
                risitas = new Risibot();
                risitas.routine(null);
                return;
            }
        }
    }
	setTimeout( risibotWatcher, 500 );
};

risibotWatcher();	