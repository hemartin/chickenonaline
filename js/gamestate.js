import * as Constants from './constants.js'
import { BodyWithEyes } from './bodywitheyes.js'
import { Body, State, Vector } from '../lib/physicsplain-min.js'

/**
 * The state contains all entities and advances them, including resolving
 * collisions.
 *
 * @author Martin Hentschel
 */
export class GameState extends State {
  constructor () {
    super()
    this.restitution = Constants.RESTITUTION

    // chicken
    this.chicken = new BodyWithEyes(0)
      .setOrigin(Math.random() * 0.004 - 0.002, 0.55)
      .setDimension(0.15, 0.15)
      .setMass(1)
      .setForce(0, -Constants.GRAVITY)
      .finalize()

    // body where chicken lands on
    this.landingBar = new Body(1)
      .setOrigin(0, -0.1)
      .setDimension(0.07, 0.03)
      .setMass(2)
      .setTargetAngle(0)
      .finalize()
    this.landingBar.lateralFriction = Constants.LATERAL_FRICTION
    this.landingBar.rotationalFriction = Constants.ROTATIONAL_FRICTION

    // end of line, controlled by player
    this.handle = new Vector(0, -0.3)

    this.startTimeMs = 0
    this.runTimeSecs = 0
    this.lastJumpTimeMs = 0
    this.nextBugTimeSecs = Math.random() + 1.5

    this.runTimeStr = '0.0' // rounded to one comma

    // bugs push chicken left or right
    this.bugs = []
    this.nextBugId = 2

    // gives each body a unique id
    this.nextBodyId = 0
  }

  /**
   * @return{Generator} All moving bodies as an iterator.
   */
  * getMovingBodies () {
    yield this.chicken
    yield this.landingBar
    yield * this.bugs
  }

  /**
   * @return{Generator} No fixed bodies in this game.
   */
  * getFixedBodies () {}

  /**
   * Before advancing bodies, sets target of landing point to 1/4th of distance
   * to handle.
   *
   * @param {Number} now current timestamp
   */
  preAdvance (now) {
    if (this.startTimeMs === 0) {
      this.startTimeMs = now
    }

    // set target of landing point
    const t = new Vector(this.handle.x, this.handle.y).scale(0.25)
    this.landingBar.setTarget(t.x, t.y)
  }

  /**
   * After advancing bodies, adds and removes bugs and adjusts eyes of chicken
   * and bugs.
   *
   * @param {Number} now current timestamp
   */
  postAdvance (now) {
    // add bug if necessary
    if (this.nextBugTimeSecs < this.runTimeSecs) {
      this.addBug()
    }

    // remove bugs that are out of bounds
    this.bugs = this.bugs.filter(function (bug) {
      return !GameState.outOfBounds(bug)
    })

    // chicken looks at handle
    this.chicken.eyesDir.set(this.handle).subtract(this.chicken.origin)

    // bugs look at chicken
    for (const bug of this.bugs) {
      bug.eyesDir.set(this.chicken.origin)
    }

    // set new run time
    this.runTimeSecs = (now - this.startTimeMs) / 1000
    this.runTimeStr = this.runTimeSecs.toFixed(1)
  }

  /**
   * Tests if two bodies should collide:
   * 1.) Collide chicken with landing point and bugs.
   * 2.) Don't collide landing bar with bugs.
   * 3.) Collide bugs with each other.
   */
  collideBodies (body1, body2) {
    if (body1.id === Constants.CHICKEN_ID) return true
    if (body2.id === Constants.LANDING_BAR_ID) return false
    return true
  }

  /**
   * Adds a bug to the list of bugs.
   */
  addBug () {
    const x = Math.random() < 0.5 ? -0.55 : 0.55
    const y = Math.random() * 0.4 - 0.2
    const start = new Vector(x, y)

    const vel = new Vector(this.chicken.origin.x, this.chicken.origin.y)
      .subtract(start)
      .normalize()
      .scale(0.4)

    const bug = new BodyWithEyes(this.nextBugId++)
      .setOrigin(x, y)
      .setDimension(0.1, 0.1)
      .setMass(0.5)
      .setVelocity(vel.x, vel.y)
      .setAngularVelocity(Math.random() * 4 + 2)
      .finalize()
    bug.lateralFriction = 0
    bug.rotationalFriction = 0

    this.bugs.push(bug)
    this.nextBugTimeSecs = this.runTimeSecs + (Math.random() + 1.5)
  }

  /**
   * Jumps chicken. Height of jump depends on time duration between mouse down
   * and mouse up events.
   *
   * @param {Number} secs duration between mouse down and mouse up events in
   * seconds
   */
  jump (secs) {
    // distance between chicken and landing, must be doubled but we add some slack
    const dist = this.chicken.origin.distanceFrom(this.landingBar.origin) * 1.6
    const now = Date.now()

    // only jump if chicken is close to line and last jump was more than 200ms ago
    if (
      dist < this.chicken.dimension.y + this.landingBar.dimension.y &&
      now - this.lastJumpTimeMs > 200
    ) {
      const impulse = Math.min(0.3, Math.max(0.2, secs)) * 6
      this.chicken.velocity.y += impulse
      this.lastJumpTimeMs = now
    }
  }

  /**
   * Tests for out of bounds, except for upper edge. Bodies may overshoot and
   * get pulled back by gravity.
   */
  static outOfBounds (body) {
    const bodyWidth = body.dimension.x
    const bodyHeight = body.dimension.y
    return (
      body.origin.x + bodyWidth < -Constants.CANVAS_WIDTH / 2 ||
      body.origin.x - bodyWidth > Constants.CANVAS_WIDTH / 2 ||
      body.origin.y + bodyHeight < -Constants.CANVAS_HEIGHT / 2
    )
  }
}
