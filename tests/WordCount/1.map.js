onmessage = function(e) {
    
    text = e.data;
    
    // words map
    var wordsMap = new Object();
    var words = text.split(' ');
    
    for(var i = 0; i < words.length; i++) {
        var word = words[i].toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
        
        if(!wordsMap[word]) wordsMap[word] = 1;
        else wordsMap[word]++;
    }

    postMessage(wordsMap);
};
