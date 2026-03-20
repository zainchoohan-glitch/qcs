import terser from '@rollup/plugin-terser';

export default {
  input: 'assets/js/main.js',
  output: {
    file: 'assets/js/main.bundle.js',
    format: 'iife',
    name: 'ScanQRMain',
    sourcemap: false,
  },
  plugins: [
    terser({
      compress: true,
      mangle: true,
    }),
  ],
};
