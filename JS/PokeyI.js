PokeyI = function(bot) {

  this.bot = bot;
};

BattleRoles = {

  'sweeperAtk': 0,
  'sweeperSpa': 1,

  'wallDef': 2,
  'wallSpd': 3,

  'pivotOff': 4,
  'pivotDef': 5,

  'wallbreakOff': 6,
  'wallbreakDef': 7
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
  for (i = 0; i < this.bot.pokemon.types.length; i++) {
    if (this.bot.pokemon && this.bot.pokemon.types[i] == move.baseType)
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

  volatileEffects = this.getMultiplicator(this.bot.pokemon, (move.category == "physical") ? 'atk' : 'spa');

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

PokeyI.prototype.evalSpin = function(move) {

  if (jQuery.isEmptyObject(this.bot.room.battle.mySide.sideConditions)) {
    console.log("Risibot: evalSpin: There is nothing to spin.");
    return 0;
  }
  return 150;
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
  return (this.getStat(pokemon, 'hp') / 2 +
    Math.max(this.getStat(pokemon, 'def'), this.getStat(pokemon, 'spd')) / 2);
};

PokeyI.prototype.getDanger = function(pokemon) {
  return (this.getStat(pokemon, 'spe') / 2 / (pokemon.status == 'par' ? 4 : 1) +
    Math.max(this.getStat(pokemon, 'atk') / (pokemon.status == 'brn' ? 2 : 1), this.getStat(pokemon, 'spa')) / 2);
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

PokeyI.prototype.evalSwitch = function(pokemon) {
  var coef = 100.0;
  var weaknesses = this.getWeaknesses(pokemon);
  for (var i = 0; i < this.bot.ennemy[0].types; i++)
    coef *= (1.0 / weaknesses[this.bot.ennemy[0][i]]);


};

PokeyI.prototype.getExpectedRole = function(pokemon) {
  // val in BattleRoles
  potentialRoles = [];

  // Simple cartesian norma
  potentialRoles.push(this.distance(this.getStat(pokemon, 'atk'), this.getStat(pokemon, 'spe'))); //swp a
  potentialRoles.push(this.distance(this.getStat(pokemon, 'spa'), this.getStat(pokemon, 'spe'))); // swp s
  potentialRoles.push(this.distance(this.getStat(pokemon, 'hp'), this.getStat(pokemon, 'def'))); // wall def
  potentialRoles.push(this.distance(this.getStat(pokemon, 'hp'), this.getStat(pokemon, 'spd'))); // wall off
  potentialRoles.push(this.distance(this.getStat(pokemon, 'atk'), this.getStat(pokemon, 'spe'))); // piv off
  potentialRoles.push(this.distance(this.getStat(pokemon, 'def'), this.getStat(pokemon, 'spd'))); // piv def
  potentialRoles.push(this.distance(this.getStat(pokemon, 'atk'), this.getStat(pokemon, 'atk'))); // wb off
  potentialRoles.push(this.distance(this.getStat(pokemon, 'atk'), this.getStat(pokemon, 'def'))); // wb def

  // We apply more coefs
  potentialRoles[BattleRoles.wallDef] *= this.getPotentialWall(pokemon, 'def');
  potentialRoles[BattleRoles.wallSpd] *= this.getPotentialWall(pokemon, 'spd');

  return potentialRoles;

};

PokeyI.prototype.distance = function(a, b) {
  return Math.sqrt(a * a + b * b);
};

PokeyI.prototype.getPotentialWall = function(pokemon, type) { // Can pokemon be a good wall ?
  coef = Math.pow(2, parseFloat(this.getStat(pokemon, type) - 80) / 30);
  if (this.canHeal(pokemon)) // Increases greatly the staying power
    coef *= 1.5;
  else
    coef *= 0.67;
  if (this.canCure(pokemon)) // Not as important, but cool.
    coef *= 1.2;
  return coef * this.passiveHeal(pokemon); // Leech seed / ingrain ... / POISON HEAL !!
};

PokeyI.prototype.canHeal = function(pokemon) { // If pokemon can learn viable heal moves
  name = pokemon.species.toLowerCase();
  for (move in BattleLearnsets[name].learnset) {
    switch (move) {
      case 'roost':
      case 'recover':
      case 'slackoff':
      case 'softboiled':
      case 'milkdrink':
      case 'synthesis':
      case 'morningsun':
      case 'moonlight':
      case 'wish':
      case 'healorder':
        return true;
    }
  }
  return false;
};

PokeyI.prototype.canCure = function(pokemon) { // If pokemon can learn viable heal moves
  name = pokemon.species.toLowerCase();
  for (move in BattleLearnsets[name].learnset) {
    switch (move) {
      case 'healbell':
      case 'aromatherapy':
        return true;
    }
  }
  return false;
};

PokeyI.prototype.passiveHeal = function(pokemon) { // If pokemon can learn viable heal moves
  var coef = 1.0;
  name = pokemon.species.toLowerCase();
  for (move in BattleLearnsets[name].learnset) {
    switch (move) {
      case 'aquaring':
      case 'leechseed':
      case 'ingrain':
        coef *= 1.1;
    }
  }
  for (a in BattlePokedex[name].abilities) {
    switch (BattlePokedex[name].abilities[a]) {
      case 'Poison Heal':
        coef *= 1.5;
    }
  }
  return coef;
};
