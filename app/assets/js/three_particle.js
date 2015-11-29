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
camera.rotation.set(0, 0, 0); //(-.2, 0, 0);
scene.add(camera);

// ------------------------------------------------------------------------------------------------
// add FPS using Stats.js

var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms
document.getElementById("three_particle_container").appendChild(stats.domElement);

var gui = new dat.GUI({ autoPlace: false });
document.getElementById('three_particle_container').appendChild(gui.domElement);


//===================================================
// gravity and drag parameters
//===================================================
var gravity = 0.5;                          // gravity magnitude
var gravityAngle = (1/2) * Math.PI;         // initially straight down (radians)
//var gravityAngleIncrement = 0.002 * (2 * Math.PI);    // gravity rotation each frame (radians)  
var gravityAngleIncrement = 0;              // zero for no gravity whirlpool
var drag = 0.990; // 0.995
var areaDragFactor = 0.00001;   // 0 for no effect; 0.00001 or similar 
                                // for bouncy little guys + sluggish big fellas



// ------------------------------------------------------------------------------------------------
// geometry

var particle = function (width, height) {
    this.type = "particle";
    this.gravity = -.05;
    this.drag = .995;

    this.radius = Math.random() * 20;
    this.y = 18 * Math.random() - 9;
    this.x = 18 * Math.random() - 9;
    this.z = 18 * Math.random() - 9;

    this.max_v = 3;

    this.x_v = Math.random() * 2 * this.max_v - 2 * this.max_v;
    this.y_v = Math.random() * this.max_v;
    this.z_v = Math.random() * 2 * this.max_v - 2 * this.max_v;

    this.rx = 0;
    this.ry = 0;
    this.rz = 0;
    this.rx_v = Math.random() / 10;
    this.ry_v = Math.random() / 10;
    this.rz_v = Math.random() / 10;

    this.hue = 180 * Math.random();
    this.y_max = height - (this.radius / 2) - 10;
    this.x_max = width - (this.radius / 2) - 10;
    this.z_max = width - (this.radius / 2) - 10;

    // threejs stuff
    var geom = new THREE.SphereGeometry(this.radius, 20, 12);
    this.obj = new THREE.Mesh(
    geom,
    new THREE.MeshPhongMaterial({
        color: Math.floor(Math.random() * 0x1000000),
        specular: 0x333333,
        shininess: 100
    }));

    this.constrain_x = function () {

        // x
        if (this.x >= this.x_max) {
            this.x = this.x_max;
            this.x_v *= -1;
        }

        if (this.x <= -this.x_max) {
            this.x = -this.x_max;
            this.x_v *= -1;
        }
    }
    this.constrain_y = function () {
        // y
        if (this.y >= this.y_max) {
            this.y = this.y_max;
            this.y_v *= -1;
        }

        if (this.y <= -this.y_max) {
            this.y = -this.y_max;
            this.y_v *= -1;
        }

    }

    this.constrain_z = function () { //z
        // z
        if (this.z >= this.z_max) {
            this.z = this.z_max;
            this.z_v *= -1;
        }

        if (this.z <= -this.z_max) {
            this.z = -this.z_max;
            this.z_v *= -1;
        }

    }

    this.update = function () {
        // y direction
        if ((Math.abs(this.y_v) > 0)) {

            this.y_v *= this.drag;
            this.y_v += this.gravity;
            this.y += this.y_v;
            this.constrain_y();

        }

        // x direction
        if ((Math.abs(this.x_v) > 0)) {

            this.x_v *= this.drag;
            this.x += this.x_v;
            this.constrain_x();
        }

        // z direction                        //z
        if ((Math.abs(this.z_v) > 0)) {

            this.z_v *= this.drag;
            this.z += this.z_v;
            this.constrain_z();
        }

        // hue
        this.hue += 1;
        this.hue = this.hue % 360;

        // rotate
        this.rx += this.rx_v;
        this.ry += this.ry_v;
        this.rz += this.rz_v;
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
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z
    return axes;

}

function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry(),
        mat; 

    if(dashed) {
            mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
            mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
    }

    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line( geom, mat, THREE.LinePieces );

    return axis;

}

axes = buildAxes( WIDTH/2 );
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
parent.add(bounding_box);

// ------------------------------------------------------------------------------------------------
// add lots of boxes
// ported from http://codepen.io/brianarn/pen/whDHk

//PMA var balls = []; // An array of objects, each object has data for one bouncing ball.
var data = [];
var n = 1;//200;





for (var i = 0; i < n; i++) {
    var p = new particle(WIDTH/2, HEIGHT/2);
    p.obj.position.set(p.x, p.y, p.z);
    parent.add(p.obj);
    data.push(p);
}

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

var controls = new function () {
        // add your params here
        this.x_rot = 0.02;
        this.y_rot = 0.02;
        this.z_rot = 0.02;
        this.p_x_rot_v = 0;
        this.p_y_rot_v = 0.01;
        this.p_z_rot_v = 0;
        this.ambient_light = true;
        this.direction_light = true;
        this.direction_light_2 = true;
    }

gui.add(controls, 'x_rot', 0, 2*Math.PI);
gui.add(controls, 'y_rot', 0, 2*Math.PI);
gui.add(controls, 'z_rot', 0, 2*Math.PI);
gui.add(controls, 'p_x_rot_v', 0, 0.5);
gui.add(controls, 'p_y_rot_v', 0, 0.5);
gui.add(controls, 'p_z_rot_v', 0, 0.5);


ambient_light = gui.add(controls, 'ambient_light');
ambient_light.onChange(function (value) {
    if (value) {
        scene.add(ambientLight);
    } else {
        scene.remove(ambientLight);
    }
});

direction_light = gui.add(controls, 'direction_light');
direction_light.onChange(function (value) {
    if (value) {
        scene.add(directionalLight);
    } else {
        scene.remove(directionalLight);
    }
});

direction_light_2 = gui.add(controls, 'direction_light_2');
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

    for (var i = 0; i <n; i++) {
        data[i].update();
        data[i].obj.position.set(data[i].x, data[i].y, data[i].z);
    }

    parent.rotation.x += controls.p_x_rot_v;
    parent.rotation.y += controls.p_y_rot_v;
    parent.rotation.z += controls.p_z_rot_v;

    camera.rotation.x = controls.x_rot;
    camera.rotation.y = controls.y_rot;
    camera.rotation.z = controls.z_rot;

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