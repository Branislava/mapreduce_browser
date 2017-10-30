onmessage = function(e) {
    
        var text = e.data;
    
	var numbers = text.split('\n');

	var maxx = -1;
	for(var i = 0; i < numbers.length; i++) {
		var x = parseInt(numbers[i]);

		if(x > maxx) maxx = x;
	}

	postMessage(maxx);
}
