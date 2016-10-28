VER = "0.4";

function Risibot() {

  this.room = room;
  this.currentTurn = 0;

  this.movesParsed = false;
  this.parsingMoves = false;
  this.moves = undefined;
  this.buttonsMoves = undefined;

  this.ennemyParsed = false;
  this.ennemy = undefined;

  this.pokemonParsed = false;
  this.pokemon = undefined;

  this.havePlayed = false;

  this.AI = new PokeyI(this);
	this.stopSignal = false;
	
	console.log(this);
	
  this.firstMessages(0);
};

Risibot.prototype.say = function(msg) {
	this.room.send("[Risibot]: La chancla channel: " + msg);
};

Risibot.prototype.firstMessages = function(i) {
	switch (i) {
		case 0:
			this.say("Risibot initialized. V." + VER);
			break;
		case 1:
			this.say("Here is my code : https://github.com/Risitop/Risibot/");
			break;
		case 2:
			this.say("Good luck human.");
			return;
	}
	var that = this;
	console.log(this);
	setTimeout( function() { that.firstMessages(i + 1); }, 1000 );
};

// Gets a formatted moves object
Risibot.prototype.parseMoves = function() {
  this.movesParsed = false;
  this.moves = {
    'traps': [], // Entry hazards
    'status': [], // Thunder wave
    'special': [], // Hydro pump
    'physical': [], // Earthquake
    'boost': [], // Swords dance
    'specialS': [], // Scald
    'physicalS': [], // Dynamic punch
    'specialB': [], // Power up punch
    'physicalB': [], // ?
    'protect': [],
    'seeds': [],
    'defog': [],
    'spin': [],
    'taunt': [],
    'heal': [],
    'cure': [],
    'roar': [],
    'uTurn': [],
    'voltSwitch': [],
    'trick': [],
    'fakeOut': [],
		'painSplit': []
  };

  movesTab = [];
  this.buttonsMoves = document.getElementsByName("chooseMove");
  if (this.buttonsMoves.length == 0) {
    console.log("Risibot: parseMoves: " + this.buttonsMoves.length + " moves parsed. Retrying...");
    var that = this;
    this.parsingMoves = true;
    setTimeout(function() {
      that.parseMoves();
    }, 1000);
    return;
  }

  for (var i = 0; i < this.buttonsMoves.length; i++) {
    movesTab.push(Tools.getMove(this.buttonsMoves[i].attributes['data-move'].nodeValue));
  }

  for (i = 0; i < movesTab.length; i++) {
    m = movesTab[i];
    k = parseInt(this.buttonsMoves[i].value);

    // Particular moves
    if (m.id == 'leechseed')
      this.moves.seeds.push([m, k]);
    else if (m.id == 'rapidspin')
      this.moves.spin.push([m, k]);
    else if (m.id == 'defog')
      this.moves.defog.push([m, k]);
    else if (m.id == 'taunt')
      this.moves.taunt.push([m, k]);
    else if (m.priority == -6)
      this.moves.roar.push([m, k]);
    else if (m.heal)
      this.moves.heal.push([m, k]);
    else if (m.target == 'allyTeam')
      this.moves.cure.push([m, k]);
    else if (m.selfSwitch)
      if (m.baseType == 'bug')
        this.moves.uTurn.push([m, k]);
      else
        this.moves.voltSwitch.push([m, k]);
    else if (m.id == 'trick' || m.id == 'switcheroo')
      this.moves.trick.push([m, k]);
    else if (m.id == 'fakeout')
      this.moves.fakeOut.push([m, k]);
		else if (m.id == 'painsplit')
      this.moves.spin.push([m, k]);

    else if (m.category == 'Status') {
      if (m.target == 'foeSide')
        this.moves.traps.push([m, k]);
      else if (m.status)
        this.moves.status.push([m, k]);
      else if (m.target == 'self')
        if (m.volatileStatus == 'protect')
          this.moves.protect.push([m, k]);
        else
          this.moves.boost.push([m, k]);
    } else if (m.category == 'Special') {
      if (m.secondaries)
        if (m.boosts)
          this.moves.specialB.push([m, k]);
        else
          this.moves.specialS.push([m, k]);
      else
        this.moves.special.push([m, k]);
    } else if (m.category == 'Physical') {
      if (m.secondaries)
        if (m.boosts)
          this.moves.physicalB.push([m, k]);
        else
          this.moves.physicalS.push([m, k]);
      else
        this.moves.physical.push([m, k]);
    }
  }

  console.log("Risibot: parseMoves: " + this.buttonsMoves.length + " moves parsed.");
	e = document.getElementsByName("megaevo");
	if (e.length)
		e[0].setAttribute("checked", true);
  this.movesParsed = true;
};

