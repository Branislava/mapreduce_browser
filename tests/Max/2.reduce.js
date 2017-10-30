function reduce(list_of_numbers) {

	var maxx = -1;

	for(var i = 0; i < list_of_numbers.length; i++)
		if(list_of_numbers[i] > maxx)
			maxx = list_of_numbers[i];

	return maxx;
}
