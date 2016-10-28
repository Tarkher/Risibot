RisibotWatcher = function() { // Allows to manage Risibot from the tchat
	
	this.risibot = undefined;
	
	console.log("RisibotWatcher: intitializing...");
	
	this.routine = function() {
		
		if (room && room.chatHistory) {
			switch (room.chatHistory.lines[room.chatHistory.lines.length - 1]) {
				case "La chancla !":
					if (!this.risibot) {
						this.risibot = new Risibot();
						this.risibot.routine();
					}
					break;
				case "Risibot.stop()":
					this.risibot.stopSignal = true;
					this.risibot = undefined;
					break;
				case "Risibot.get()": 
					this.console.log(this.risibot);
					break;
			}
		}
		
		that = this;
		setTimeout(function() { that.routine(); }, 500);
	};
};

watcher = new RisibotWatcher();
watcherroutine();