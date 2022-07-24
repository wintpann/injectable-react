import { terser } from "rollup-plugin-terser";
import { peerDependencies } from './package.json';

export default [
    {
        input: 'src/core/index.js',
        output: {
            file: 'dist/index.js',
            format: 'esm'
        },
        plugins: [
            terser(),
        ],
        external: Object.keys(peerDependencies),
    }
];