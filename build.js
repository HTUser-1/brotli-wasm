const shell = require('shelljs');

if (!shell.which('wasm-pack')) {
    console.error("Run npm install to install all dependencies first");
}

// Clean up any existing built content:
shell.rm('-rf', 'dist');
shell.rm('-rf', 'pkg.*');
shell.mkdir('dist');

// Create the bundler output
shell.rm('-rf', 'pkg');
shell.exec('wasm-pack build --target bundler');
shell.mv('pkg', 'pkg.bundler');

// Create the node output
shell.rm('-rf', 'pkg');
shell.exec('wasm-pack build --target nodejs');
shell.mv('pkg', 'pkg.node');