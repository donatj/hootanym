import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/options/options.ts',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [typescript()]
};
