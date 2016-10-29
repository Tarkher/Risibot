PokeyI.prototype.getMaxDamageTaken = function(pokemon) {
  // Returns [avg1, avg2, avg3, avg4, dmgTaken]
  // where avgi is the average percentage dealt with the i-th move.

  var name = checkExeptions(pokemon.species);
  var setName;
  for (setName in setdex[name])
    if (setName)
      break;

  setName = name + " (" + setName + ")";
  var closestPkm = new PokemonCalc(setName);
  if (!closestPkm)
    return [-1, -1];

  closestPkm.maxHP = pokemon.maxhp;
  closestPkm.curHP = pokemon.hp;
  closestPkm.rawStats.at = pokemon.stats.atk;
  closestPkm.rawStats.df = pokemon.stats.def;
  closestPkm.rawStats.sa = pokemon.stats.spa;
  closestPkm.rawStats.sd = pokemon.stats.spd;
  closestPkm.rawStats.sp = pokemon.stats.spe;

  closestPkm.status = statusConvert(pokemon.stats.spe);
  closestPkm.item = BattleItems[pokemon.item];

  closestPkm.ability = BattleAbilities[pokemon.baseAbility].name;
  this.applyBoosts(closestPkm, pokemon);

  for (var i = 0; i < pokemon.moves.length; i++) {
    var m = Moves[BattleMovedex[pokemon.moves[i]].name];
    if (m) {
      m.bp = getBpException(BattleMovedex[pokemon.moves[i]].name);
      closestPkm.moves[i] = m;
    } else
      closestPkm.moves[i] = Moves["(No Move)"];
  }

  // We look for the maximum amount of damage we can take

  var maxiDmg = [0, 0, 0, 0, 0];
  var f = new Field();
  var ennemyName = checkExeptions(this.bot.ennemy.species);
  for (var set in setdex[ennemyName]) {

    setName = ennemyName + " (" + set + ")";
    var ennemyPkm = new PokemonCalc(setName);
    
    var dmg = calculateAllMoves(ennemyPkm, closestPkm, f);

    for (var i = 0; i < dmg[0].length; i++) {
      if (dmg[0][i].damage[15] > maxiDmg[4]) // false if it does not exist
        maxiDmg[4] = dmg[0][i].damage[15];
    }

    for (var i = 0; i < dmg[1].length; i++) {
      if (dmg[1][i].damage[7] > maxiDmg[i]) // false if it does not exist
        maxiDmg[i] = dmg[1][i].damage[7];
    }
  }

  for (var i = 0; i < pokemon.moves.length; i++) {
    switch (pokemon.moves[i]) {
      case "sonicboom":
        maxiDmg[i] = 20;
        break;
      case "dragonrage":
        maxiDmg[i] = 40;
        break;
      case "seismictoss":
        maxiDmg[i] = pokemon.level;
        break;
      case "finalgambit":
        maxiDmg[i] = pokemon.maxhp;
        break;
    }
    maxiDmg[i] = parseInt(100 * maxiDmg[i] / this.bot.ennemy.maxhp);
  }

  maxiDmg[4] /= this.bot.pokemon.maxhp;

  return maxiDmg;

};

statusConvert = function(st) { // "psn" -> "Poisoned"

  switch (status) {
    case "brn":
      return "Burned";
    case "psn":
      return "Poisoned";
    case "tox":
      return "Badly Poisoned";
    case "slp":
      return "Asleep";
    case "frz":
      return "Frozen";
  }
  return "Healthy";
};

getBpException = function(moveName) {
  var bp = Moves[moveName].bp;

  switch (moveName) {
    case "Low Kick":
      w = this.bot.ennemy.weightkg;
      bp = (w < 10) ? 20 : (w < 25) ? 40 : (w < 50) ? 60 : (w < 100) ? 80 : (w < 200) ? 100 : 120;
      break;
    case "Grass Knot":
      w = this.bot.pokemon.weightkg;
      bp = (w < 10) ? 20 : (w < 25) ? 40 : (w < 50) ? 60 : (w < 100) ? 80 : (w < 200) ? 100 : 120;
      break;
    case "Heavy Slam":
      r = this.bot.pokemon.weightkg / this.bot.ennemy.weightkg;
      bp = (r > 1 / 2) ? 40 : (r > 1 / 3) ? 60 : (r > 1 / 4) ? 80 : (r > 1 / 5) ? 100 : 120;
      break;
    case "Gyro Ball":
      ennemySpeed = parseInt(2 * this.bot.ennemy.baseStats.spe * this.bot.ennemy.level / 100 + 5);
      bp = 25 * (ennemySpeed / this.bot.pokemon.stats.spe);
      break;
    case "Facade":
      bp = 70 * ((this.pokemon.status == "") ? 1 : 2);
      break;
    case "Return":
      bp = 102;
      break;
    case "Frustration":
      bp = 102;
      break;
  }
  return bp;
};

PokeyI.prototype.applyBoosts = function(pkmCalc, pkm) { // Converts
  for (var b in pkmCalc.boosts) {
    switch (b) {
      case "at":
        pkmCalc.at = (!pkm.boosts.atk) ? 0 : pkm.boosts.atk;
        break;
      case "df":
        pkmCalc.df = (!pkm.boosts.def) ? 0 : pkm.boosts.def;
        break;
      case "sa":
        pkmCalc.sa = (!pkm.boosts.spa) ? 0 : pkm.boosts.spa;
        break;
      case "sd":
        pkmCalc.sd = (!pkm.boosts.spd) ? 0 : pkm.boosts.spd;
        break;
      case "sp":
        pkmCalc.sp = (!pkm.boosts.spe) ? 0 : pkm.boosts.spe;
        break;
    }
  }
};