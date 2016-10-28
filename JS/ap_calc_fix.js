var Moves = moves;

function PokemonCalc(pokeInfo) {

  this.name = pokeInfo.substring(0, pokeInfo.indexOf(" ("));
  var setName = pokeInfo.substring(pokeInfo.indexOf("(") + 1, pokeInfo.lastIndexOf(")"));
  var pokemon = pokedex[this.name];
  this.type1 = pokemon.t1;
  this.type2 = (pokemon.t2 && typeof pokemon.t2 !== "undefined") ? pokemon.t2 : "";
  this.rawStats = [];
  this.boosts = [];
  this.stats = [];
  this.evs = [];

  var set = setdex[this.name][setName];
  this.level = set.level;
  this.HPEVs = (set.evs && typeof set.evs.hp !== "undefined") ? set.evs.hp : 0;
  if (gen < 3) {
    var HPDVs = 15;
    this.maxHP = ~~(((pokemon.bs.hp + HPDVs) * 2 + 63) * this.level / 100) + this.level + 10;
  } else if (pokemon.bs.hp === 1) {
    this.maxHP = 1;
  } else {
    var HPIVs = 31;
    this.maxHP = ~~((pokemon.bs.hp * 2 + HPIVs + ~~(this.HPEVs / 4)) * this.level / 100) + this.level + 10;
  }
  this.curHP = this.maxHP;
  this.nature = set.nature;
  for (var i = 0; i < STATS.length; i++) {
    var stat = STATS[i];
    this.boosts[stat] = 0;
    this.evs[stat] = (set.evs && typeof set.evs[stat] !== "undefined") ? set.evs[stat] : 0;
    if (gen < 3) {
      var dvs = 15;
      this.rawStats[stat] = ~~(((pokemon.bs[stat] + dvs) * 2 + 63) * this.level / 100) + 5;
    } else {
      var ivs = (set.ivs && typeof set.ivs[stat] !== "undefined") ? set.ivs[stat] : 31;
      var natureMods = NATURES[this.nature];
      var nature = natureMods[0] === stat ? 1.1 : natureMods[1] === stat ? 0.9 : 1;
      this.rawStats[stat] = ~~((~~((pokemon.bs[stat] * 2 + ivs + ~~(this.evs[stat] / 4)) * this.level / 100) + 5) * nature);
    }
  }
  this.ability = (set.ability && typeof set.ability !== "undefined") ? set.ability :
    (pokemon.ab && typeof pokemon.ab !== "undefined") ? pokemon.ab : "";
  this.item = (set.item && typeof set.item !== "undefined" && (set.item === "Eviolite" || set.item.indexOf("ite") < 0)) ? set.item : "";
  this.status = "Healthy";
  this.toxicCounter = 0;
  this.moves = [];
  for (var i = 0; i < 4; i++) {
    var moveName = set.moves[i];
    var defaultDetails = moves[moveName] || moves['(No Move)'];
    this.moves.push($.extend({}, defaultDetails, {
      name: (defaultDetails.bp === 0) ? "(No Move)" : moveName,
      bp: defaultDetails.bp,
      type: defaultDetails.type,
      category: defaultDetails.category,
      isCrit: defaultDetails.alwaysCrit ? true : false,
      hits: defaultDetails.isMultiHit ? (this.ability === "Skill Link" ? 5 : 3) : defaultDetails.isTwoHit ? 2 : 1
    }));
  }
  this.weight = pokemon.w;
}

calculateAllMoves = CALCULATE_ALL_MOVES_BW;