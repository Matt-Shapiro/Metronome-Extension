var loadedSong;		//current song loaded into the metronome
var i;			//setInterval() variable. Used to start the metronome with setInterval() and to stop the metronome with clearInterval(i)
var interval;		//This is a number which represents the time between each metronome tick
var bpm = 120; //default BPM
var numFavorites = 0;	//value is updated after favorite songs are loaded from the google chrome storage api
var favorites = [];	//array is filled after favorite songs are loaded from storage
var currentlyPlaying = false;

function song(t, a, b, tst, tsb){
	this.title = t;
	this.artist = a;
	this.bpm = b;
	this.timeSignatureTop = tst;
	this.timeSignatureBottom = tsb;
}
function registerSong(song){
	loadedSong = song;
	bpm = song.bpm;
	$('#bpm').html(bpm);
	$('#informationList').empty();
	$('#informationList').append('<li>Song: ' + loadedSong.title + '</li>');
	$('#informationList').append('<li>Artist: ' + loadedSong.artist + '</li>');
	$('#informationList').append('<li>BPM: ' + loadedSong.bpm + '</li>');
	$('#informationList').append('<li>Meter: ' + loadedSong.timeSignatureTop + '/' + loadedSong.timeSignatureBottom + '</li>');
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
	
	//this loop cuts out a space in the <download> tag that causes the xml file to crash
	//25 songs in each table page
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
//stores song so that when extension is reloaded songs are still in favorites bar
function storeSong(song){
	var firstTime = true;
	chrome.storage.sync.getBytesInUse(function(result){
		if (result>0){
			firstTime = false;
		}
		if (firstTime){
			favorites = new Array();
			numFavorites = 0;	
			favorites[numFavorites] = song;
			numFavorites++;
			chrome.storage.sync.set({
				'songs': favorites,
				'numSongs': numFavorites
			});
		} else { // if not the first song in the array, have to fetch array, update favorites array, add the new song to store, then store favorites array in storage
			chrome.storage.sync.get('songs', function(result){
				for (i = 0; i < result.songs.length; i++){
					favorites[i] = result.songs[i];
				}

				chrome.storage.sync.get('numSongs', function(result){
					numFavorites = result.numSongs;
					favorites[numFavorites] = song;
					numFavorites++;
					chrome.storage.sync.set({
						'songs': favorites,
						'numSongs': numFavorites
					});
				});
			});
		}
	});
	//add song to the favorites bar
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
		numFavorites = result.numSongs;
		chrome.storage.sync.get('songs', function(result){
			favorites = result.songs;
			for (i = 0; i < numFavorites; i++){
				$('#favoritesBar').append("<div class = favorite></div>");
				$('#favoritesBar').children().last().append("<button class = edit>edit</button>");
				$('#favoritesBar').children().last().append('<p id = title; display = inline-block>Title: ' + favorites[i].title + '</p>');
				$('#favoritesBar').children().last().append("<button class = remove>remove</button>");
				$('#favoritesBar').children().last().append('<p>Artist: ' + favorites[i].artist + '</p>');
				$('#favoritesBar').children().last().append("<button class = load>load</button>");
				$('#favoritesBar').children().last().append('<p>BPM: ' + favorites[i].bpm + '</p>');
				$('#favoritesBar').children().last().append('<p>Meter: ' + favorites[i].timeSignatureTop + '/' + favorites[i].timeSignatureBottom + '</p>');
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
		if (currentlyPlaying){
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
			favorites = result.songs
			for (i = 0; i < favorites.length; i++){
				if (t===favorites[i].title){
					favorites.splice(i,1);
					chrome.storage.sync.set({
							'songs': favorites,
							'numSongs': favorites.length
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
				console.log("more than one search result");
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
	if (!currentlyPlaying){
		clearInterval(i);
		currentlyPlaying = true;
		$('#start').html("Stop");
		//60000 miliseconds per minute
		interval = (60000/bpm);
		i = setInterval(function(){
			mnh.play();
			}, interval);
	} else {
		console.log("registered");
		currentlyPlaying = false;
		$('#start').html("Start");
		clearInterval(i);
	}
}

$(function(){
	var mnh = document.getElementById("mnh");
	var mnl = document.getElementById("mnl");
	suggestions = new Array();
	bpm = 120;
	//chrome.storage.sync.get('b', function(result){
	//	bpm = result.b;
	//});
	loadSongs();
	$('#display').append('<h2 id = "bpm">' + bpm + '</h2>');
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
		bpm--;
		$('#bpm').html(bpm);
	});
	$('#plus').click(function(){
		bpm++;
		$('#bpm').html(bpm);
	});
	$('#playButton').click(startStop);
	//Must use AJAX so that the submit button does not reload the page, which throws out the search string
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

