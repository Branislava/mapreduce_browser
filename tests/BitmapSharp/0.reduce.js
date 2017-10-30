function reduce(listOfMatrices) {
    
    var finalResults = "";
    
    for(var ind = 0; ind < listOfMatrices.length; ind++) {
        
        var matrix = listOfMatrices[ind];
        
        var n = matrix.length;
        var m = matrix[0].length;

        for(var i = 0; i < n; i++) {
            
            var pixels = matrix[i];
            var rowStr = "";
            for(var j = 0; j < m; j++) {
                
                var pixel = pixels[j];
                var r = pixel[0], g = pixel[1], b = pixel[2];
                rowStr += r + " " + g + " " + b;
                if(j < m - 1)
                    rowStr += "\t";
            }
            
            finalResults += rowStr + "\n";
        }
    }
    
    var o = new Object();
    o.data = finalResults;
    
    return o;
}
