import * as Constants from './constants.js'
import { Vector } from '../lib/physicsplain-min.js'

/**
 * Draws things on the canvas.
 *
 * @author Martin Hentschel
 */
export class Graphics {
  constructor (canvas) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.transformX = 0
    this.transformY = 0
    this.resizeCanvas()
  }

  /**
   * Resizes all canvases to fit screen width in case browser window is thinner
   * than canvasWidth.
   */
  resizeCanvas () {
    const w = window.innerWidth
    const h = window.innerHeight
    if (this.canvas.width !== w) {
      this.canvas.width = w
      this.canvas.height = h
    }
    if (this.canvas.width > this.canvas.height) {
      this.transformX =
        (this.canvas.height / Constants.CANVAS_HEIGHT) * Constants.CANVAS_WIDTH
      this.transformY = this.canvas.height
    } else {
      this.transformX = this.canvas.width
      this.transformY =
        (this.canvas.width / Constants.CANVAS_WIDTH) * Constants.CANVAS_HEIGHT
    }
  }

  drawGame (session, includeBodiesAndText, lightColors) {
    // clear whole canvas
    this.context.resetTransform()
    this.context.fillStyle = Constants.OUTSIDE_BACKGROUND
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.setDrawTransform()

    // clear game area
    this.context.fillStyle = Constants.BACKGROUND
    this.context.fillRect(
      -Constants.CANVAS_WIDTH / 2,
      -Constants.CANVAS_HEIGHT / 2,
      Constants.CANVAS_WIDTH,
      Constants.CANVAS_HEIGHT
    )
    const colors = lightColors ? Constants.LIGHT_COLORS : Constants.COLORS

    if (includeBodiesAndText) {
      // draw bodies
      this.drawLine(
        session.gameState.landingBar,
        session.gameState.handle,
        colors
      )
      for (const bug of session.gameState.bugs) {
        this.drawBug(bug, colors)
      }

      // draw text
      this.drawTextAlign(
        'score ' + session.score,
        -0.48,
        0.445,
        0.05,
        Constants.FONT_ALIGN_LEFT
      )
      this.drawTextAlign(
        'high score ' + session.highScore,
        -0.48,
        0.405,
        0.03,
        Constants.FONT_ALIGN_LEFT
      )
      this.drawTextAlign(
        'beat ' + session.lastRunTimeStr + 's',
        0.48,
        0.445,
        0.05,
        Constants.FONT_ALIGN_RIGHT
      )
      this.drawTextAlign(
        'multiplier ' + session.multiplier + 'x',
        0.48,
        0.405,
        0.03,
        Constants.FONT_ALIGN_RIGHT
      )
      this.drawText(session.gameState.runTimeStr + 's', 0, 0.26, 0.1)

      // draw chicken above text
      this.drawChicken(session.gameState.chicken, colors)
    }

    // draw out of bounds
    this.context.fillStyle = Constants.OUTSIDE_BACKGROUND
    this.context.fillRect(-1, -Constants.CANVAS_HEIGHT / 2, 2, -1)
    this.context.fillRect(-1, Constants.CANVAS_HEIGHT / 2, 2, 1)
    this.context.fillRect(-Constants.CANVAS_WIDTH / 2, -1, -1, 2)
    this.context.fillRect(Constants.CANVAS_WIDTH / 2, -1, 1, 2)
  }

  drawLine (landing, handle, colors) {
    const origin = new Vector(0, 0)

    // origin radius and handle radius
    const or = 0.01
    const hr = 0.1

    // left landing and right landing
    const LL = new Vector(landing.cornerX[1], landing.cornerY[1])
    const RL = new Vector(landing.cornerX[0], landing.cornerY[0])

    // compute tangent between left landing and left origin
    let LO2LL = new Vector(origin.x, origin.y).subtract(LL)
    const lo2Len = LO2LL.length()
    const lo2Ang = Math.asin(or / lo2Len)
    LO2LL.normalize()
      .rotate(lo2Ang)
      .scale(Math.sqrt(lo2Len * lo2Len - or * or))
      .add(LL)

    // compute tangent between right landing and right origin
    let RO2RL = new Vector(origin.x, origin.y).subtract(RL)
    const ro2Len = RO2RL.length()
    const ro2Ang = Math.asin(or / ro2Len)
    RO2RL.normalize()
      .rotate(-ro2Ang)
      .scale(Math.sqrt(ro2Len * ro2Len - or * or))
      .add(RL)

    // compute tangent between left landing and left handle
    let LH2LL = new Vector(handle.x, handle.y).subtract(LL)
    const lh2Len = LH2LL.length()
    const lh2Ang = Math.asin(hr / lh2Len)
    LH2LL.normalize()
      .rotate(-lh2Ang)
      .scale(Math.sqrt(lh2Len * lh2Len - hr * hr))
      .add(LL)

    // compute tangent between right landing and right handle
    let RH2RL = new Vector(handle.x, handle.y).subtract(RL)
    const rh2Len = RH2RL.length()
    const rh2Ang = Math.asin(hr / rh2Len)
    RH2RL.normalize()
      .rotate(rh2Ang)
      .scale(Math.sqrt(rh2Len * rh2Len - hr * hr))
      .add(RL)

    // sort by x
    if (RH2RL.x < LH2LL.x) {
      const tmp = RH2RL
      RH2RL = LH2LL
      LH2LL = tmp
    }
    if (RO2RL.x < LO2LL.x) {
      const tmp = RO2RL
      RO2RL = LO2LL
      LO2LL = tmp
    }

    // draw origin
    this.context.fillStyle = Constants.CHICKEN_WHITE
    this.context.beginPath()
    this.context.arc(origin.x, origin.y, or, 0, 2 * Math.PI, false)
    this.context.fill()

    // draw 1st line: from origin to landing and back
    this.context.fillStyle = Constants.CHICKEN_WHITE // colors[2];
    this.context.beginPath()
    this.context.moveTo(LO2LL.x, LO2LL.y)
    this.context.lineTo(landing.cornerX[1], landing.cornerY[1])
    this.context.lineTo(landing.cornerX[0], landing.cornerY[0])
    this.context.lineTo(RO2RL.x, RO2RL.y)
    this.context.closePath()
    this.context.fill()

    // draw 2nd line: from landing to handle and back
    this.context.fillStyle = Constants.LIGHT_COLORS[7]
    this.context.beginPath()
    this.context.moveTo(landing.cornerX[1], landing.cornerY[1])
    this.context.lineTo(LH2LL.x, LH2LL.y)
    this.context.lineTo(RH2RL.x, RH2RL.y)
    this.context.lineTo(landing.cornerX[0], landing.cornerY[0])
    this.context.closePath()
    this.context.fill()

    // draw handle
    this.context.fillStyle = Constants.CHICKEN_WHITE
    this.context.beginPath()
    this.context.arc(handle.x, handle.y, hr, 0, 2 * Math.PI, false)
    this.context.fill()
  }

  drawBug (body, colors) {
    // full body
    this.context.fillStyle = colors[2]
    this.context.beginPath()
    this.context.moveTo(body.cornerX[0], body.cornerY[0])
    this.context.lineTo(body.cornerX[1], body.cornerY[1])
    this.context.lineTo(body.cornerX[2], body.cornerY[2])
    this.context.lineTo(body.cornerX[3], body.cornerY[3])
    this.context.closePath()
    this.context.fill()

    // half body
    const p1x = body.cornerX[0] + (body.cornerX[1] - body.cornerX[0]) * 0.5
    const p1y = body.cornerY[0] + (body.cornerY[1] - body.cornerY[0]) * 0.5
    const p3x = body.cornerX[2] + (body.cornerX[3] - body.cornerX[2]) * 0.5
    const p3y = body.cornerY[2] + (body.cornerY[3] - body.cornerY[2]) * 0.5
    this.context.fillStyle = colors[1]
    this.context.beginPath()
    this.context.moveTo(p1x, p1y)
    this.context.lineTo(body.cornerX[1], body.cornerY[1])
    this.context.lineTo(body.cornerX[2], body.cornerY[2])
    this.context.lineTo(p3x, p3y)
    this.context.closePath()
    this.context.fill()

    // face
    const diffx = (p1x - body.origin.x) * 0.7
    const diffy = (p1y - body.origin.y) * 0.7
    const verx = body.origin.x + diffx
    const very = body.origin.y + diffy
    const p2x = body.cornerX[1] + (body.cornerX[2] - body.cornerX[1]) * 0.5
    const p2y = body.cornerY[1] + (body.cornerY[2] - body.cornerY[1]) * 0.5
    const p4x = body.cornerX[3] + (body.cornerX[0] - body.cornerX[3]) * 0.5
    const p4y = body.cornerY[3] + (body.cornerY[0] - body.cornerY[3]) * 0.5
    this.context.fillStyle = colors[3]
    this.context.beginPath()
    this.context.moveTo(body.cornerX[0], body.cornerY[0])
    this.context.lineTo(p4x + diffx, p4y + diffy)
    this.context.lineTo(p2x + diffx, p2y + diffy)
    this.context.lineTo(body.cornerX[1], body.cornerY[1])
    this.context.closePath()
    this.context.fill()
    this.context.beginPath()
    this.context.arc(
      verx,
      very,
      body.dimension.x / 2,
      body.angle - Math.PI,
      body.angle,
      false
    )
    this.context.fill()

    // eyes
    const elx = body.origin.x + (body.cornerX[1] - body.origin.x) * 0.5
    const ely = body.origin.y + (body.cornerY[1] - body.origin.y) * 0.5
    const erx = body.origin.x + (body.cornerX[0] - body.origin.x) * 0.5
    const ery = body.origin.y + (body.cornerY[0] - body.origin.y) * 0.5
    const elx2 = elx + (erx - elx) * 0.14
    const ely2 = ely + (ery - ely) * 0.14
    const erx2 = erx + (elx - erx) * 0.14
    const ery2 = ery + (ely - ery) * 0.14
    this.drawEyeWhite(body, elx2, ely2, body.dimension.x * 0.22)
    this.drawEyeWhite(body, erx2, ery2, body.dimension.x * 0.22)
    this.drawEyeRest(body, elx2, ely2, body.dimension.x * 0.22)
    this.drawEyeRest(body, erx2, ery2, body.dimension.x * 0.22)
  }

  drawChicken (body, colors) {
    // light full body
    this.context.fillStyle = colors[6]
    this.context.beginPath()
    this.context.moveTo(body.cornerX[0], body.cornerY[0])
    this.context.lineTo(body.cornerX[1], body.cornerY[1])
    this.context.lineTo(body.cornerX[2], body.cornerY[2])
    this.context.lineTo(body.cornerX[3], body.cornerY[3])
    this.context.closePath()
    this.context.fill()

    // p1 is half way between upper right and lower right
    const p1x = body.cornerX[0] + (body.cornerX[3] - body.cornerX[0]) * 0.5
    const p1y = body.cornerY[0] + (body.cornerY[3] - body.cornerY[0]) * 0.5
    // p2 is half way between upper left and lower left
    const p2x = body.cornerX[1] + (body.cornerX[2] - body.cornerX[1]) * 0.5
    const p2y = body.cornerY[1] + (body.cornerY[2] - body.cornerY[1]) * 0.5
    // p3 is half way between lower left and lower right
    const p3x = body.cornerX[2] + (body.cornerX[3] - body.cornerX[2]) * 0.5
    const p3y = body.cornerY[2] + (body.cornerY[3] - body.cornerY[2]) * 0.5

    // pecker
    this.context.fillStyle = colors[5]
    this.context.beginPath()
    this.context.moveTo(p1x, p1y)
    this.context.lineTo(p2x, p2y)
    this.context.lineTo(p3x, p3y)
    this.context.closePath()
    this.context.fill()

    this.context.fillStyle = colors[8]
    this.context.beginPath()
    this.context.moveTo(p1x, p1y)
    this.context.lineTo(body.origin.x, body.origin.y)
    this.context.lineTo(p3x, p3y)
    this.context.closePath()
    this.context.fill()

    // p4 is half way between upper left and upper right
    const p4x = body.cornerX[0] + (body.cornerX[1] - body.cornerX[0]) * 0.5
    const p4y = body.cornerY[0] + (body.cornerY[1] - body.cornerY[0]) * 0.5
    // p5 is top of the tip, outside of body
    const p5x = body.origin.x + (p4x - body.origin.x) * 1.4
    const p5y = body.origin.y + (p4y - body.origin.y) * 1.4

    // "hat"
    this.context.fillStyle = colors[1]
    this.context.beginPath()
    this.context.moveTo(body.cornerX[0], body.cornerY[0])
    this.context.lineTo(body.cornerX[1], body.cornerY[1])
    this.context.lineTo(p5x, p5y)
    this.context.closePath()
    this.context.fill()

    // eyes
    const elx = body.origin.x + (body.cornerX[1] - body.origin.x) * 0.5
    const ely = body.origin.y + (body.cornerY[1] - body.origin.y) * 0.5
    const erx = body.origin.x + (body.cornerX[0] - body.origin.x) * 0.5
    const ery = body.origin.y + (body.cornerY[0] - body.origin.y) * 0.5
    const elx2 = elx + (erx - elx) * 0.14
    const ely2 = ely + (ery - ely) * 0.14
    const erx2 = erx + (elx - erx) * 0.14
    const ery2 = ery + (ely - ery) * 0.14
    this.drawEyeWhite(body, elx2, ely2, body.dimension.x * 0.2)
    this.drawEyeWhite(body, erx2, ery2, body.dimension.x * 0.2)
    this.drawEyeRest(body, elx2, ely2, body.dimension.x * 0.2)
    this.drawEyeRest(body, erx2, ery2, body.dimension.x * 0.2)
  }

  drawEyeWhite (body, x, y, radius) {
    const whiteRadius = radius

    this.context.fillStyle = Constants.CHICKEN_WHITE
    this.context.beginPath()
    this.context.arc(x, y, whiteRadius, 0, 2 * Math.PI, false)
    this.context.fill()
  }

  drawEyeRest (body, x, y, radius) {
    const whiteRadius = radius

    this.context.fillStyle = Constants.FONT_COLOR
    const darkRadius = 0.6 * whiteRadius

    // dir is direction in which eyes are looking
    // - if target defined: look to target
    // - if target not define: default
    const dir = new Vector(body.eyesDir.x, body.eyesDir.y)
    dir.normalize().scale(radius * 0.2)
    x += dir.x
    y += dir.y
    this.context.beginPath()
    this.context.arc(x, y, darkRadius, 0, 2 * Math.PI, false)
    this.context.fill()

    this.context.fillStyle = Constants.CHICKEN_WHITE
    const glowRadius = 0.2 * whiteRadius
    x += radius * 0.2
    y += radius * 0.2
    this.context.beginPath()
    this.context.arc(x, y, glowRadius, 0, 2 * Math.PI, false)
    this.context.fill()
  }

  drawButton (button) {
    let ulx = button.origin.x - button.dimension.x / 2
    let uly = button.origin.y + button.dimension.y / 2
    const offset = 0.02
    const diff = button.isDown ? offset : 0

    // fill, lighter color
    this.context.fillStyle = Constants.COLORS[8]
    this.context.beginPath()
    this.context.moveTo(ulx, uly)
    this.context.lineTo(ulx + button.dimension.x, uly)
    this.context.lineTo(ulx + button.dimension.x, uly - button.dimension.y)
    this.context.lineTo(ulx, uly - button.dimension.y)
    this.context.closePath()
    this.context.fill()

    // fill, darker color
    ulx += diff
    uly -= diff
    this.context.fillStyle = Constants.COLORS[9]
    this.context.beginPath()
    this.context.moveTo(ulx, uly)
    this.context.lineTo(ulx + button.dimension.x - offset, uly)
    this.context.lineTo(
      ulx + button.dimension.x - offset,
      uly - button.dimension.y
    )
    this.context.lineTo(ulx, uly - button.dimension.y)
    this.context.closePath()
    this.context.fill()

    // text
    this.drawTextAlignC(
      button.text,
      button.origin.x + diff,
      button.origin.y - button.dimension.y * 0.22 - diff,
      button.dimension.y * 0.67,
      Constants.FONT_ALIGN_CENTER,
      Constants.CHICKEN_WHITE
    )
  }

  drawText (text, x, y, size) {
    this.drawTextAlign(text, x, y, size, Constants.FONT_ALIGN_CENTER)
  }

  drawTextAlign (text, x, y, size, align) {
    this.drawTextAlignC(text, x, y, size, align, Constants.FONT_COLOR)
  }

  drawTextAlignC (text, x, y, size, align, color) {
    this.context.setTransform(
      Constants.CANVAS_WIDTH / 1.1,
      0,
      0,
      Constants.CANVAS_HEIGHT,
      this.canvas.width / 2,
      this.canvas.height / 2
    )

    const textHeight = this.transformY * size
    this.context.fillStyle = color
    this.context.font = textHeight + Constants.FONT
    this.context.textAlign = align
    this.context.fillText(text, x * this.transformY * 1.1, -y * this.transformY)

    this.setDrawTransform()
  }

  setDrawTransform () {
    this.context.setTransform(
      this.transformX,
      0,
      0,
      -this.transformY,
      this.canvas.width / 2,
      this.canvas.height / 2
    )
  }

  /**
   * Translates physical coord on canvas into logical coord in game.
   */
  x (tx) {
    const x = (tx - this.canvas.width / 2) / this.transformX
    return x
  }

  y (ty) {
    const y = -(ty - this.canvas.height / 2) / this.transformY
    return y
  }

  toClickVector (e) {
    const clientRect = this.canvas.getBoundingClientRect()
    const clickX = this.x(e.clientX - clientRect.left)
    const clickY = this.y(e.clientY - clientRect.top)
    return new Vector(clickX, clickY)
  }
}
