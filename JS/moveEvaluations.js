Risibot.prototype.choseMove = function() {
	if (!this.pokemon || !this.ennemy)
		return -1;
	
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
          movesInterests[k - 1] = this.AI.evalSpin(move);
          break;
        case 'seeds':
          movesInterests[k - 1] = this.AI.evalSeeds(move);
          break;
        case 'defog':
          movesInterests[k - 1] = this.AI.evalDefog(move);
          break;
        case 'roar':
          movesInterests[k - 1] = this.AI.evalRoar(move);
          break;
      }
      console.log("Risibot: choseMove: Move " + move.name + ".");
    }
  }
  console.log("Risibot: choseMove: " + movesInterests);
  choice = getMaxIndex(movesInterests);
  return choice;
};


PokeyI.prototype.evalDamagingMove = function(move) {

  coef = this.getWeaknesses(this.bot.ennemy)[move.baseType]; // Type effectiveness
  for (i = 0; i < this.bot.pokemon.types.length; i++) { // STAB
    if (this.bot.pokemon && this.bot.pokemon.types[i] == move.baseType)
      coef *= 1.5;
  }

  if (move.id == "lowkick") {
    wgt = this.bot.ennemy.weightkg;
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

  if (move.accuracy === true)
    move.accuracy = 100;

  volatileEffects = this.getMultiplicator(this.bot.pokemon, (move.category == "physical") ? 'atk' : 'spa');

  return coef * move.basePower * (move.accuracy / 100) * volatileEffects;

};

PokeyI.prototype.evalStatus = function(move) {
  coef = 1.0;
  if (this.bot.ennemy.status != "" ||
    (move.status == "par" && this.hasType(this.bot.ennemy, "Electric")) ||
    (move.status == "brn" && this.hasType(this.bot.ennemy, "Fire")) ||
    (move.baseType == "Grass" && this.hasType(this.bot.ennemy, "Grass")) ||
    (move.status == "tox" && this.hasType(this.bot.ennemy, "Poison")) ||
     this.hasAbility(this.bot.ennemy, "Magic Bounce")) {
    return 0;
  }

  switch (move.status) {
    case "par":
      coef *= (this.getStat(this.bot.ennemy, "spe") / 100);
      break;
    case "brn":
      coef *= (this.getStat(this.bot.ennemy, "atk") / 100);
      break;
    case "slp":
      coef *= (this.getDanger(this.bot.ennemy, this.bot.pokemon));
      break;
    case "tox":
      coef *= (this.getBulk(this.bot.ennemy) / 100);
  }

  if (coef < 0.5)
    return 30;
  if (coef < 1)
    return 60;
  if (coef < 1.2)
    return 150;
  return 400;

};	

PokeyI.prototype.evalSpin = function(move) {

  if (jQuery.isEmptyObject(this.bot.room.battle.mySide.sideConditions)) {
    console.log("Risibot: evalSpin: There is nothing to spin.");
    return 0;
  }
  return 150;
};

PokeyI.prototype.evalTraps = function(move) {

  if (this.getDanger(this.bot.ennemy, this.bot.pokemon) > 100 || this.hasAbility(this.bot.ennemy, "Magic Bounce"))
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
  console.log("Risibot: evalTraps: Entry hazards are already set.");
  return 0;
};

PokeyI.prototype.evalHeal = function(move) {

  hp = this.bot.pokemon.hp / this.bot.pokemon.hpmax;
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

PokeyI.prototype.evalSeeds = function(move) {

  if (this.bot.ennemy.volatiles.leechseed || this.hasType(this.bot.ennemy, "Grass") || this.hasAbility(this.bot.ennemy, "Magic Bounce"))
    return 0;
  
  var d = this.getDanger(this.bot.ennemy, this.bot.pokemon);
  if (d < 0.3) // Ennemy could switch
    return 100;
  if (d < 0.8) // Ennemy will probably not switch
    return 300;
  if (d < 1.5) // It's crucial to survive
    return 399;
  return 0 // ABORT MISSION
};

PokeyI.prototype.evalDefog = function(move) {
	
	if (!this.bot.room.battle.mySide.sideConditions)
		return 0;
	
	var indic = 0;
	for (var condition in this.bot.room.battle.mySide.sideConditions) {
		var c = this.bot.room.battle.mySide.sideConditions[condition][0];
		switch (c) {
			case 'toxicspikes':
			case 'spikes':
				indic += 1;
				break;
			case 'stickyweb':
			case 'stealthrock':
				indic += 2;
				break;
			case 'reflect':
			case 'safeguard':
			case 'lightscreen':
				indic -= 2;
				break;
		}
	}
	for (var condition in this.bot.room.battle.yourSide.sideConditions) {
		var c = this.bot.room.battle.yourSide.sideConditions[condition][0];
		switch (c) {
			case 'toxicspikes':
			case 'spikes':
				indic -= 1;
				break;
			case 'stickyweb':
			case 'stealthrock':
				indic -= 2;
				break;
			case 'reflect':
			case 'safeguard':
			case 'lightscreen':
				indic += 2;
				break;
		}
	}
	
	if (indic < 0) // Terrain is good for the bot
		return 0;
	else
		return 50 * indic;
};

PokeyI.prototype.evalRoar = function(move) {
	
	if (this.hasAbility(this.bot.ennemy, "Magic Bounce"))
		return 0;
	
	coef = 1.0;
	for (c in this.bot.room.battle.yourSide.sideConditions) {
		switch (this.bot.room.battle.yourSide.sideConditions[c]) {
			case 'stealthrock': // Will damage and destabilize
			case 'spikes':
			case 'toxicspikes':
			case 'reflect': // Will temporize
			case 'lightscreen':
			case 'safeguard':
				coef += 1.0;
		}
	}
	for (b in this.bot.ennemy.boosts) {
		coef += this.bot.ennemy.boosts[b];
	}
	
	coef = Math.max(0.0, coef - this.getDanger(this.bot.ennemy, this.bot.pokemon));
	
	return 70 * coef;
	
};