function outputUpdate(x, id) {
	var output = document.getElementById(id);
	output.value = x;
	if (output.value > 10) {
		output.style.left = x * 10 - 5 + 'px';
	}
	if (output.value > 50) {
		output.style.left = x * 10 - 8 + 'px';
	}
	else {
		output.style.left = x * 10 - 2 + 'px';
	}
}
