// breathing
function hello_world($p) {
    // data holder
    var data = [];
    var stickyBoxes = [];

    // ======================================================
    // graphical parameters
    // ======================================================

    // $p is the canvas, passed in
    $p.noStroke(); // hide outline
    $p.colorMode($p.HSB, 255);
    $p.ellipseMode($p.CENTER);

    var width = window.innerWidth-200;                  
    var height = window.innerHeight-100;                // thanks D
    $p.size(width, height);

    console.log($p);
    var ctx = canvas.getContext("2d");


    // ======================================================
    // system parameters
    // ======================================================

    var population = 1000;
    var gravity = 0.02;//0.5;							// gravity magnitude
    var gravityAngle = (1/2) * Math.PI;			// straight down, in this co-ordinate scheme. (radians)
    //var gravityAngleIncrement = 0.002 * (2 * Math.PI);	// gravity rotation each display time (radians)    
    var gravityAngleIncrement = 0.01;				// zero for no gravity whirlpool
    var drag = 1.0;0.999; // 0.995
    var areaDragFactor = 0.000001;//0.00001;	// 0 for no effect; 0.00001 or similar for bouncy little guys + sluggish big fellas
    var radiusMean = 12.0;
    var radisuStandardDeviation = 4.0;
    var velocityMean = 10.0; //13.0;
    var velocityStandardDeviation = 2.0; //4.0;
    var frameCount = 0;
    var clickedX = $p.width/3;
    var clickedY = $p.height/2;
    var convergeStartFrameCount =  50;
    var divergeStartFrameCount  = 150;
    var frameCountMax = 20 * 60;
    var tractorBeamRange = Math.min($p.width,$p.height)/2;
    var captureRange = tractorBeamRange / 20;
    var tractorIdleSpeed = velocityMean / 10;
    var stickyBoxCaptureMax = population;
    var stickyBoxCaptureScale = 0.025;

    var stickyList = [  
        [0.1000,0.1225, 0.4000,0.6600],
        [0.1225,0.1750, 0.4000,0.4280],
        [0.1225,0.1750, 0.6320,0.6600],
        [0.1750,0.1925, 0.4080,0.4360],
        [0.1750,0.1925, 0.6240,0.6520],
        [0.1925,0.2100, 0.4200,0.4480],
        [0.1925,0.2100, 0.6120,0.6400],

        [0.2050,0.2250, 0.4480,0.4680],
        [0.2050,0.2250, 0.5920,0.6120],
        [0.2150,0.2375, 0.4680,0.5040],
        [0.2150,0.2375, 0.5560,0.5920],
        [0.2200,0.2425, 0.5040,0.5560],

    ];


    // Hello
    // You are a lovely person
    // and so beautiful

    // Though you are impossibly far away
    // I love above all to be near you

    // I hope we can always be friends
    // In happiness 
    // I love you

    var messageList = [ {   text:"hello", 
                            x:0.050, y:0.100, fonkt:"20px Verdana", 
                            on:Math.floor(0.05*frameCountMax), off:Math.floor(0.9000*frameCountMax), 
                            leftColor:"black", rightColor:null 
                        },
                        {   text:"you are a lovely person", 
                            x:0.050, y:0.150, fonkt:"20px Verdana", 
                            on:Math.floor(0.20*frameCountMax), off:Math.floor(0.9025*frameCountMax), 
                            leftColor:"red", rightColor:"magenta" 
                        },
                        {   text:"and so beautiful", 
                            x:0.050, y:0.200, fonkt:"20px Verdana", 
                            on:Math.floor(0.25*frameCountMax), off:Math.floor(0.9050*frameCountMax), 
                            leftColor:"magenta", rightColor:"red" 
                        },

                        {   text:"though you are impossibly far away",
                            x:0.085, y:0.750, fonkt:"20px Verdana", 
                            on:Math.floor(0.40*frameCountMax), off:Math.floor(0.9075*frameCountMax), 
                            leftColor:"blue", rightColor:"purple" 
                        },
                        {   text:"I love above all                    ", 
                            x:0.085, y:0.800, fonkt:"20px Verdana", 
                            on:Math.floor(0.45*frameCountMax), off:Math.floor(0.535*frameCountMax), 
                            leftColor:"purple", rightColor:"blue" 
                        },
                        {   text:"I love above all to be near you", 
                            x:0.085, y:0.800, fonkt:"20px Verdana", 
                            on:Math.floor(0.485*frameCountMax), off:Math.floor(0.9100*frameCountMax), 
                            leftColor:"purple", rightColor:"blue" 
                        },

                        {   text:"I hope we can always be friends",
                            x:0.600, y:0.800, fonkt:"20px Verdana", 
                            on:Math.floor(0.60*frameCountMax), off:Math.floor(0.9125*frameCountMax), 
                            leftColor:"red", midColor:"magenta", rightColor:"red" 
                        },
                        {   text:"in happiness",
                            x:0.600, y:0.850, fonkt:"20px Verdana", 
                            on:Math.floor(0.65*frameCountMax), off:Math.floor(0.9150*frameCountMax), 
                            leftColor:"magenta", midColor:"red", rightColor:"magenta" 
                        },
                        {   text:"I love you",
                            x:0.600, y:0.900, fonkt:"20px Verdana", 
                            on:Math.floor(0.80*frameCountMax), off:Math.floor(0.98*frameCountMax), 
                            leftColor:"black", rightColor:"black" 
                        },

                        //{   text:"I love you!",
                        //    x:0.250, y:0.200, fonkt:"100px Verdana", 
                        //    on:Math.floor(0.96*frameCountMax), off:Math.floor(1.00*frameCountMax), 
                        //    leftColor:"gray", rightColor:"gray" 
                        //},
                      ];

    // ======================================================
    // random Gaussian generator
    // ======================================================

    // table expressed in sigmas from mean. Selected from https://faculty.biu.ac.il/~shnaidh/zooloo/library/normal.3.pdf
    var gaussianLookup = [ 0.0000, 0.0251, 0.0502, 0.0753, 0.1004,   0.1257, 0.1510, 0.1764, 0.2019, 0.2275, 
                           0.2533, 0.2793, 0.3055, 0.3319, 0.3585,   0.3853, 0.4125, 0.4399, 0.4677, 0.4958,
                           0.5244, 0.5534, 0.5828, 0.6128, 0.6433,   0.6745, 0.7063, 0.7388, 0.7722,  0.8064,
                           0.8416, 0.8799, 0.9154, 0.9542, 0.9945,   1.0364, 1.0803, 1.1264, 1.1750, 1.2265,
                           1.2816, 1.3408, 1.4051, 1.4758, 1.5548,   1.6449, 1.7507, 1.8808, 2.0537, 2.3263, 2.8000 ];	// last is dummy
    
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
    // sticky shape initializer
    // ======================================================

    var initializeStickyBoxes = function() {
        for (var i=0;i<stickyList.length;i++) {
            var box = { active:   true,
                        captured: 0,
                        x_min:    Math.floor(stickyList[i][0]*width),
                        x_max:    Math.floor(stickyList[i][1]*width),
                        y_min:    Math.floor(stickyList[i][2]*height),
                        y_max:    Math.floor(stickyList[i][3]*height),
                  }
            box.captureMax = Math.floor(stickyBoxCaptureScale*((box.x_max-box.x_min) * (box.y_max-box.y_min)));
            console.log(box.captureMax);
            stickyBoxes.push(box);
        }
    }


    // ======================================================
    // add and initialize variables to the data object
    // ======================================================

    init_particles_star = function (isStar, originX, originY) {
        data = [];
        for (var i = 0; i < population; i++) {
            var newDot = {};
            newDot.radius = randomGaussian(radiusMean, radisuStandardDeviation, 1, 25);	// no less than 1, no more than 25
            if (isStar) {
            	newDot.y = originY;
            	newDot.x = originX;
            } else {
                newDot.y = Math.random() * $p.height; //100;
            	newDot.x = Math.random() * $p.width;
            }

            var angle = Math.random() * 2 * Math.PI;	// random angle in radians
            var magnitude = Math.abs(randomGaussian(velocityMean, velocityStandardDeviation, 0.001, 6*velocityStandardDeviation)); // min 0.001 to avoid zero velocity
            newDot.x_v = magnitude * Math.cos(angle);
            newDot.y_v = magnitude * Math.sin(angle);
            
            newDot.hue = Math.random() * 255;
            newDot.saturation = 128 + (Math.random() * 127);	// dippin dots instead of wonderbread...
            newDot.brightness = 240 + (Math.random() * 15);
            newDot.y_max = $p.height - (newDot.radius / 2) - 10;
            newDot.x_max = $p.width  - (newDot.radius / 2) - 10;

            newDot.active = true;
            data.push(newDot);
        }

        initializeStickyBoxes();
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

        // per dot, draw then move (with clamp and reflection) 
        for (var i = 0; i < data.length; i++) {

            draw_point(i);          // always draw

            if (data[i].active) {   // only update active guys
                var frontalArea = Math.PI * Math.pow(data[i].radius, 2);	// circle area is pi.r.squared
                var dragForThisParticle = drag - (areaDragFactor * frontalArea);
            
                // y direction and velocity
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

                // x direction and velocity
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
        }
        
        // adjust globals e.g. gravity
		gravityAngle += gravityAngleIncrement;

        // per dot, check all sticky boxes
        for (var dot=0; dot<data.length; dot++) {
            if (data[dot].active) {
                for (var box=0; box<stickyBoxes.length; box++) {
                    if ((stickyBoxes[box].active)) {
                        if ((data[dot].x >= stickyBoxes[box].x_min) &&  
                            (data[dot].x <= stickyBoxes[box].x_max) &&
                            (data[dot].y >= stickyBoxes[box].y_min) &&
                            (data[dot].y <= stickyBoxes[box].y_max)) {
                                data[dot].x_v = 0;
                                data[dot].y_v = 0;
                                data[dot].active = false;
                                //if (++(stickyBoxes[box].captured) >= stickyBoxCaptureMax) {
                                if (++(stickyBoxes[box].captured) >= stickyBoxes[box].captureMax) {
                                    stickyBoxes[box].active = false;
                                }
                        }
                    }
                }
            }
        }

        // draw texts
        for (var i=0;i<messageList.length;i++) {
            var m = messageList[i];
            if ((frameCount >= m.on) && (frameCount < m.off)) {
                ctx.font = m.fonkt;
                var textX0 = Math.floor(m.x*width);
                var textY0 = Math.floor(m.y*height);
                var linearGradient = ctx.createLinearGradient(textX0,textY0,textX0+Math.floor(m.text.length*10),textY0);
                linearGradient.addColorStop("0.0",m.leftColor)      // left
                if (m.midColor)
                    linearGradient.addColorStop("0.5",m.midColor)   // mid if exists
                if (m.rightColor)
                    linearGradient.addColorStop("1.0",m.rightColor) // right if exists...
                else
                   linearGradient.addColorStop("1.0",m.leftColor)   // ...else right is same as left
                ctx.fillStyle = linearGradient;
                ctx.fillText(m.text,textX0,textY0);
            }
        }

        if (++frameCount > frameCountMax)
            frameCount = 0;
    }


    // ======================================================
    // start system
    // ======================================================


    init_particles_star(true, clickedX, clickedY);
	console.log("started ",data.length," particles.");
    console.log("canvas extents ("+width+","+height+")");
}


// ======================================================
// create a canvas and begin the animation
// ======================================================

var canvas = document.getElementById("valencia");
var p = new Processing(canvas, hello_world);

