getRoom = function() {
  url = window.location.href;
  while (url[0] != 'b') {
    url = url.slice(1);
  }
  return app.rooms[url];
};

getMaxIndex = function(tab) {
  iM = 0;
  for (i = 1; i < tab.length; i++) {
    if (tab[i] > tab[iM])
      iM = i;
  }
  return iM;
};
