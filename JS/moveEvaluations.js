Risibot.prototype.choseMove = function() {
	
  if (!this.pokemon || !this.ennemy)
    return -1;
	
  var dmgComputation = this.AI.getMaxDamageTaken(this.pokemon, this.ennemy);
	var dmgTaken = movesInterests[4];
  var movesInterests = dmgComputation.slice(0, 4);
	
  for (var moveType in this.moves) {
    for (var j = 0; j < this.moves[moveType].length; j++) {
      move = this.moves[moveType][j][0];
      k = this.moves[moveType][j][1];
      switch (moveType) {
        case 'status':
          movesInterests[k - 1] = this.AI.evalStatus(move, dmgTaken);
          break;
        case 'traps':
          movesInterests[k - 1] = this.AI.evalTraps(move, dmgTaken);
          break;
        case 'heal':
          movesInterests[k - 1] = this.AI.evalHeal(move, dmgTaken);
          break;
        case 'spin':
          movesInterests[k - 1] = this.AI.evalSpin(move, dmgTaken);
          break;
        case 'seeds':
          movesInterests[k - 1] = this.AI.evalSeeds(move, dmgTaken);
          break;
        case 'defog':
          movesInterests[k - 1] = this.AI.evalDefog(move, dmgTaken);
          break;
        case 'roar':
          movesInterests[k - 1] = this.AI.evalRoar(move, dmgTaken);
          break;
        case 'painSplit':
          movesInterests[k - 1] = this.AI.evalPainSplit(move, dmgTaken);
          break;
      }
      console.log("Risibot: choseMove: Move " + move.name + ".");
    }
  }
  console.log("Risibot: choseMove: " + movesInterests);
  choice = getMaxIndex(movesInterests);
  return choice;
};

PokeyI.prototype.evalStatus = function(move, dmgTaken) { // Is this status move worth it ?

  if (this.bot.ennemy.status != "" ||
    (move.status == "par" && this.hasType(this.bot.ennemy, "Electric")) ||
    (move.status == "brn" && this.hasType(this.bot.ennemy, "Fire")) ||
    (move.baseType == "Grass" && this.hasType(this.bot.ennemy, "Grass")) ||
		(move.baseType == "Electric" && this.hasType(this.bot.ennemy, "Ground")) ||
		(move.baseType == "tox" && this.hasType(this.bot.ennemy, "Steel")) ||
    (move.status == "tox" && this.hasType(this.bot.ennemy, "Poison")) ||
		(move.status == "par" && this.hasAbility(this.bot.ennemy, "Limber")) ||
		(move.status == "brn" && this.hasAbility(this.bot.ennemy, "Water Veil")) ||
    (this.hasAbility(this.bot.ennemy, "Magic Bounce")) ||
    (this.hasAbility(this.bot.ennemy, "Synchronize")) ||
		(this.room.battle.yourSide.sideConditions.safeguard)) {
    return 0;
  }
	
	var isAnnoying = this.getStatusInterest(move.status) / ( (this.canCure(this.bot.ennemy)) ? 2 : 1) ;				
	return parseInt( ((isAnnoying + 1) * 30) ); // At most 90. Healing will be greater.
};

PokeyI.prototype.getStatusInterest = function(s) {
	switch (s) {
		case 'par':
			if (this.bot.ennemy.baseStats["spe"] > 120 || this.bot.ennemy.item == "Choice Scarf")
				return 2;
			if (this.bot.ennemy.baseStats["spe"] > 100)
				return 1;
			return 0;
		case 'tox':
			var wallCoef = this.getPotentialWall(this.bot.ennemy);
			return ( (wallCoef >= 20) ? 2 : (wallCoef >= 15) ? 1 : 0 );
		case 'brn':
			if (this.bot.ennemy.baseStats["atk"] > 120 || this.bot.ennemy.item == "Choice Band")
				return 2;
			if (this.bot.ennemy.baseStats["atk"] > 100)
				return 1;
			return 0;
		case 'slp':
			return 1;
	}
	return 0;
}

PokeyI.prototype.evalSpin = function(move, dmgTaken) { // Is this spin worth it ?

  if ((jQuery.isEmptyObject(this.bot.room.battle.mySide.sideConditions) && !this.bot.pokemon.volatiles.leechseed) ||
    this.hasType(this.bot.ennemy, "Ghost")) {
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
  if (hp < 0.25)
    return 1500;
  if (hp < 0.50)
    return 1000;
  if (hp < 0.60)
    return 500;
  if (hp < 0.75)
    return 100;
  if (hp < 0.90)
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


/////////////////// UNSSAFE ZONE //////////////////////////////////////

PokeyI.prototype.evalPainSplit = function(move) { // NOT TESTED NOW

  expectedDamage = this.getMaxDamageTaken(this.bot.pokemon, this.bot.ennemy)[1];
  ennemyHP = parseInt((parseInt(31 + 2 * this.bot.ennemy.baseStats * this.bot.ennemy.level / 100) + 10 + this.bot.ennemy.level) * this.bot.ennemy.hp / 100);

  if (this.isFaster(this.bot.pokemon, this.bot.ennemy)) { // If I should hit first
    newHP = parseInt((ennemyHP + this.bot.pokemon.hp) / 2); // Hp after pain split

    if (newHP < this.bot.pokemon.hp) // We will lose HP
      return 0;

    if (newHP < expectedDamage) { // We will probably die
      ratio = (this.bot.pokemon.hp / this.bot.pokemon.maxhp);
      return (ratio < 0.25) ? 100 : (ratio < 0.5) ? 50 : 0;
    }

    return (newHP / this.bot.pokemon.hp) * 100;
  }

  // If I will hit in second

  expectedHP = this.bot.pokemon.hp - expectedDamage;
  if (expectedHp < 0) // We will die before having done anything
    return 150; // FINAL GAMBIT

  newHP = parseInt((ennemyHP + expectedHP) / 2);

  if (newHP < expectedHP) // We will lose HP
    return 0;

  return (newHP / expectedHP) * 100;
};