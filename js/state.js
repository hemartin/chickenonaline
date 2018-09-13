/*
 * The state contains all entities and advances them, including resolving
 * collisions.
 * 
 * @author Martin Hentschel, @hemasail
 */

function State() {
    this.chicken = null;
    this.landingPoint = null; // body where chicken lands on
    this.handle = null; // end of line, controlled by player

    this.startTimeMs = 0;
    this.runTimeSecs = 0;
    this.lastJumpTimeMs = 0;
    this.nextBugTimeSecs = (Math.random() + 1.5);

    this.runTimeStr = '0.0'; // rounded to one comma

    // bugs push chicken left or right
    this.bugs = [];

    // gives each body a unique id
    this.nextBodyId = 0;
}

State.prototype.init = function() {
    // init chicken
    this.chicken = new Body(this)
        .setOrigin(Math.random() * 0.004 - 0.002, 0.55)
        .setDimension(0.15, 0.15)
        .setMass(1)
        .setGravity(GRAVITY)
        .finalize();
    
    // init line
    this.landingPoint = new Body(this)
        .setOrigin(0, -0.1)
        .setDimension(0.07, 0.03)
        .setMass(2)
        .setTargetAngle(0)
        .finalize();

    this.handle = new Vector(0, -0.3);
    this.startTimeMs = Date.now();
};

State.prototype.jump = function(secs) {
    // distance between chicken and landing, must be doubled but we add some slack
    var dist = this.chicken.origin.distanceFrom(this.landingPoint.origin) * 1.6;
    var now = Date.now();

    // only jump if chicken is close to line and last jump was more than 200ms ago
    if (dist < this.chicken.dimension.y + this.landingPoint.dimension.y
        && now - this.lastJumpTimeMs > 200) {
        var impulse = Math.min(0.3, Math.max(0.2, secs)) * 6;
        this.chicken.velocity.y += impulse;
        this.lastJumpTimeMs = now;
    }
}

State.prototype.addBug = function() {
    var x = (Math.random() < 0.5) ? -0.55 : 0.55;
    var y = Math.random() * 0.4 - 0.2;
    var start = new Vector(x, y);

    var vel = new Vector(this.chicken.origin.x, this.chicken.origin.y)
        .subtract(start)
        .normalize()
        .scale(0.4);

    var bug = new Body(this)
        .setOrigin(x, y)
        .setDimension(0.1, 0.1)
        .setMass(0.5)
        .setVelocity(vel.x, vel.y)
        .setAngularVelocity((Math.random() * 4) + 2)
        .setGravity(GRAVITY / 4)
        .finalize();

    this.bugs.push(bug);
    this.nextBugTimeSecs = this.runTimeSecs + (Math.random() + 1.5);
}

State.prototype.advance = function (timestep) {
    // set target of landing point
    var t = new Vector(this.handle.x, this.handle.y).scale(0.25)
    this.landingPoint.setTarget(t.x, t.y);

    // check for collisions
    var collisions = this.collide(timestep);

    // apply forces
    this.chicken.applyForces(timestep);
    this.landingPoint.applyForces(timestep);

    // apply impulses
    collisions.forEach(function (collision) {
        collision.apply();
    });

    // advance bodies
    this.chicken.advance(timestep);
    this.landingPoint.advance(timestep);
    this.bugs.forEach(function(bug)  {
       bug.advance(timestep); 
    });

    // add bug if necessary
    if (this.nextBugTimeSecs < this.runTimeSecs) {
        this.addBug();
    }

    // remove bugs that are out of bounds
    this.bugs = this.bugs.filter(function(bug) {
        return !outOfBounds(bug);
    });
    
    // chicken looks at handle
    this.chicken.eyesDir.set(this.handle)
        .subtract(this.chicken.origin);

    // bugs look at chicken
    var c = this.chicken;
    this.bugs.forEach(function(bug) {
        bug.eyesDir.set(c.origin);
    });

    // set new run time
    this.runTimeSecs += timestep;
    this.runTimeStr = (this.runTimeSecs).toFixed(1);
};

State.prototype.collide = function (timestep) {
    var collisions = [];

    // collide chicken with line
    var newCollision = Body_collide(this, this.chicken, this.landingPoint, timestep);
    if (newCollision !== null) {
        collisions.push(newCollision);
    }

    // collide bugs with chicken
    var t = this;
    var c = this.chicken;
    this.bugs.forEach(function(bug) {
        newCollision = Body_collide(t, c, bug, timestep);
        if (newCollision !== null) {
            collisions.push(newCollision);
        }
    });

    return Collision_mergeCollisions(collisions);
};

/**
 * Tests for out of bounds, except for upper edge. Bodies may overshoot and
 * get pulled back by gravity.
 */
function outOfBounds(body) {
    var bodyWidth = body.dimension.x;
    var bodyHeight = body.dimension.y;
    return body.origin.x + bodyWidth < -CANVAS_WIDTH / 2
        || body.origin.x - bodyWidth > CANVAS_WIDTH / 2
        || body.origin.y + bodyHeight < -CANVAS_HEIGHT / 2;
}