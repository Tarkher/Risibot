// input field validation

var bounds = {
    "level":[0,100],
    "base":[1,255],
    "evs":[0,252],
    "ivs":[0,31],
    "dvs":[0,15],
    "move-bp":[0,999]
};
for (var bounded in bounds) {
    if (bounds.hasOwnProperty(bounded)) {
        attachValidation(bounded, bounds[bounded][0], bounds[bounded][1]);
    }
}

function validate(obj, min, max) {
    obj.val(Math.max(min, Math.min(max, ~~obj.val())));
}

function getHPDVs(poke) {
    return (~~poke.find(".at .dvs").val() % 2) * 8 +
            (~~poke.find(".df .dvs").val() % 2) * 4 +
            (~~poke.find(gen === 1 ? ".sl .dvs" : ".sa .dvs").val() % 2) * 2 +
            (~~poke.find(".sp .dvs").val() % 2);
}

function calcStats(poke) {
    for (var i = 0; i < STATS.length; i++) {
        calcStat(poke, STATS[i]);
    }
}

function calcCurrentHP(poke, max, percent) {
    var current = Math.ceil(percent * max / 100);
    poke.find(".current-hp").val(current);
}
function calcPercentHP(poke, max, current) {
    var percent = Math.floor(100 * current / max);
    poke.find(".percent-hp").val(percent);
}

function setSelectValueIfValid(select, value, fallback) {
    select.val(select.children("option[value='" + value + "']").length !== 0 ? value : fallback);
}

function PokemonCalc(pokeInfo) {
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
            var defaultDetails = moves[moveName] || moves['(No Move)'];
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

function getMoveDetails(moveInfo) {
    var moveName = moveInfo.find("select.move-selector").val();
    var defaultDetails = moves[moveName];
    return $.extend({}, defaultDetails, {
        name: moveName,
        bp: ~~moveInfo.find(".move-bp").val(),
        type: moveInfo.find(".move-type").val(),
        category: moveInfo.find(".move-cat").val(),
        isCrit: moveInfo.find(".move-crit").prop("checked"),
        hits: defaultDetails.isMultiHit ? ~~moveInfo.find(".move-hits").val() : defaultDetails.isTwoHit ? 2 : 1
    });
}

function Field() {
    var format = $("input:radio[name='format']:checked").val();
    var isGravity = $("#gravity").prop("checked");
    var isSR = [$("#srL").prop("checked"), $("#srR").prop("checked")];
    var weather;
    var spikes;
    if (gen === 2) {
        spikes = [$("#gscSpikesL").prop("checked") ? 1 : 0, $("#gscSpikesR").prop("checked") ? 1 : 0];
        weather = $("input:radio[name='gscWeather']:checked").val();
    } else {
        weather = $("input:radio[name='weather']:checked").val();
        spikes = [~~$("input:radio[name='spikesL']:checked").val(), ~~$("input:radio[name='spikesR']:checked").val()];
    }
    var terrain = ($("input:checkbox[name='terrain']:checked").val()) ? $("input:checkbox[name='terrain']:checked").val() : "";
    var isReflect = [$("#reflectL").prop("checked"), $("#reflectR").prop("checked")];
    var isLightScreen = [$("#lightScreenL").prop("checked"), $("#lightScreenR").prop("checked")];
    var isForesight = [$("#foresightL").prop("checked"), $("#foresightR").prop("checked")];
    var isHelpingHand = [$("#helpingHandR").prop("checked"), $("#helpingHandL").prop("checked")]; // affects attacks against opposite side
    var isFriendGuard = [$("#friendGuardL").prop("checked"), $("#friendGuardR").prop("checked")];
    
    this.getWeather = function() {
        return weather;
    };
    this.clearWeather = function() {
        weather = "";
    };
    this.getSide = function(i) {
        return new SideCalc(format, terrain, weather, isGravity, isSR[i], spikes[i], isReflect[i], isLightScreen[i], isForesight[i], isHelpingHand[i], isFriendGuard[i]);
    };
}

function SideCalc(format, terrain, weather, isGravity, isSR, spikes, isReflect, isLightScreen, isForesight, isHelpingHand, isFriendGuard) {
    this.format = format;
    this.terrain = terrain;
    this.weather = weather;
    this.isGravity = isGravity;
    this.isSR = isSR;
    this.spikes = spikes;
    this.isReflect = isReflect;
    this.isLightScreen = isLightScreen;
    this.isForesight = isForesight;
    this.isHelpingHand = isHelpingHand;
    this.isFriendGuard = isFriendGuard;
}

var gen, genWasChanged, notation, pokedex, setdex, typeChart, moves, abilities, items, STATS, calcHP, calcStat;

pokedex = POKEDEX_XY;
setdex = SETDEX_XY;
typeChart = TYPE_CHART_XY;
moves = MOVES_XY;
items = ITEMS_XY;
abilities = ABILITIES_XY;
STATS = STATS_GSC;
calcHP = CALC_HP_ADV;
calcStat = CALC_STAT_ADV;

function getSetOptions() {
    var pokeNames = Object.keys(pokedex);
    pokeNames.sort();
    var setOptions = [];
    var idNum = 0;
    for (var i = 0; i < pokeNames.length; i++) {
        var pokeName = pokeNames[i];
        setOptions.push({
            pokemon: pokeName,
            text: pokeName
        });
        if (pokeName in setdex) {
            var setNames = Object.keys(setdex[pokeName]);
            for (var j = 0; j < setNames.length; j++) {
                var setName = setNames[j];
                setOptions.push({
                    pokemon: pokeName,
                    set: setName,
                    text: pokeName + " (" + setName + ")",
                    id: pokeName + " (" + setName + ")"
                });
            }
        }
        setOptions.push({
            pokemon: pokeName,
            set: "Blank Set",
            text: pokeName + " (Blank Set)",
            id: pokeName + " (Blank Set)"
        });
    }
    return setOptions;
}

function getSelectOptions(arr, sort) {
    if (sort) {
        arr.sort();
    }
    var r = '';
    for (var i = 0; i < arr.length; i++) {
        r += '<option value="' + arr[i] + '">' + arr[i] + '</option>';
    }
    return r;
}