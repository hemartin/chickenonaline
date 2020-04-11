import * as Constants from './constants.js'
import { Body, Vector } from '../lib/physicsplain-min.js'

/**
 * Body with eyes that are looking in specific direction.
 *
 * @author Martin Hentschel
 */
export class BodyWithEyes extends Body {
  constructor (id) {
    super(id)
    this.lateralFriction = Constants.LATERAL_FRICTION
    this.rotationalFriction = Constants.ROTATIONAL_FRICTION
    this.eyesDir = new Vector(-1, 3)
  }
}
