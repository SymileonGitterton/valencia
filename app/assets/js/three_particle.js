// ------------------------------------------------------------------------------------------------
// scene, camera, and renderer go here

var WIDTH = HEIGHT = 500;
var scene = new THREE.Scene();

// create a canvas and a renderer 
var canvas = document.getElementById("three_particle");
var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
}); // use webgl renderer (GPU!)
renderer.setSize(WIDTH, HEIGHT);

var camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 3*WIDTH);
camera.position.set(0, 200, 1000);
camera.rotation.set(-.2, 0, 0);
scene.add(camera);

// ------------------------------------------------------------------------------------------------
// add FPS using Stats.js

var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms
document.getElementById("three_particle_container").appendChild(stats.domElement);

var gui = new dat.GUI({ autoPlace: false });
document.getElementById('three_particle_container').appendChild(gui.domElement);



//PMA
// P. Arnold, D. Moore
//===================================================
// vector math helpful functions
//===================================================

var pmaVector3 = function(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

var vectorAdd = function(vector1, vector2) {
    var v = new pmaVector3(0,0,0);
    v.x = vector1.x + vector2.x;
    v.y = vector1.y + vector2.y;
    v.z = vector1.z + vector2.z;
    return v;
}

var vectorMagnitude = function(vector1) {
    return Math.pow((Math.pow(vector1.x,2) + Math.pow(vector1.y,2) + Math.pow(vector1.z,2)),1/2);
}

var scalarMultiply = function(vector1, scaleFactor) {
    var v = new pmaVector3(0,0,0);
    v.x = vector1.x * scaleFactor;
    v.y = vector1.y * scaleFactor;
    v.z = vector1.z * scaleFactor;
    return v;
}

var vectorCrossProduct = function(vector1, vector2) {
    var v = new pmaVector3(0,0,0);
    v.x = (vector1.y * vector2.z) - (vector1.z * vector2.y);
    v.y = (vector1.z * vector2.x) - (vector1.x * vector2.z);
    v.z = (vector1.x * vector2.y) - (vector1.y * vector2.x);
    return v;
}

//===================================================
// simulation parameters
//===================================================
var rootBigGM = Math.pow(2000.0, 1/2);
var planetMaxRadius = 20;
var planetCount = 10;
var axisWidth = 2;

// ------------------------------------------------------------------------------------------------
// geometry


var particle = function (width, height) {
    this.type = "particle";
    //this.gravity = -.05;
    //this.drag = .995;

    //this.radius = Math.random() * 20;
    //this.y = 18 * Math.random() - 9;
    //this.x = 18 * Math.random() - 9;
    //this.z = 18 * Math.random() - 9
    //this.max_v = 3;
    //this.x_v = Math.random() * 2 * this.max_v - 2 * this.max_v;
    //this.y_v = Math.random() * this.max_v;
    //this.z_v = Math.random() * 2 * this.max_v - 2 * this.max_v;
    //this.rx = 0;
    //this.ry = 0;
    //this.rz = 0;
    //this.rx_v = Math.random() / 10;
    //this.ry_v = Math.random() / 10;
    //this.rz_v = Math.random() / 10;

    this.hue = 180 * Math.random();
    this.y_max = (height * 0.8);// - (this.radius / 2) - 10;
    this.x_max = (width * 0.8);// - (this.radius / 2) - 10;
    this.z_max = (width * 0.8);// - (this.radius / 3) - 10;


    // generate direction vector to planet
    this.orbitalRadius = new pmaVector3(0,0,0);
    //this.orbitalRadius.x = (Math.random() * (2*this.x_max)) - this.x_max;
    //this.orbitalRadius.y = (Math.random() * (2*this.y_max)) - this.y_max;
    //this.orbitalRadius.z = (Math.random() * (2*this.z_max)) - this.z_max;
    this.orbitalRadius.x = Math.random() * (2*this.x_max);
    this.orbitalRadius.y = 0;                   // fixed to x-y plane version...
    this.orbitalRadius.z = 0;                   // fixed to x-y plane version...

    // generate another random vector, which with orbitalRadius defines the plane of the ecliptic
    this.planeVector = new pmaVector3(0,0,0);
    //this.planeVector.x = Math.random();
    //this.planeVector.y = Math.random();
    //this.planeVector.z = Math.random();
    this.planeVector.x = 1;                     // fixed to x-y plane version...
    this.planeVector.y = 1;
    this.planeVector.z = 0;

    // calculate unit normal vector to the plane of the ecliptic
    this.eclipticNormal = vectorCrossProduct(this.planeVector, this.orbitalRadius);
    var eclipticNormalMagnitude = vectorMagnitude(this.eclipticNormal);
    console.log("plane(%.3f,%.3f,%.3f) x orbRadius(%.3f,%.3f,%.3f) = eclipticNormal(%.3f,%.3f,%.3f) [mag %.3f]",
            this.planeVector.x, this.planeVector.y, this.planeVector.z, 
            this.orbitalRadius.x, this.orbitalRadius.y, this.orbitalRadius.z, 
            this.eclipticNormal.x, this.eclipticNormal.y, this.eclipticNormal.z, 
            eclipticNormalMagnitude);

    this.eclipticNormal = scalarMultiply(this.eclipticNormal, 1/eclipticNormalMagnitude);
    eclipticNormalMagnitude = vectorMagnitude(this.eclipticNormal);
    console.log("eclipticNormal(%.3f,%.3f,%.3f) [mag %.3f]",
            this.eclipticNormal.x, this.eclipticNormal.y, this.eclipticNormal.z, 
            eclipticNormalMagnitude);

    // scale normal vector to have |eclipticNormal| = |orbitalRadius|^(-3/2)
    // which after v = r x n will yield |orbitalVelocity| = |orbitalRadius|^(-1/2)
    // (this is the condition for a cicular orbit)
    eclipticNormalMagnitude = Math.pow(vectorMagnitude(this.orbitalRadius), -3/2);
    this.eclipticNormal = scalarMultiply(this.eclipticNormal, (eclipticNormalMagnitude * rootBigGM));
    eclipticNormalMagnitude = vectorMagnitude(this.eclipticNormal);
    console.log("eclipticNormal(%.3f,%.3f,%.3f) [mag %.3f]",
            this.eclipticNormal.x, this.eclipticNormal.y, this.eclipticNormal.z, 
            eclipticNormalMagnitude);

    // now we can find orbitalVelocity = orbitalRadius x eclipticNormal
    this.orbitalVelocity = vectorCrossProduct(this.orbitalRadius, this.eclipticNormal);
    console.log("orbitalVelocity(%.3f,%.3f,%.3f) [mag %.3f] [orbRadius mag = %.3f]",
            this.orbitalVelocity.x, this.orbitalVelocity.y, this.orbitalVelocity.z, 
            vectorMagnitude(this.orbitalVelocity), vectorMagnitude(this.orbitalRadius));

    // threejs stuff
    this.radius = planetMaxRadius * vectorMagnitude(this.orbitalRadius)/width;   // smaller planets in the middle
    //this.radius = Math.random() * 20;
    var geom = new THREE.SphereGeometry(this.radius, 20, 12);
    this.obj = new THREE.Mesh(
    geom,
    new THREE.MeshPhongMaterial({
        //color: Math.floor(Math.random() * 0x1000000),
        color: (Math.floor(Math.random() * 16) * Math.pow(2, 20)) + (Math.floor(Math.random() * 16) * Math.pow(2, 12)) + (Math.floor(Math.random() * 16) * Math.pow(2, 4)),
        specular: 0x333333,
        shininess: 100
    }));

    this.update = function () {
        this.orbitalRadius = vectorAdd(this.orbitalRadius,this.orbitalVelocity);           // new position vector
        this.orbitalVelocity = vectorCrossProduct(this.orbitalRadius,this.eclipticNormal); // new velocity vector

        // hue
        //this.hue += 1;
        //this.hue = this.hue % 360;

    }
}

// parent object (like a sub-scene)
var parent = new THREE.Object3D();

// ------------------------------------------------------------------------------------------------
// add axes
// from: http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/

function buildAxes( length ) {
    var axes = new THREE.Object3D();
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0xdddddd, false ) ); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0xdddddd, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0xdddddd, false ) ); // +Z
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0xdddddd, true ) ); // -Z
    return axes;

}

