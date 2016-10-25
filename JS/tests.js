

function getRoom() { // Returns current battle object
    url = window.location.href;
    while (url[0] != 'b') {
        url = url.slice(1);
    }
    return app.rooms[url];
}

function waitingForMe(room) {
	if (!room)
		return false;
	else if (!room.choice)
		return false;
	else if (!room.choice.waiting)
		return true;
	return false;
}

function attack(room, id) {
	moves = document.getElementsByName("chooseMove");
	if (id < moves.length)
		room.chooseMove(id + 1, moves[id]);
}

function main(ctx) {

    if (!ctx) {
        ctx = { "room": getRoom() };
    }

    if (waitingForMe(ctx.room)) {
       attack(ctx.room, parseInt(Math.random() * 4));
    }

    setTimeout( function() { main(ctx); }, 500 );
}

window.onload = main(null);