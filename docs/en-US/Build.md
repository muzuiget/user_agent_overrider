Build
=====

## system dependencies

The project build scripts base on NodeJS, you need NodeJS 5+ and npm tools in your system.

Install gulp

    sudo npm install -g gulp

## how to build

Get the source code

    git clone https://github.com/muzuiget/user_agent_overrider.git
    cd user_agent_overrider

Install NodeJS modules, a "node_modules" folder will be create in project fodler;

    npm install

Run build task

    $ gulp build
    [13:00:23] Using gulpfile ~/user_agent_overrider/gulpfile.js
    [13:00:23] Starting 'build'...
    [13:00:23] Starting 'remake'...
    [13:00:23] Starting 'clean'...
    [13:00:23] Finished 'clean' after 29 ms
    [13:00:23] Starting 'make'...
    [13:00:23] Starting 'copy'...
    [13:00:23] Starting 'metainfo'...
    [13:00:23] Starting 'manifest'...
    [13:00:23] Starting 'script'...
    [13:00:23] Finished 'manifest' after 103 ms
    [13:00:23] Finished 'metainfo' after 111 ms
    [13:00:23] Finished 'script' after 106 ms
    [13:00:23] Finished 'copy' after 146 ms
    [13:00:23] Finished 'make' after 146 ms
    [13:00:23] Finished 'remake' after 176 ms
    [13:00:23] Starting 'product'...
    [13:00:23] Starting 'create-xpi'...
    [13:00:23] Finished 'create-xpi' after 67 ms
    [13:00:23] Finished 'product' after 67 ms
    [13:00:23] Finished 'build' after 245 ms

The xpi will be place in dist/xpi

    $ ls dist/xpi/user_agent_overrider-0.4.1.xpi
    dist/xpi/user_agent_overrider-0.4.1.xpi

