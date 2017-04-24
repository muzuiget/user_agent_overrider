Build
=====

## system dependencies

The project build scripts base on NodeJS, you need NodeJS 6+ and npm tools in your system.

## how to build

Get the source code

    git clone https://github.com/muzuiget/user_agent_overrider.git
    cd user_agent_overrider

Install NodeJS modules, a "node_modules" folder will be create in project fodler;

    npm install

Run build task

    $ npm run build

    > user_agent_overrider@0.4.1 build ~/user_agent_overrider
    > gulp build

    [15:04:22] Using gulpfile ~/user_agent_overrider/gulpfile.js
    [15:04:22] Starting 'build'...
    [15:04:22] Starting 'remake'...
    [15:04:22] Starting 'clean'...
    [15:04:22] Finished 'clean' after 20 ms
    [15:04:22] Starting 'make'...
    [15:04:22] Starting 'copy'...
    [15:04:22] Starting 'metainfo'...
    [15:04:22] Starting 'manifest'...
    [15:04:22] Starting 'script'...
    [15:04:22] Finished 'metainfo' after 67 ms
    [15:04:22] Finished 'manifest' after 63 ms
    [15:04:22] Finished 'script' after 64 ms
    [15:04:22] Finished 'copy' after 87 ms
    [15:04:22] Finished 'make' after 87 ms
    [15:04:22] Finished 'remake' after 108 ms
    [15:04:22] Starting 'product'...
    [15:04:22] Starting 'create-xpi'...
    [15:04:22] Finished 'create-xpi' after 39 ms
    [15:04:22] Finished 'product' after 39 ms
    [15:04:22] Finished 'build' after 147 ms

The xpi will be place in dist/xpi

    $ ls dist/xpi/user_agent_overrider-0.4.1.xpi
    dist/xpi/user_agent_overrider-0.4.1.xpi

