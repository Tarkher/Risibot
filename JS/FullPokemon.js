function FullPokemon(pokemonPerso, pokemonGeneral) { // Easier to manipulate

  this.moves = pokemonPerso.moves;
  this.active = pokemonPerso.active;
  this.baseAbility = pokemonPerso.baseAbility;
  this.gender = pokemonPerso.gender;
  this.hp = pokemonPerso.hp;
  this.maxhp = pokemonPerso.maxhp;
  this.item = pokemonPerso.item;
  this.stats = pokemonPerso.stats;
  this.status = pokemonPerso.status;
  this.species = pokemonPerso.species;

  this.types = pokemonGeneral.types;
  this.color = pokemonGeneral.color;
  this.speciesid = pokemonGeneral.speciesid;
  this.level = pokemonGeneral.level;
  this.boosts = pokemonGeneral.boosts;
  this.fainted = pokemonGeneral.fainted;
  this.weightkg = pokemonGeneral.weightkg;
  this.baseStats = pokemonGeneral.baseStats;
	this.baseStats = pokemonGeneral.name;
}