module.exports = {
        dataToCelsius: function(arrayData, offsetPosition) {
	        var outTemp = arrayData[offsetPosition * 2] * 256 + arrayData[offsetPosition * 2 + 1];
        	outTemp = outTemp / 100 - 273.15;
	        outTemp = Math.round(outTemp * 100) / 100;
	        return(outTemp);
	}
}