function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry(),
        mat; 

    if(dashed) {
            mat = new THREE.LineDashedMaterial({ linewidth: axisWidth, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
            mat = new THREE.LineBasicMaterial({ linewidth: axisWidth, color: colorHex });
    }

    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line( geom, mat, THREE.LinePieces );

    return axis;

}

axes = buildAxes( WIDTH/2 );
//PMA 
parent.add( axes );

// ------------------------------------------------------------------------------------------------
// add Bounding box
// BoundingBoxHelper(object, hex)
// object -- Object3D -- the object3D to show the world-axis-aligned boundingbox.
// hex -- (optional) hexadecimal value to define color ex:0x888888
// This creates an line object to the boundingbox.
// https://github.com/mrdoob/three.js/blob/master/src/extras/helpers/BoundingBoxHelper.js

var bounding_box = new THREE.BoundingBoxHelper(parent); // can be tied to scene
//var bounding_box = new THREE.BoundingBoxHelper( mesh ); // can be tied to mesh
bounding_box.update(); // render
//PMA parent.add(bounding_box);

// ------------------------------------------------------------------------------------------------
// add lots of boxes
// ported from http://codepen.io/brianarn/pen/whDHk

//PMA var balls = []; // An array of objects, each object has data for one bouncing ball.
var orbitData = [];

// generate n particles
for (var i = 0; i < planetCount; i++) {
    var p = new particle(WIDTH/2, HEIGHT/2);
    p.obj.position.set(p.x, p.y, p.z);
    p.obj.position.set(p.orbitalRadius.x, p.orbitalRadius.y, p.orbitalRadius.z);
    parent.add(p.obj);
    orbitData.push(p);
}

// add the Sun at the origin
var theSun = new THREE.Mesh(
    new THREE.SphereGeometry(50, 20, 12),
    new THREE.MeshPhongMaterial({
        color: 0xffff00,
        specular: 0,//0x333333,
        shininess: 0//100
    }));
parent.add(theSun);

scene.add(parent);


// ------------------------------------------------------------------------------------------------
// Light

var ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(10, 10, 10).normalize();
scene.add(directionalLight);

var directionalLight2 = new THREE.DirectionalLight(0xffffff);
directionalLight2.position.set(-10, -10, -10).normalize();
scene.add(directionalLight2);

// ------------------------------------------------------------------------------------------------
// add controls and GUI

var orbitControls = new function () {
        // add your params here
        this.zoom = 1000;
        this.x_rot = -0.20;
        this.y_rot = 0.01;
        this.z_rot = 0.01;
        this.p_x_rot_v = 0;
        this.p_y_rot_v = 0.0005;
        this.p_z_rot_v = 0;
        this.ambient_light = true;
        this.direction_light = true;
        this.direction_light_2 = true;
    }

gui.add(orbitControls, 'zoom', 50, 1500);
gui.add(orbitControls, 'x_rot', -0.50, 0.50);
gui.add(orbitControls, 'y_rot', -0.50, 0.50);
gui.add(orbitControls, 'z_rot', -1.00*Math.PI, 1.00*Math.PI);
gui.add(orbitControls, 'p_x_rot_v', 0.00, 0.50);
gui.add(orbitControls, 'p_y_rot_v', 0.00, 0.50);
gui.add(orbitControls, 'p_z_rot_v', 0.00, 0.50);


ambient_light = gui.add(orbitControls, 'ambient_light');
ambient_light.onChange(function (value) {
    if (value) {
        scene.add(ambientLight);
    } else {
        scene.remove(ambientLight);
    }
});

direction_light = gui.add(orbitControls, 'direction_light');
direction_light.onChange(function (value) {
    if (value) {
        scene.add(directionalLight);
    } else {
        scene.remove(directionalLight);
    }
});

direction_light_2 = gui.add(orbitControls, 'direction_light_2');
direction_light_2.onChange(function (value) {
    if (value) {
        scene.add(directionalLight2);
    } else {
        scene.remove(directionalLight2);
    }
});


// ------------------------------------------------------------------------------------------------
// draw loop

function draw() {

    // start stats recording
    stats.begin();

    for (var i = 0; i < planetCount; i++) {
        orbitData[i].update();
        orbitData[i].obj.position.set(orbitData[i].orbitalRadius.x, orbitData[i].orbitalRadius.y, orbitData[i].orbitalRadius.z);
    }

    parent.rotation.x += orbitControls.p_x_rot_v;
    parent.rotation.y += orbitControls.p_y_rot_v;
    parent.rotation.z += orbitControls.p_z_rot_v;

    camera.rotation.x = orbitControls.x_rot;
    camera.rotation.y = orbitControls.y_rot;
    camera.rotation.z = orbitControls.z_rot;

    camera.position.z = orbitControls.zoom;
    camera.position.y = 0.2 * orbitControls.zoom;

    // render scene
    renderer.render(scene, camera);

    // end stats recording
    stats.end();

    // run again
    requestAnimationFrame(draw);
}

// ------------------------------------------------------------------------------------------------
// start animation

requestAnimationFrame(draw);

// ------------------------------------------------------------------------------------------------