Risibot.prototype.getPokemon = function() {
  this.pokemon = undefined;
  pokemonPerso = undefined;
  for (i = 0; i < this.room.myPokemon.length; i++) {
    if (this.room.myPokemon[i].active)
      pokemonPerso = this.room.myPokemon[i];
  }
  pokemonGeneral = this.room.battle.mySide.active[0];
  if (pokemonPerso && pokemonGeneral) {
    this.pokemonParsed = true;
    this.pokemon = new FullPokemon(pokemonPerso, pokemonGeneral);
    console.log("Risibot: getPokemon: " + this.pokemon.name + " parsed.");
  }
};

Risibot.prototype.getEnnemyPokemon = function() {
  this.ennemy = this.room.battle.yourSide.active[0];
  if (this.ennemy) {
    this.ennemyParsed = true;
    console.log("Risibot: getPokemon: Ennemy " + this.ennemy.name + " parsed.");
  }
};

Risibot.prototype.waitingForMe = function() {
  if (!this.room)
    return false;
  else if (!this.room.choice)
    return false;
  else if (!this.room.choice.waiting)
    return true;
  return false;
};

Risibot.prototype.attack = function(id) {

  if (!this.buttonsMoves[0])
    return;

  console.log("Risibot: attack: Trying to execute move " + id + ".");

  var k = 0;
  while (parseInt(this.buttonsMoves[k].value) != id)
    k++;
  this.room.chooseMove(id, this.buttonsMoves[k]);
  return true;
};
Risibot.prototype.routine = function() {

  if (this.currentTurn < this.room.battle.turn) {
    this.movesParsed = false;
    this.parsingMoves = false;
    this.getEnnemyPokemon();
    this.getPokemon();
    this.currentTurn = this.room.battle.turn;
		console.log("Maximum damage taken: " + this.AI.getMaxDamageTaken(this.pokemon));
  }

  if (!this.movesParsed && !this.parsingMoves) {
    this.parseMoves();
  }

  if (this.waitingForMe()) {
    if (this.pokemon && this.room.battle.mySide.active && !this.pokemon.fainted && this.movesParsed) {
      m = this.choseMove();
			if (m != -1)
				this.attack(m + 1);
    } else { //Chose another 
      placeholder = 1;
    }
  }
	
	if (this.stopSignal)
		return;
	
  var that = this;
  setTimeout(function() {
    that.routine();
  }, 500);
};

Risibot.prototype.getField = function() { // Get the current status of the field DONE
    var f = new Field();
    
    f.isLightScreen[0] = (typeof this.room.battle.mySide.sideConditions.lightScreen !== 'undefined');
    f.isLightScreen[1] = (typeof this.room.battle.yourSide.sideConditions.lightScreen !== 'undefined');
    f.isReflect[0] = (typeof this.room.battle.mySide.sideConditions.reflect !== 'undefined');
    f.isReflect[1] = (typeof this.room.battle.yourSide.sideConditions.reflect !== 'undefined');
    
    f.weather = (this.room.battle.weather == 'sunnyday') ? "Sun" : (this.room.battle.weather == 'raindance') ? "Rain" : (this.room.battle.weather == 'hail') ? "Hail" : "";
    
    f.isGravity = (this.room.battle.weather == "pseudo");
    
}
