// Extending this tutorial: https://software.intel.com/en-us/html5/hub/blogs/build-a-javascript-particle-system-in-200-lines

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var particleSize = 1;
var maxParticles = 10000;
var emissionRate = 4;
var objectSize = 3;

var enableGravity = false;

var mouseX;
var mouseY;

canvas.addEventListener("mousemove", updateMousePosition);
canvas.onclick = addField;
document.getElementById("reset").onclick = reset;

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype.add = function(vector) {
    this.x += vector.x;
    this.y += vector.y;
};

Vector.prototype.getMagnitude = function() {
    return Math.sqrt(this.x * this.x + this.y + this.y);
};

Vector.prototype.getAngle = function() {
    return Math.atan2(this.y, this.x);
};

// Get new vector from angle and magnitude.
Vector.fromAngle = function(angle, magnitude) {
    return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};

function Particle(point, velocity, acceleration) {
    this.position = point || new Vector(0, 0);
    this.velocity = velocity || new Vector(0, 0);
    this.acceleration = acceleration || new Vector(0, 0);
}

Particle.prototype.move = function() {
    // Add current acceleration to our current velocity.
    this.velocity.add(this.acceleration);

    // Playing around with gravity.
    if (enableGravity) {
        var gravity = new Vector(0, (this.position.x / 50000));
        this.velocity.add(gravity);
    }

    // Add current velocity to current position.
    this.position.add(this.velocity);
};

function Emitter(point, velocity, spread) {
    this.position = point; // Vector.
    this.velocity = velocity; // Vector.
    this.spread = spread || Math.PI / 32; // Possible angles = velocity +/- spread.
    this.drawColour = '#999'; // Allow us to tell them apart from fields.
}

Emitter.prototype.emitParticle = function() {
    // Use an angle randomized over the spread to get more of a spray.
    // var angle = degToRad(270+45)  + this.spread - (Math.random() * this.spread * 2);
    var angle = this.velocity.getAngle() + this.spread - (Math.random() * this.spread * 2);

    var magnitude = this.velocity.getMagnitude();
    var position = new Vector(this.position.x, this.position.y);
    var velocity = Vector.fromAngle(angle, magnitude);

    return new Particle(position, velocity);
};

function Field(point, mass) {
    this.position = point;
    this.setMass(mass);
}

Field.prototype.setMass = function(mass) {
    this.mass = mass || 100;
    this.drawColour = mass < 0 ? "#f00" : "#0f0";
};

var fields = [];

Particle.prototype.submitToFields = function(fields) {
    var totalAccelerationX = 0;
    var totalAccelerationY = 0;

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];

        // Find the difference between the particles and the field.
        var vectX = field.position.x - this.position.x;
        var vectY = field.position.y - this.position.y;

        var force = field.mass / Math.pow(vectX * vectX + vectY * vectY, 1.5);

        totalAccelerationX += vectX * force;
        totalAccelerationY += vectY * force;
    }

    this.acceleration = new Vector(totalAccelerationX, totalAccelerationY);
};

// Visualise the fields.
function drawCircle(object) {
    ctx.fillStyle = object.drawColour;
    ctx.beginPath();
    ctx.arc(object.position.x, object.position.y, objectSize, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

function loop() {
    clear();
    update();
    draw();
    queue();
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function update() {
    addNewParticles();
    plotParticles(canvas.width, canvas.height);
    updateFieldLocation();
}
var canvasRect = canvas.getBoundingClientRect();

function updateMousePosition(mouseEvent) {
    mouseX = mouseEvent.clientX - canvasRect.left;
    mouseY = mouseEvent.clientY - canvasRect.top;
}

function updateFieldLocation() {
    fields.pop(); // Remove the last field from mouse location.
    addField(); // Create new entry for current mouse location.
}

function addField() {
    fields.push(new Field(new Vector(mouseX, mouseY), -100));
}

var particles = [];
var emitters = [
    new Emitter(new Vector(100, 256), Vector.fromAngle(0, 2))
];

function addNewParticles() {
    if (particles.length > maxParticles) return;
    for (var i = 0; i < emitters.length; i++) {
        for (var j = 0; j < emissionRate; j++) {
            particles.push(emitters[i].emitParticle());
        }
    }
}

function plotParticles(boundsX, boundsY) {
    var currentParticles = [];

    for (var i = 0; i < particles.length; i++) {
        var particle = particles[i];
        var pos = particle.position;

        if (pos.x < 0 || pos.y < 0 || pos.x > boundsX || pos.y > boundsY) continue;

        // Update velocities and acceleration to account for the fields.
        particle.submitToFields(fields);

        particle.move();
        currentParticles.push(particle);
    }

    particles = currentParticles;
}

function reset() {
    fields = [];
    particles = [];
}

function draw() {
    drawParticles();
    fields.forEach(drawCircle);
    emitters.forEach(drawCircle);
}

function drawParticles() {
    ctx.fillStyle = 'rgb(0, 255, 255)';

    // For each particle.
    for (var i = 0; i < particles.length; i++) {
        var pos = particles[i].position;
        ctx.fillRect(pos.x, pos.y, particleSize, particleSize);
    }
}

function queue() {
    window.requestAnimationFrame(loop);
}

loop();