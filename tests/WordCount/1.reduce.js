function reduce(arrayOfWordsMap) {

    finalResults = new Object();

    for(var i = 0; i < arrayOfWordsMap.length; i++) {
        result = arrayOfWordsMap[i];

        for (var word in result) {

            if(finalResults[word] === undefined)
                finalResults[word] = result[word];
            else
                finalResults[word] += result[word];
        }
    }
   
    return finalResults;
}
