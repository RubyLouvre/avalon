import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'next/avalon.modern.js',
    format: 'umd',
    moduleName: 'avalon',
    plugins: [
        commonjs({
            ignoreGlobal: true
        })
    ],
    dest: 'dist/avalon.rollup.js'
 };  //rollup -c 
 
