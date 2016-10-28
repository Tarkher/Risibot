PokeyI.prototype.getMaxDamageTaken = function(pokemon) { // How much damage can we take at this turn

  // First we find the closest DC set.

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

  for (var i = 0; i < pokemon.moves.length; i++) {
    m = Moves[BattleMovedex[pokemon.moves[i]].name];
    if (m)
      closestPkm.moves[i] = m;
    else
      closestPkm.moves[i] = Moves["(No Move)"];
  }

  // We look for the maximum amount of damage we can take

  var maxiDmg = [0, 0];
  var f = new Field();
  var ennemyName = checkExeptions(this.bot.ennemy.species);
  for (var set in setdex[ennemyName]) {
    setName = ennemyName + " (" + set + ")";
    var ennemyPkm = new PokemonCalc(setName);
    dmg = calculateAllMoves(ennemyPkm, closestPkm, f);
    for (var i = 0; i < dmg[0].length; i++) {
      if (dmg[0][i].damage[15] > maxiDmg[0]) // false if it does not exist
        maxiDmg[0] = dmg[0][i].damage[15];
    }
    for (var i = 0; i < dmg[1].length; i++) {
      if (dmg[1][i].damage[15] > maxiDmg[1]) // false if it does not exist
        maxiDmg[1] = dmg[1][i].damage[15];
    }
  }

  // Todo : field modificators (rain, sun, ...) + multiplicators

  return maxiDmg;

};