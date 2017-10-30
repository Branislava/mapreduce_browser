onmessage = function(e) {

    // number of lines (i.e. rows)
    const lines = e.data.split('\n');
    
    const n = lines.length - 1;
    
    // string representation of a non-quadratic imgArr
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

    // columns (x) image width in pixels
    const M = imgArr[0].length;

    // rows (y) image height in pixels;
    const N = n;
        
    // create array for processed image based on input image dimensions
    imgB = createEmptyArray(N,M,3);

    // image filter (NxM, intensity = 10)
    filter = createFilter(3, 3, 10);
    
    console.log(imgArr);
    console.log(imgB);
    console.log(N);
    console.log(M);
    
    for(var i = 0; i < N; i++) {
            for(j = 0; j < M; j++) {
                
                var sum_r = 0, sum_g = 0, sum_b = 0
                for(var ro = -1; ro <= 1; ro++) {
                    for(var co = -1; co <= 1; co++) {
                        if((i + ro) >= 0 && (i + ro) < N && (j + co) >= 0 && (j + co) < M) {
                            
                            sum_r += imgArr[i+ro][j+co][0] * filter[ro][co];
                            sum_g += imgArr[i+ro][j+co][1] * filter[ro][co];
                            sum_b += imgArr[i+ro][j+co][2] * filter[ro][co];
                        }
                    }
                }
                            
                            
                if(sum_r != 0 || sum_g != 0 || sum_b != 0) {
                    
                    imgB[i][j][0] = sum_r;
                    imgB[i][j][1] = sum_g;
                    imgB[i][j][2] = sum_b;
                    
                    if(imgB[i][j][0] > 255)
                        imgB[i][j][0] = 255;
                    if(imgB[i][j][0] < 0)
                        imgB[i][j][0] = 0;
                    
                    if(imgB[i][j][1] > 255)
                        imgB[i][j][1] = 255;
                    if(imgB[i][j][1] < 0)
                        imgB[i][j][1] = 0;
                        
                    if(imgB[i][j][2] > 255)
                        imgB[i][j][2] = 255;
                    if(imgB[i][j][2] < 0)
                        imgB[i][j][2] = 0;
                }
                else {
                    imgB[i][j][0] = imgArr[i][j][0];
                    imgB[i][j][1] = imgArr[i][j][1];
                    imgB[i][j][2] = imgArr[i][j][2];                    
                }
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
    
    function createFilter(n, m, intensity) {
        var filter = Object();
        
        filter['-1'] = Object();
        filter['0'] = Object();
        filter['1'] = Object();
        
        filter['-1']['-1'] = -1;
        filter['-1']['0'] = -1;
        filter['-1']['1'] = -1;
        filter['0']['-1'] = -1;
        filter['0']['0'] = intensity;
        filter['0']['1'] = -1;
        filter['1']['-1'] = -1;
        filter['1']['0'] = -1;
        filter['1']['1'] = -1;
        
        return filter;
    }
};
