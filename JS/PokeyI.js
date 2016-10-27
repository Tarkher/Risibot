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

  coef = this.getWeaknesses(this.bot.ennemy[0])[move.baseType]; // Type effectiveness
  for (i = 0; i < this.bot.pokemon.types.length; i++) { // STAB
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

  if (move.accuracy === true)
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
      break;
    case "brn":
      coef *= (this.getStat(this.bot.ennemy[0], "atk") / 100);
      break;
    case "slp":
      coef *= (this.getDanger(this.bot.ennemy[0], this.bot.pokemon));
      break;
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

  if (this.getDanger(this.bot.ennemy[0], this.bot.pokemon) > 100)
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

  if (this.bot.ennemy[0].volatiles.leechseed)
    return 0;
  
  var d = this.getDanger(this.bot.ennemy[0], this.bot.pokemon);
  if (d < 0.3) // Ennemy could switch
    return 100;
  if (d < 0.8) // Ennemy will probably not switch
    return 300;
  if (d < 1.5) // It's crucial to survive
    return 399;
  return 0 // ABORT MISSION
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

PokeyI.prototype.getDanger = function(attacker, defender) {

  var atkType; // We first try to determine what kind of attacker ennemy is.
  (this.getStat(attacker, 'atk') >= this.getStat(attacker, 'spa')) ? atkType = 'atk': atkType = 'spa';

  var potentialO = (this.getStat(attacker, 'spe') / 2 / (attacker.status == 'par' ? 4 : 1) + // We calculate an offensive power
    this.getStat(attacker, atkType) / 2 / ((attacker.status == 'brn' && atkType == 'atk') ? 2 : 1));
  if (attacker.status == 'slp')
    potentialO /= 3;

  var increased = false;
  for (var i = 0; i < attacker.types.length; i++) { // We calculate the type effectiveness
    w = Math.max(this.getWeaknesses(defender)[attacker.types[i]], 0.5);
    if (w > 1 && !increased) {
      potentialO *= w;
      increased = true;
    }
  }

  var potentialD = (this.getStat(defender, 'hp') / 2 / (attacker.status == 'par' ? 4 : 1) + // We calculate a defensive power
    ((atkType == 'atk') ? this.getStat(defender, 'def') : this.getStat(defender, 'spd')) / 2);

  return potentialO / potentialD;
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

PokeyI.prototype.getWeaknesses = function(poke) { //Takes a fullPokemon for argument
  //Returns a dictionnary of the pokemon weaknesses

  var id = poke.speciesid;
  if (!id)
    id = poke.species.toLowerCase();
  var ab = [""];
  var init = ["Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying",
    "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock",
    "Steel", "Water", "powder", "par", "psn", "tox", "brn", "trapped"
  ];

  for (var i in exports.BattlePokedex[id].abilities) {
    ab.push(exports.BattlePokedex[id].abilities[i]);
  }

  var weaknesses = {};

  for (var i = 0; i < init.length; i++) {
    weaknesses[init[i]] = 1.0;
  }

  for (var i = 0; i < poke.types.length; i++) {
    t = poke.types[i];
    for (var j in exports.BattleTypeChart[t]['damageTaken']) {
      switch (exports.BattleTypeChart[t]['damageTaken'][j]) {
        case 1:
          weaknesses[j] *= 2.0;
          break;
        case 2:
          weaknesses[j] *= 0.5;
          break;
        case 3:
          weaknesses[j] *= 0.0;
          break;
      }
    }
  }

  for (var i = 0; i < ab.length; i++) {
    if (ab[i] == "Dry Skin") {
      weaknesses["Fire"] *= 1.25;
      weaknesses["Water"] = 0.0;
    } else if (ab[i] == "Filter" || ab[i] == "Solid Rock") {
      for (var j in exports.BattleTypeChart[t]['damageTaken']) {
        if (weaknesses[j] == 2.0 || weaknesses == 4.0) {
          weaknesses[j] *= 0.75;
        }
      }
    } else if (ab[i] == "Flash Fire") {
      weaknesses["Fire"] = 0.0;
    } else if (ab[i] == "HeatProof") {
      weaknesses["Fire"] *= 0.5;
    } else if (ab[i] == "Levitate") {
      weaknesses["Ground"] = 0.0;
    } else if (ab[i] == "Thick Fat") {
      weaknesses["Fire"] *= 0.5;
      weaknesses["Ice"] *= 0.5;
    } else if (ab[i] == "Volt Absorb" || ab[i] == "Lightningrod" || ab[i] == "Motor Drive") {
      weaknesses["Electric"] = 0.0;
      weaknesses["par"] = 0.0;
    } else if (ab[i] == "Water Absorb" || ab[i] == "Storm Drain") {
      weaknesses["Water"] = 0.0;
    } else if (ab[i] == "Wonder Guard") {
      for (var j in exports.BattleTypeChart[t]['damageTaken']) {
        if (weaknesses[j] != 2.0 && weaknesses != 4.0) {
          weaknesses[j] = 0.0;
        }
      }
    } else if (ab[i] == "Sap Sipper") {
      weaknesses["Grass"] = 0.0;
      weaknesses["powder"] = 0.0;
    } else if (ab[i] == "Poison Heal") {
      weaknesses["tox"] = 0.0;
      weaknesses["psn"] = 0.0;
    }
  }

  return weaknesses;
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
  var name = pokemon.species.toLowerCase();
  for (var move in BattleLearnsets[name].learnset) {
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
  var name = pokemon.species.toLowerCase();
  for (var move in BattleLearnsets[name].learnset) {
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
  var name = pokemon.species.toLowerCase();
  for (var move in BattleLearnsets[name].learnset) {
    switch (move) {
      case 'aquaring':
      case 'leechseed':
      case 'ingrain':
        coef *= 1.1;
    }
  }
  for (var a in BattlePokedex[name].abilities) {
    switch (BattlePokedex[name].abilities[a]) {
      case 'Poison Heal':
        coef *= 1.5;
    }
  }
  return coef;
};
