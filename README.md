mbc-etiquette
======================

Video effects editor and server for melt or melted, built with Backbone.js,
KineticJS, Node.js, Express, Webvfx and MongoDB.

The application allows you to:

* Interactive/Live video effects
* Add, update, and delete Sketchs (preload effects)
* HTML5 Editor

##License

AGPL v3.

## Prerequisites

### node > 0.8

```shell
   apt-get install nodejs
```

Check it on [joyent wiki](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)

### npm

```shell
   apt-get install npm
```

### melt
```shell
   apt-get install melt libmlt-dev libmlt++-dev pkg-config
```

### mongodb

```shell
   apt-get install mongodb
```

### webvfx
See [webvfx](https://github.com/rectalogic/webvfx) for howto install it


## Optional

### stream-m

Video preview in Editor Canvas

```shell
    git clone https://github.com/inaes-tic/stream-m
```

Convert pngs zip files into animations in Editor


```shell
    apt-get install unzip imagemagick
```

### Running the stream sample

From a terminal, keep this running
```shell
    cd stream-m
    make
```

You can check if streaming is working at [8000](http://localhost:8000/consume/mbc?password=malbec)

## Install

### Clone the project
```shell
   git clone https://github.com/inaes-tic/webvfx-dynamic-filters.git
```

## Run

### Running the server
```shell
   make serve
```

You should be able to access it from a browser at port [3100](http://localhost:3100)

## Sample

### Webserver

You shoud able to access filters from browser at [http://localhost:3100/filter](http://localhost:3100/filter)

### Melt with webvfx filter

From another terminal, enter webvfx-dynamic-filter directory and run
```shell
   ./mlt_dynamic_filter
```

With Optional
```shell
    ./mlt_dynamic_filter_stream
```

### PS

Thanks to [@daneden](http://daneden.me/animate/) for the animations!
