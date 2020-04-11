import { terser } from 'rollup-plugin-terser'

export default {
  input: 'js/main.js',
  plugins: [terser()],
  output: {
    file: 'col.js',
    format: 'esm'
  }
}
