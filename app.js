"use strict";

const http = require("node:http");
const { Writable } = require("node:stream");

const express = require("express");
const { MongoClient } = require("mongodb");
const { Server: SocketIOServer } = require("socket.io");
const winston = require("winston");
const { combine, colorize, printf, json, timestamp } = winston.format;

const { LOG_LEVEL } = require("./lib/constants");
const { PIPE_SYNC } = require("./lib/extensions");

const httpServer =
    express()
        .use("/lib/revealjs", express.static("./node_modules/reveal.js/dist"))
        .use("/lib/revealjs/plugins", express.static("./node_modules/reveal.js/plugin"))
        .use("/", express.static("./client/"))
        [PIPE_SYNC](http.createServer);

const io =
    new SocketIOServer(
        httpServer,
        {
            maxHttpBufferSize: 1e8,
            transports: [ "websocket" ]
        });

winston
    .add(new winston.transports.Console({
        level: LOG_LEVEL.DEBUG,
        format:
            combine(
                colorize({ all: true }),
                timestamp(),
                printf(
                    ({ level, message, label, timestamp }) =>
                        `${timestamp} ${level.padEnd(10, " ")} ${message}`))
    }))
    .add(new winston.transports.Stream({
        level: LOG_LEVEL.DEBUG,
        stream: new Writable({
            write (chunk, encoding, callback) {
                io.emit("log", chunk.toString());
                callback();
            }
        }),
        format: combine(
            timestamp(),
            json())
    }));

MongoClient
    .connect("mongodb://127.0.0.1")
    .then(client => {
        winston.info(`Connected to MongoDB`);

        const HTTP_PORT = 80;
        httpServer.listen(HTTP_PORT);
        
        winston.info(`Listening on ${HTTP_PORT}`);
        
    });