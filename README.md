webvfx-dynamic-filters
======================

Dynamic image filters and effects for melt or melted using webvfx and node express server

## Prerequisites

### npm

```shell
   apt-get install npm
```
### node > 0.8

```shell
   apt-get install nodejs
```

Check it on [joyent wiki](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)

### melt
```shell
   apt-get install melt libmlt-dev libmlt++-dev pkg-config
```

### webvfx
See [webvfx](https://github.com/rectalogic/webvfx) for howto install it

## Install

### Clone the project and install node dependencies
```shell
   git clone https://github.com/inaes-tic/webvfx-dynamic-filters.git
   cd webvfx-dynamic-filters
   npm install
```

## Run

### Running the server
```shell
   node server.js
```

You should be able to access it from a browser at port [3100](http://localhost:3100)

### Running the sample

From another terminal, enter webvfx-dynamic-filter directory and run
```shell
   ./mlt_dynamic_filter
```

### PS

Thanks to [@daneden](http://daneden.me/animate/) for the animations!
