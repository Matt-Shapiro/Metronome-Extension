var loadedSong;
myApp = {
	metronomeSettings:{
		i: setInterval(function(){		//an interval object used to clear and set the interval which plays the metronome sound file
			mnh.play();
			}, 60000),					
		interval: 500,				//The integer variable which determines how many milliseconds between each tick... 60000 milliseconds per minute
									//equivalent to (milliseconds / bpm). The default is 60000/120 = 500
		bpm: 120,					//used for the bpm display and to calculate the interval. Default is 120
		currentlyPlaying: false		//boolean used to differentiate which action to take on click for multiple functions. 
	},
	favoriteSettings:{
		numFavorites: 0,	//0 until loadSongs is called upon launch
		favorites: [],		//Empty array until loadSongs is called upon launch
	}
}
function song(t, a, b, tst, tsb){
	this.title = t;
	this.artist = a;
	this.bpm = b;
	this.timeSignatureTop = tst;
	this.timeSignatureBottom = tsb;
}
function registerSong(song){
	loadedSong = song;
	myApp.metronomeSettings.bpm = song.bpm;
	$('#bpm').html(myApp.metronomeSettings.bpm);
	$('#informationList').empty();
	$('#informationList').append('<li>Song: ' + song.title + '</li>');
	$('#informationList').append('<li>Artist: ' + song.artist + '</li>');
	$('#informationList').append('<li>BPM: ' + song.timeSignatureTop + '/' + song.timeSignatureBottom + '</li>');
	if (!$('#saveSong').hasClass('canAdd'))
		$('#saveSong').addClass('canAdd');
}
function isolateTable(responseText){
	var tableStartIndex;
	var tableEndIndex;
	var downloadTagStart;
	var downloadTagEnd = 0;
	for (i = 0; i < responseText.length; i++){
		if(responseText[i] === '<' && responseText[i+1] === 't' && responseText[i+2] === 'b')
			tableStartIndex = i; 
	}
	for (i = 0; i < responseText.length; i++){
		if(responseText[i] === '/' && responseText[i+1] === 't' && responseText[i+2] === 'b')
			tableEndIndex = i+7; 
	}
	responseText = responseText.substring(tableStartIndex, tableEndIndex);
	console.log(responseText);
	
	
	//remove download tag
	//25 songs in table
	for (k = 0; k < 25; k++){
		for (i = downloadTagEnd; i < responseText.length; i++){
			if (responseText[i] === 'd' && responseText[i+1] === 'o' && responseText[i+2] === 'w' && responseText[i+3] === 'n'){
				downloadTagStart = i-11;
				for (j = i; i < responseText.length; j++){
					if (responseText[j] === '<' && responseText[j+1] === '/' && responseText[j+2] === 't' && responseText[j+3] === 'd'){
						downloadTagEnd = j + 4;
						break;
					}
				}
				break;
			}	
		}
		console.log("start: " + downloadTagStart);
		console.log("end: " + downloadTagEnd);
		responseText = responseText.substring(0, downloadTagStart) + responseText.substring(downloadTagEnd);
	}
	return responseText;
}
function storeSong(song){
	var firstTime = true;
	chrome.storage.sync.getBytesInUse(function(result){
		console.log('Bytes: ' + result);
		if (result>0){
			console.log('Bytes > 0');
			firstTime = false;
		}
		if (firstTime){
			console.log("firstTime");
			myApp.favoriteSettings.favorites = new Array();
			myApp.favoriteSettings.numFavorites = 0;	
			myApp.favoriteSettings.favorites[myApp.favoriteSettings.numFavorites] = song;
			myApp.favoriteSettings.numFavorites++;
			chrome.storage.sync.set({
				'songs': myApp.favoriteSettings.favorites,
				'numSongs': myApp.favoriteSettings.numFavorites
			});
		} else {
			console.log("NOT firstTime");
			chrome.storage.sync.get('songs', function(result){
				console.log("result length: " + result.songs.length);
				for (i = 0; i < result.songs.length; i++){
					myApp.favoriteSettings.favorites[i] = result.songs[i];
					console.log("favorites[i]: " + myApp.favoriteSettings.favorites[i]);
				}
				console.log('songs/favorites: ' + result.songs);
				chrome.storage.sync.get('numSongs', function(result){
					myApp.favoriteSettings.numFavorites = result.numSongs;
					console.log('numSongs/numFavorites: ' + myApp.favoriteSettings.numFavorites);
					myApp.favoriteSettings.favorites[myApp.favoriteSettings.numFavorites] = song;
					console.log('favorites[numFavorites]: ' + myApp.favoriteSettings.favorites[myApp.favoriteSettings.numFavorites]);
					myApp.favoriteSettings.numFavorites++;
					chrome.storage.sync.set({
						'songs': myApp.favoriteSettings.favorites,
						'numSongs': myApp.favoriteSettings.numFavorites
					});
				});
			});
		}
	});
	$('#favoritesBar').append("<div class = favorite></div>");
	$('#favoritesBar').children().last().append("<button class = edit>edit</button>");
	$('#favoritesBar').children().last().append('<p id = title; display = inline-block>Title: ' + song.title + '</p>');
	$('#favoritesBar').children().last().append("<button class = remove>remove</button>");
	$('#favoritesBar').children().last().append('<p>Artist: ' + song.artist + '</p>');
	$('#favoritesBar').children().last().append("<button class = load>load</button>");
	$('#favoritesBar').children().last().append('<p>BPM: ' + song.bpm + '</p>');
	$('#favoritesBar').children().last().append('<p>Meter: ' + song.timeSignatureTop + '/' + song.timeSignatureBottom + '</p>');
};
function loadSongs(){	
	chrome.storage.sync.get('numSongs', function(result){
		myApp.favoriteSettings.numFavorites = result.numSongs;
		chrome.storage.sync.get('songs', function(result){
			myApp.favoriteSettings.favorites = result.songs;
			for (i = 0; i < myApp.favoriteSettings.numFavorites; i++){
				$('#favoritesBar').append("<div class = favorite></div>");
				$('#favoritesBar').children().last().append("<button class = edit>edit</button>");
				$('#favoritesBar').children().last().append('<p id = title; display = inline-block>Title: ' + myApp.favoriteSettings.favorites[i].title + '</p>');
				$('#favoritesBar').children().last().append("<button class = remove>remove</button>");
				$('#favoritesBar').children().last().append('<p>Artist: ' + myApp.favoriteSettings.favorites[i].artist + '</p>');
				$('#favoritesBar').children().last().append("<button class = load>load</button>");
				$('#favoritesBar').children().last().append('<p>BPM: ' + myApp.favoriteSettings.favorites[i].bpm + '</p>');
				$('#favoritesBar').children().last().append('<p>Meter: ' + myApp.favoriteSettings.favorites[i].timeSignatureTop + '/' + myApp.favoriteSettings.favorites[i].timeSignatureBottom + '</p>');
			}
		});
	});
	$('#favoritesBar').on('click', '.edit', function(){
		$(this).parent().find('p')[0].innerHTML = '<form id = "editTitle"><input type = "text"></input></form>';
		$(this).parent().find('p')[1].innerHTML = '<form id = "editArtist"><input type = "text"></input></form>';
		$(this).parent().find('p')[2].innerHTML = '<form id = "editBPM"><input type = "text"></input></form>';
		$(this).parent().find('p')[3].innerHTML = '<form id = "editMeter"><input type = "text"></input></form>';
		$('#editTitle, #editArtist, #editBPM, #editMeter').submit(function(){
			var h = new XMLHttpRequest();
			h.open("POST", "chrome-extension://dmihbmpfogdldmeddpfpfnfcbjinglcp/mn.html", true);
			h.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			console.log($(this).childNodes[0].value);
			var t = $(this).value;
			console.log(t);
			h.onload = function(){
				$(this).parent().find('p')[0].innerHTML = t;
			}
			h.send(t);
			return false;
		});
	});
	$('#favoritesBar').on('click', '.load', function(){
		if (myApp.metronomeSettings.currentlyPlaying){
			startStop();
		}
		var t = $(this).parent().find('p')[0].innerHTML;
		var space;
		for (i = 0; i < t.length; i++){
			if (t[i]===':')
				space = i+2;
		}
		t = t.substring(space);
		var a = $(this).parent().find('p')[1].innerHTML;
		var space;
		for (i = 0; i < a.length; i++){
			if (a[i]===':')
				space = i+2;
		}
		a = a.substring(space);
		var b = $(this).parent().find('p')[2].innerHTML;
		var space;
		for (i = 0; i < b.length; i++){
			if (b[i]===':')
				space = i+2;
		}
		b = b.substring(space);
		var s = new song(t, a, b, 4, 4);
		registerSong(s);
	});
	$('#favoritesBar').on('click', '.remove', function(){
		var t = $(this).parent().find('p')[0].innerHTML;
		var space;
		for (i = 0; i < t.length; i++){
			if (t[i]===':')
				space = i+2;
		}
		t = t.substring(space);
		$(this).parent().remove();
		chrome.storage.sync.get('songs', function(result){
			myApp.favoriteSettings.favorites = result.songs
			for (i = 0; i < myApp.favoriteSettings.favorites.length; i++){
				if (t===myApp.favoriteSettings.favorites[i].title){
					myApp.favoriteSettings.favorites.splice(i,1);
					chrome.storage.sync.set({
							'songs': myApp.favoriteSettings.favorites,
							'numSongs': myApp.favoriteSettings.favorites.length
						}
					);
				}
			}
		});
	});
}

