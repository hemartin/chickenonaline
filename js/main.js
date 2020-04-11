import { Session } from './session.js'
import { Graphics } from './graphics.js'

/**
 * Main entry point to the game. Initializes the game and shows
 * the initial splash screen.
 *
 * Contains main loop that uses JavaScript's requestAnimationFrame
 * method. Also contains all draw* methods that paint buttons and game
 * entities to the screen.
 *
 * @author Martin Hentschel
 */
window.onload = function () {
  // get DOM element
  const canvas = document.getElementById('c')
  const graphics = new Graphics(canvas)

  // initialize session, draws splash screen
  const session = new Session(graphics)

  // add listeners
  window.addEventListener('resize', function (e) {
    session.resizeCanvasInGame()
  })
  canvas.addEventListener('click', function (e) {
    session.onClick(e)
  })
  canvas.addEventListener('mousedown', function (e) {
    session.onMouseDown(e)
  })
  canvas.addEventListener('touchstart', function (e) {
    const t = e.touches[0]
    session.onMouseDown(t)
  })
  canvas.addEventListener('mouseup', function (e) {
    session.onMouseUp(e)
  })
  canvas.addEventListener('touchend', function (e) {
    const t = e.touches[0]
    session.onMouseUp(t)
  })
  canvas.addEventListener('mousemove', function (e) {
    session.onMouseMove(e)
  })
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault()
    const t = e.touches[0]
    session.onMouseMove(t)
  })
}
