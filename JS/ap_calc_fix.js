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

function checkExeptions(poke){
    switch(poke){
        case 'Houndoom-Mega':
            poke = "Mega Houndoom";
            break;
        case 'Abomasnow-Mega':
            poke = "Mega Abomasnow";
            break;
        case 'Venusaur-Mega':
            poke = "Mega Venusaur";
            break;
        case 'Blastoise-Mega':
            poke = "Mega Blastoise";
            break;
        case 'Alakazam-Mega':
            poke = "Mega Alakazam";
            break;
        case 'Gengar-Mega':
            poke = "Mega Gengar";
            break;
        case 'Kangaskhan-Mega':
            poke = "Mega Kangaskhan";
            break;
        case 'Pinsir-Mega':
            poke = "Mega Pinsir";
            break;
        case 'Gyarados-Mega':
            poke = "Mega Gyarados";
            break;
        case 'Aerodactyl-Mega':
            poke = "Mega Aerodactyl";
            break;
        case 'Ampharos-Mega':
            poke = "Mega Ampharos";
            break;
        case 'Scizor-Mega':
            poke = "Mega Scizor";
            break;
        case 'Heracross-Mega':
            poke = "Mega Heracross";
            break;
        case 'Tyranitar-Mega':
            poke = "Mega Tyranitar";
            break;
        case 'Blaziken-Mega':
            poke = "Mega Blaziken";
            break;
        case 'Gardevoir-Mega':
            poke = "Mega Gardevoir";
            break;
        case 'Mawile-Mega':
            poke = "Mega Mawile";
            break;
        case 'Aggron-Mega':
            poke = "Mega Aggron";
            break;
        case 'Medicham-Mega':
            poke = "Mega Medicham";
            break;
        case 'Manectric-Mega':
            poke = "Mega Manectric";
            break;
        case 'Banette-Mega':
            poke = "Mega Banette";
            break;
        case 'Absol-Mega':
            poke = "Mega Absol";
            break;
        case 'Garchomp-Mega':
            poke = "Mega Garchomp";
            break;
        case 'Lucario-Mega':
            poke = "Mega Lucario";
            break;
        case 'Beedrill-Mega':
            poke = "Mega Beedrill";
            break;
        case 'Pidgeot-Mega':
            poke = "Mega Pidgeot";
            break;
        case 'Slowbro-Mega':
            poke = "Mega Slowbro";
            break;
        case 'Steelix-Mega':
            poke = "Mega Steelix";
            break;
        case 'Sceptile-Mega':
            poke = "Mega Sceptile";
            break;
        case 'Swampert-Mega':
            poke = "Mega Swampert";
            break;
        case 'Sableye-Mega':
            poke = "Mega Sableye";
            break;
        case 'Sharpedo-Mega':
            poke = "Mega Sharpedo";
            break;
        case 'Camerupt-Mega':
            poke = "Mega Camerupt";
            break;
        case 'Altaria-Mega':
            poke = "Mega Altaria";
            break;
        case 'Salamence-Mega':
            poke = "Mega Salamence";
            break;
        case 'Metagross-Mega':
            poke = "Mega Metagross";
            break;
        case 'Latias-Mega':
            poke = "Mega Latias";
            break;
        case 'Latios-Mega':
            poke = "Mega Latios";
            break;
        case 'Rayquaza-Mega':
            poke = "Mega Rayquaza";
            break;
        case 'Lopunny-Mega':
            poke = "Mega Lopunny";
            break;
        case 'Gallade-Mega':
            poke = "Mega Gallade";
            break;
        case 'Audino-Mega':
            poke = "Mega Audino";
            break;
        case 'Diancie-Mega':
            poke = "Mega Diancie";
            break;
        case 'Charizard-Mega-X':
            poke = "Mega Charizard X";
            break;
        case 'Charizard-Mega-Y':
            poke = "Mega Charizard Y";
            break;
        case 'Mewtwo-Mega-X':
            poke = "Mega Mewtwo X";
            break;
        case 'Mewtwo-Mega-Y':
            poke = "Mega Mewtwo Y";
            break;
        case 'Groudon-Primal':
            poke = "Primal Groudon";
            break;
        case 'Kyogre-Primal':
            poke = "Primal Kyogre";
            break;
        case 'Rotom-Fan':
            poke = "Rotom-S";
            break;
        case 'Rotom-Mow':
            poke = "Rotom-C";
            break;
        case 'Rotom-Frost':
            poke = "Rotom-F";
            break;
        case 'Rotom-Wash':
            poke = "Rotom-W";
            break;
        case 'Rotom-Heat':
            poke = "Rotom-H";
            break;
        case 'Meowstic-F':
            poke = "Meowstic";
            break;
        case 'Kyurem-Black':
            poke = "Kyurem-B";
            break;
        case 'Kyurem-White':
            poke = "Kyurem-W";
            break;
        case 'Landorus-Therian':
            poke = "Landorus-T";
            break;
        case 'Tornadus-Therian':
            poke = "Tornadus-T";
            break;
        case 'Thundurus-Therian':
            poke = "Thundurus-T";
            break;
        case 'Giratina-Origin':
            poke = "Giratina-O";
            break;
        case 'Hoopa-Unbound':
            poke = "Hoopa Unbound";
            break;
        case 'Gourgeist':
            poke = "Gourgeist-Average";
            break;  
        case 'Shaymin-Sky':
            poke = "Shaymin-S";
            break;
        case 'Wormadam-Sandy':
            poke = "Wormadam-G";
            break;
        case 'Wormadam-Trash':
            poke = "Wormadam-S";
            break;
        case 'Deoxys-Attack':
            poke = "Deoxys-A";
            break;
        case 'Deoxys-Defense':
            poke = "Deoxys-D";
            break;
        case 'Deoxys-Speed':
            poke = "Deoxys-S";
            break;
        case 'Aegislash':
            poke = "Aegislash-Blade";
            break;
        case 'Pikachu-Belle':   
        case 'Pikachu-Cosplay': 
        case 'Pikachu-Libre':
        case 'Pikachu-PhD': 
        case 'Pikachu-Pop-Star':    
        case 'Pikachu-Rock-Star':
            poke = "Pikachu";
            break;
    }
    return poke;
    
}

calculateAllMoves = CALCULATE_ALL_MOVES_BW;