function retrieveSong(name, suggestions) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://www.bpmdatabase.com/music/search/?q=" + name, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
			var rt = xhr.responseText;
			rt = isolateTable(rt);
			console.log(rt);
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(rt, "application/xml");
			console.log(xmlDoc);
			
			var titles = xmlDoc.getElementsByClassName("title");
			for (i = 0; i < titles.length; i++){
				suggestions[i] = new song(titles[i].innerHTML,
								xmlDoc.getElementsByClassName("artist")[i].firstChild.innerHTML,
								xmlDoc.getElementsByClassName("bpm")[i].innerHTML, 4, 4);
			}
			
			if (titles.length > 1){
				if (!$('#searchSuggestions').hasClass('visible'))
					$('#searchSuggestions').addClass('visible');
				else {
					$('#searchSuggestions').empty();
				}
				for (i = 0; i < titles.length; i++){
					$('#searchSuggestions').append('<div class = suggestion>' + titles[i].innerHTML + '</div>')
				}
			} else {
				var s = suggestions[0];
				registerSong(s);
			}
			$('.suggestion').click(function(){
				for (i = 0; i < suggestions.length; i++){
					if ((this).innerHTML === suggestions[i].title){
						registerSong(suggestions[i]);
					}
				}
			});
		}
	};
    xhr.send();
}    
function startStop(){
	if (!myApp.metronomeSettings.currentlyPlaying){
		clearInterval(myApp.metronomeSettings.i);
		myApp.metronomeSettings.currentlyPlaying = true;
		$('#start').html("Stop");
		//60000 miliseconds per minute
		myApp.metronomeSettings.interval = (60000/myApp.metronomeSettings.bpm);
		myApp.metronomeSettings.i = setInterval(function(){
			mnh.play();
			}, myApp.metronomeSettings.interval);
	} else {
		console.log("registered");
		myApp.metronomeSettings.currentlyPlaying = false;
		$('#start').html("Start");
		clearInterval(myApp.metronomeSettings.i);
	}
}
$(function(){
	var mnh = document.getElementById("mnh");
	var mnl = document.getElementById("mnl");
	suggestions = new Array();
	myApp.metronomeSettings.bpm = 120;
	//chrome.storage.sync.get('b', function(result){
	//	bpm = result.b;
	//});
	loadSongs();
	$('#display').append('<h2 id = "bpm">' + myApp.metronomeSettings.bpm + '</h2>');
	$('#favoritesButton').click(function(){
		$('#favoritesBar').toggleClass('visible');
	});
	$('#favoritesButton').mouseenter(function(){
		$(this).css('backgroundColor', '#999999');
	});
	$('#favoritesButton').mouseleave(function(){
		$(this).css('backgroundColor', 'ghostwhite');
	})
	$('#saveSong').click(function(){
		storeSong(loadedSong);
	});
	$('#saveSong').mouseenter(function(){
		$(this).css('backgroundColor', '#999999');
	});
	$('#saveSong').mouseleave(function(){
		if ($(this).hasClass('canAdd'))
			$(this).css('backgroundColor', '#424f5d');
	});
	$('body').click(function(){
		if ($('#searchSuggestions').hasClass('visible')){
			$('#searchSuggestions').removeClass('visible');
		}
	});
	$('#header').click(function(){
		if ($('#searchSuggestions').hasClass('visible')){
			$('#searchSuggestions').removeClass('visible');
		}
	});
	$('#playButton').mouseenter(function(){
		$(this).css('backgroundColor', '#900C3F');
	});
	$('#playButton').mouseleave(function(){
		$(this).css('backgroundColor', '#C70039');
	});
	$('#minus').click(function(){
		myApp.metronomeSettings.bpm--;
		$('#bpm').html(myApp.metronomeSettings.bpm);
	});
	$('#plus').click(function(){
		myApp.metronomeSettings.bpm++;
		$('#bpm').html(myApp.metronomeSettings.bpm);
	});
	$('#playButton').click(startStop);
	$('#wSearch').submit(function(){
		var http = new XMLHttpRequest();
		http.open("POST", "chrome-extension://dmihbmpfogdldmeddpfpfnfcbjinglcp/mn.html", true);
		http.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		var name = document.getElementById("name").value; 
		http.onload = function(){
			retrieveSong(name, suggestions);
		}
		http.send(name);
		return false;
	});
});


