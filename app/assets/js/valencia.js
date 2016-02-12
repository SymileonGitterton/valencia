// breathing
function hello_world($p) {
    // data holder
    var data = [];
    for (var i = 0; i < 1000; i++) 
        data.push({});

    // ======================================================
    // graphical parameters
    // ======================================================

    //$p.background(245);
    $p.noStroke(); // hide outline
    $p.colorMode($p.HSB, 255);
    $p.ellipseMode($p.CENTER);
    // canvas size (based on data)
    var width = window.innerWidth;                  
    var height = window.innerHeight;                // thanks D
    //canvas.width = width-2000;
    //canvas.height = height-100;
    //$p.size(800, 600);  // TODO fill window width
    $p.size(width-200, height-100);


    // ======================================================
    // system parameters
    // ======================================================

    var gravity = 0;//0.5;							// gravity magnitude
    var gravityAngle = (1/2) * Math.PI;			// straight down, in this co-ordinate scheme. (radians)
    //var gravityAngleIncrement = 0.002 * (2 * Math.PI);	// gravity rotation each display time (radians)    
    var gravityAngleIncrement = 0;				// zero for no gravity whirlpool
    var drag = 0.997; // 0.995
    var areaDragFactor = 0;//0.00001;	// 0 for no effect; 0.00001 or similar for bouncy little guys + sluggish big fellas
    var radiusMean = 12.0;
    var radisuStandardDeviation = 4.0;
    var velocityMean = 10.0; //13.0;
    var velocityStandardDeviation = 2.0; //4.0;
    var frameCount = 0;
    var clickedX = $p.width/3;
    var clickedY = $p.height/2;
    var convergeStartFrameCount =  50;
    var divergeStartFrameCount  = 150;
    var tractorBeamRange = Math.min($p.width,$p.height)/2;
    var captureRange = tractorBeamRange / 20;
    var tractorIdleSpeed = velocityMean / 10;
    
	// table expressed in sigmas from mean. Selected from https://faculty.biu.ac.il/~shnaidh/zooloo/library/normal.3.pdf
    var gaussianLookup = [ 0.0000, 0.0251, 0.0502, 0.0753, 0.1004,   0.1257, 0.1510, 0.1764, 0.2019, 0.2275, 
                           0.2533, 0.2793, 0.3055, 0.3319, 0.3585,   0.3853, 0.4125, 0.4399, 0.4677, 0.4958,
                           0.5244, 0.5534, 0.5828, 0.6128, 0.6433,   0.6745, 0.7063, 0.7388, 0.7722,  0.8064,
                           0.8416, 0.8799, 0.9154, 0.9542, 0.9945,   1.0364, 1.0803, 1.1264, 1.1750, 1.2265,
                           1.2816, 1.3408, 1.4051, 1.4758, 1.5548,   1.6449, 1.7507, 1.8808, 2.0537, 2.3263, 2.8000 ];	// last is dummy
    
    // ======================================================
    // random Gaussian generator
    // ======================================================

    function randomGaussian(mean, standardDeviation, clampMin, clampMax) {
		// pick random entry from bell-curve lookup table
        var deviationIndex = Math.floor(Math.random() * (gaussianLookup.length - 1));
        var deviationFromMean = gaussianLookup[deviationIndex];
        // random linear interpolation between selected value and the next one, which is why dummy entry is needed.
        deviationFromMean += (Math.random() * (gaussianLookup[deviationIndex+1] - gaussianLookup[deviationIndex]));	
        var deviationSign = 0;
        if (Math.random() > 0.5) {
         	deviationSign =  1;
      	} else {
        	deviationSign = -1;
        }
        // apply offset to mean, in units of standard deviations. 
        // Offset either above or below mean according to sign
        // 65% of the time the return value should be within 1 std. dev. of the mean.
     	var result = mean + (deviationSign * deviationFromMean * standardDeviation);
        if (result < clampMin) 
            result = clampMin;
        if (result > clampMax) 
            result = clampMax;
        return result;
    }
        
 
    // ======================================================
    // add and initialize variables to the data object
    // ======================================================

    init_particles_star = function (isStar, originX, originY) {
        for (var i = 0; i < data.length; i++) {
			data[i].radius = randomGaussian(radiusMean, radisuStandardDeviation, 1, 25);	// no less than 1, no more than 25
            if (isStar) {
            	data[i].y = originY;
            	data[i].x = originX;
            } else {
                data[i].y = Math.random() * $p.height; //100;
            	data[i].x = Math.random() * $p.width;
            }

            var angle = Math.random() * 2 * Math.PI;	// random angle in radians
            var magnitude = Math.abs(randomGaussian(velocityMean, velocityStandardDeviation, 0.001, 6*velocityStandardDeviation)); // min 0.001 to avoid zero velocity
            data[i].x_v = magnitude * Math.cos(angle);
            data[i].y_v = magnitude * Math.sin(angle);
            
            data[i].hue = Math.random() * 255;
            data[i].saturation = 128 + (Math.random() * 127);	// dippin dots instead of wonderbread...
            data[i].brightness = 240 + (Math.random() * 15);
            data[i].y_max = $p.height - (data[i].radius / 2) - 10;
            data[i].x_max = $p.width - (data[i].radius / 2) - 10;
        }
    }
    

    // ======================================================
    // reload particles on mouse click
    // ======================================================

    $p.mouseClicked = function () {
        frameCount = 0;
        boost_particles();
    }

    boost_particles = function () {
        clickedX = $p.mouseX;
        clickedY = $p.mouseY;
        init_particles_star(true, clickedX, clickedY);
    }


    // ======================================================
    // draw a point
    // ======================================================

    draw_point = function (i) {
        $p.fill(data[i].hue, data[i].saturation, data[i].brightness) ;
        $p.ellipse(data[i].x + 3, data[i].y - 3, data[i].radius, data[i].radius);
    }


    // ======================================================
    // draw entire system
    // ======================================================

    $p.draw = function () {
        $p.background(255, 255, 255, 0);

        var gravityY = gravity * Math.sin(gravityAngle);
        var gravityX = gravity * Math.cos(gravityAngle);

        for (var i = 0; i < data.length; i++) {
            draw_point(i);
            
            var frontalArea = Math.PI * Math.pow(data[i].radius, 2);	// circle area is pi.r.squared
            var dragForThisParticle = drag - (areaDragFactor * frontalArea);
            
            // y direction
            if ((Math.abs(data[i].y_v) > 0)) {	// only for moving particules...
                data[i].y_v *= dragForThisParticle;
                data[i].y_v += gravityY;
                data[i].y += data[i].y_v;

                if (data[i].y >= data[i].y_max) {
                    data[i].y = data[i].y_max - (data[i].y - data[i].y_max);	// true reflect
                    //data[i].y = data[i].y_max
                    data[i].y_v *= -1;
                }

                if (data[i].y <= 10) {  
                    data[i].y = 10 + (10-data[i].y);	// true reflect
                    //data[i].y = 10;
                    data[i].y_v *= -1;
                }
            }

            // x direction
            if ((Math.abs(data[i].x_v) > 0)) {

                data[i].x_v *= dragForThisParticle;
                data[i].x_v += gravityX;
                data[i].x += data[i].x_v;

                if (data[i].x >= data[i].x_max) {
                    data[i].x = data[i].x_max - (data[i].x - data[i].x_max);	// true reflect
                    //data[i].x = data[i].x_max;
                    data[i].x_v *= -1;
                }

                if (data[i].x <= 10) {
                    data[i].x = 10 + (10-data[i].x);	// true reflect
                    //data[i].x = 10;
                    data[i].x_v *= -1;
                }
            }
        }
        
		gravityAngle += gravityAngleIncrement;
        if (++frameCount === convergeStartFrameCount) {
          	//console.log("frameCount reached ",frameCount," converging begins...");
        	for (var i=0;i<data.length;i++) {
            	var convergeMagnitude = Math.sqrt(Math.pow(data[i].x_v,2) + Math.pow(data[i].y_v,2)); // Pythagomaras
        		if (convergeMagnitude > 0) {
                    if (convergeMagnitude < tractorIdleSpeed)
                        convergeMagnitude = tractorIdleSpeed;
                	var deltaX = clickedX - data[i].x;
            		var deltaY = clickedY - data[i].y;
           			// keep same velocity magnitude but point it back at the click origin
           			var convergeAngle = Math.atan2(deltaY,deltaX);
                	// convert to x and y velocity by trigonomagic
           			data[i].x_v = convergeMagnitude * Math.cos(convergeAngle);
           			data[i].y_v = convergeMagnitude * Math.sin(convergeAngle);
                
                	// while converging, stop any balls that get too close
                	var distanceToHome = Math.sqrt(Math.pow(deltaX,2) + Math.pow(deltaY,2));
                	if (distanceToHome < captureRange) {
                    	data[i].x_v = 0;
                    	data[i].y_v = 0;
                	// and slow everyone else down according to how close they are
                	} else if (distanceToHome < tractorBeamRange) {
                    	var tractorFactor = Math.sqrt(distanceToHome / tractorBeamRange);	// r-squared strength
                    	data[i].x_v *= tractorFactor;
                    	data[i].y_v *= tractorFactor;
                	}
        		}
            }
                
    	} else if(frameCount >= divergeStartFrameCount) {
        	//console.log("frameCount reached ",frameCount," back to diverging");
            for (var i=0;i<data.length;i++) {
                var convergeMagnitude = Math.sqrt(Math.pow(data[i].x_v,2) + Math.pow(data[i].y_v,2)); // Pythagomaras
                if (convergeMagnitude > 0) {
        			var deltaX = clickedX - data[i].x;
           			var deltaY = clickedY - data[i].y;
           			// keep same velocity magnitude but point it back at the click origin
           			var convergeMagnitude = Math.sqrt(Math.pow(data[i].x_v,2) + Math.pow(data[i].y_v,2));
           			var convergeAngle = Math.atan2(deltaY,deltaX);
           			// convert to x and y velocity by trigonomagic
           			data[i].x_v = -1 * (convergeMagnitude * Math.cos(convergeAngle));
            		data[i].y_v = -1 * (convergeMagnitude * Math.sin(convergeAngle));
        		}
            }
    		frameCount = 0;	// start over
    	}
    }


    init_particles_star(true, clickedX, clickedY);
	console.log("started ",data.length," particles.");

}


// ======================================================
// create a canvas and begin the animation
// ======================================================

var canvas = document.getElementById("valencia");
var p = new Processing(canvas, hello_world);

