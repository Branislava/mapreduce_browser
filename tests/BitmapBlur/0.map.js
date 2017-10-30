onmessage = function(e) {

    // number of lines (i.e. rows)
    const lines = e.data.split('\n');
    const n = lines.length - 1;
    
    // string representation of a non-quadratic matrix
    var imgArr = [];
    for(var i = 0; i < n; i++) {
        
        var row = [];
        
        var line = lines[i];
        var pixels = line.split('\t');
        for(var j = 0; j < pixels.length - 1; j++) {
            var rgb = pixels[j].split(' ');
            var r = rgb[0], g = rgb[1], b = rgb[2];
            row.push([r, g, b]);
        }
        
        imgArr.push(row);
    }
        
    // blur radius in pixels
    const radius = 10;
    // blur window length in pixels
    const windowLen = radius*2+1;

    // columns (x) image width in pixels
    const imgWidth = imgArr[0].length;

    // rows (y) image height in pixels;
    const imgHeight = n;
        
    // create array for processed image based on input image dimensions
    imgB = createEmptyArray(imgHeight,imgWidth,3);
    
    console.log(imgArr);
    console.log(imgB);
    console.log(imgWidth);
    console.log(imgHeight);

    // blur horizontal row by row
    for(var ro = 0; ro < imgHeight; ro++) {
        
        // RGB color values
        var totalR = 0;
        var totalG = 0;
        var totalB = 0;

        // calculate blurred value of first pixel in each row
        for(var rads = -radius; rads < radius + 1; rads++) {
            
            if(rads >= 0 && (rads) <= imgWidth-1) {
                totalR += imgArr[ro][rads][0]/windowLen;
                totalG += imgArr[ro][rads][1]/windowLen;
                totalB += imgArr[ro][rads][2]/windowLen;
            }
        }

        imgB[ro][0] = [totalR,totalG,totalB]

        // calculate blurred value of the rest of the row based on
        // unweighted average of surrounding pixels within blur radius
        // using sliding window totals (add incoming, subtract outgoing pixels)
        for(var co = 1; co < imgWidth; co++) {
            if((co-radius-1) >= 0) {
                totalR -= imgArr[ro][co-radius-1][0]/windowLen;
                totalG -= imgArr[ro][co-radius-1][1]/windowLen;
                totalB -= imgArr[ro][co-radius-1][2]/windowLen;
            }
            if((co+radius) <= imgWidth-1) {
                totalR += imgArr[ro][co+radius][0]/windowLen;
                totalG += imgArr[ro][co+radius][1]/windowLen;
                totalB += imgArr[ro][co+radius][2]/windowLen;
            }

            // put average color value into imgB pixel
            imgB[ro][co] = [totalR,totalG,totalB]
        }
    }
    
    postMessage(imgB);
    
    function createEmptyArray(n, m, p) {
        
        a = [];
        for(var i = 0; i < n; i++) {
            
            pixels = [];
            for(var j = 0; j < m; j++) {
                
                rgb = [];
                for(var k = 0; k < p; k++) {
                    rgb.push(0);
                }
                
                pixels.push(rgb);
            }
            
            a.push(pixels);
        }
        
        return a;
    }
};
