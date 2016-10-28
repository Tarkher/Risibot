var Moves = moves;

function Pokemon(pokeInfo) {
    if (typeof pokeInfo === "string") { // in this case, pokeInfo is the id of an individual setOptions value whose moveset's tier matches the selected tier(s)
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
            var defaultDetails = Moves[moveName] || Moves['(No Move)'];
            this.moves.push($.extend({}, defaultDetails, {
                name: (defaultDetails.bp === 0) ? "(No Move)" : moveName,
                bp: defaultDetails.bp,
                type: defaultDetails.type,
                category: defaultDetails.category,
                isCrit: defaultDetails.alwaysCrit ? true : false,
                hits: defaultDetails.isMultiHit ? (this.ability === "Skill Link" ? 5 : 3) : defaultDetails.isTwoHit ? 2 : 1
            }) );
        }
        this.weight = pokemon.w;
    } else {
        var setName = pokeInfo.find("input.set-selector").val();
        if (setName.indexOf("(") === -1) {
            this.name = setName;
        } else {
            this.name = setName.substring(0, setName.indexOf(" ("));
        }
        this.type1 = pokeInfo.find(".type1").val();
        this.type2 = pokeInfo.find(".type2").val();
        this.level = ~~pokeInfo.find(".level").val();
        this.maxHP = ~~pokeInfo.find(".hp .total").text();
        this.curHP = ~~pokeInfo.find(".current-hp").val();
        this.HPEVs = ~~pokeInfo.find(".hp .evs").val();
        this.rawStats = [];
        this.boosts = [];
        this.stats = [];
        this.evs = [];
        for (var i = 0; i < STATS.length; i++) {
            this.rawStats[STATS[i]] = ~~pokeInfo.find("." + STATS[i] + " .total").text();
            this.boosts[STATS[i]] = ~~pokeInfo.find("." + STATS[i] + " .boost").val();
            this.evs[STATS[i]] = ~~pokeInfo.find("." + STATS[i] + " .evs").val();
        }
        this.nature = pokeInfo.find(".nature").val();
        this.ability = pokeInfo.find(".ability").val();
        this.item = pokeInfo.find(".item").val();
        this.status = pokeInfo.find(".status").val();
        this.toxicCounter = this.status === 'Badly Poisoned' ? ~~pokeInfo.find(".toxic-counter").val() : 0;
        this.moves = [
            getMoveDetails(pokeInfo.find(".move1")),
            getMoveDetails(pokeInfo.find(".move2")),
            getMoveDetails(pokeInfo.find(".move3")),
            getMoveDetails(pokeInfo.find(".move4"))
        ];
        this.weight = +pokeInfo.find(".weight").val();
    }
}