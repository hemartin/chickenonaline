import { Vector } from '../lib/physicsplain-min.js'

/**
 * A button.
 *
 * @author Martin Hentschel
 */
export class Button {
  constructor (text) {
    this.text = text
    this.origin = new Vector(0, 0)
    this.dimension = new Vector(0.38, 0.11)
    this.isDown = false
  }

  clicked (click) {
    const cx = click.x
    return (
      cx >= this.origin.x - this.dimension.x / 2 &&
      cx <= this.origin.x + this.dimension.x / 2 &&
      click.y >= this.origin.y - this.dimension.y / 2 &&
      click.y <= this.origin.y + this.dimension.y / 2
    )
  }

  down (click) {
    const cx = click.x
    this.isDown =
      cx >= this.origin.x - this.dimension.x / 2 &&
      cx <= this.origin.x + this.dimension.x / 2 &&
      click.y >= this.origin.y - this.dimension.y / 2 &&
      click.y <= this.origin.y + this.dimension.y / 2
  }

  up (click) {
    this.isDown = false
  }
}
