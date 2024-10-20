import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/content.ts',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [typescript()]
};
