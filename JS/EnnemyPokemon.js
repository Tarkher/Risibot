function EnnemyPokemon(pkmn) {
  this.abilities = pkmn.abilities;
  this.ability = pkmn.ability;
  this.baseAbility = pkmn.baseAbility;
  this.types = pkmn.types;

  this.baseSpecies = pkmn.baseSpecies;
  this.species = pkmn.species;
  this.speciesid = pkmn.speciesid;
  this.forme = pkmn.forme;
  this.formeLetter = pkmn.formeLetter;
  this.formeid = pkmn.formeid;
  this.num = pkmn.num;

  this.baseStats = pkmn.baseStats;
  this.ev = {"hp":0,"atk":0,"def":0,"spa":0,"spd":0,"spe":0};
  this.level = pkmn.level;
  this.hp = (pkmn.hp == 1000)? 100 : pkmn.hp;
  this.maxhp = this.getMaxHP();
  this.boosts = pkmn.boosts;
  this.status = pkmn.status;
  this.statusStage = pkmn.statusStage;
  this.volatiles = pkmn.volatiles;

  this.item = pkmn.item;
  this.moveTrack = pkmn.moveTrack;
  this.moves = pkmn.moves;
  this.movestatuses = pkmn.movestatuses;

  this.lastmove = pkmn.lastmove;
  this.slot = pkmn.slot;
  this.fainted = pkmn.fainted;
  this.zerohp = pkmn.zerohp;
  this.turnstatuses = pkmn.turnstatuses;
  
  this.gender = pkmn.gender;
  this.heightm = pkmn.heightm;
  this.weightkg = pkmn.weightkg;
};

EnnemyPokemon.prototype.getMaxHP = function() {
  return Math.floor((31 + 2 * this.baseStats["hp"] + Math.floor(this.ev["hp"] / 4.0)) * this.leve l/ 100.0 + 10 + this.level);
};

EnnemyPokemon.prototype.getStat = function(stat) {//updates the value of a given stat
  return Math.floor(Math.floor( 31 + 2 * this.baseStats[stat] + Math.floor(this.ev[stat] / 4.0) * this.level / 100.0 + 5) * 1.0);//replace the 1.0 with the nature
};