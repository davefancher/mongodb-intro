"use strict";

const http = require("node:http");
const { Writable } = require("node:stream");

const express = require("express");
const { MongoClient, Db } = require("mongodb");
const { Server: SocketIOServer } = require("socket.io");
const winston = require("winston");
const { combine, colorize, printf, json, timestamp } = winston.format;

const { LOG_LEVEL } = require("./lib/constants");
const { PIPE, PIPE_SYNC } = require("./lib/extensions");

const DB_NAME = "sample_mflix"

const SOCKET_COMMANDS = Object.freeze({
    "findOne":
        client =>
            client
                .db(DB_NAME)
                .collection("movies")
                .findOne(
                    { title: /What we do in the shadows/i },
                    {
                        projection: {
                            _id: 1,
                            title: 1,
                            rated: 1,
                            languages: 1,
                            directors: 1,
                            cast: 1,
                            genres: 1,
                            imdb: 1
                        }
                    }),
    "insertOne":
        async client => {
            const movies = client.db(DB_NAME).collection("movies");

            const insertResult =
                await movies
                    .insertOne(
                        {
                            title: "Jac Kessler's Popsy",
                            rated: "R",
                            languages: [ "English" ],
                            directors: [ "Jac Kessler" ],
                            cast: [ "Alex Dunning", "Nadia Fancher", "Ted Raimi" ],
                            genres: [ "Short", "Horror", "Thriller" ]
                        });

            const doc =
                await movies
                    .findOne({ _id: insertResult.insertedId });

            return {
                insertResult,
                doc
            };
        },
    "updateOne":
        async client => {
            const movies = client.db(DB_NAME).collection("movies");

            const updateResult =
                await movies
                    .updateOne(
                        { title: "Jac Kessler's Popsy" },
                        {
                            $set: {
                                released: new Date("2019-09-08T00:00:00Z")
                            },
                            $push: {
                                genres: "Student",
                                languages: "Spanish"
                            }
                        });

            const doc =
                await movies
                    .findOne(
                        { title: "Jac Kessler's Popsy" },
                        { sort: { _id: -1 } });

            return {
                updateResult,
                doc
            };
        },
    "deleteOne":
        async client => {
            const movies = client.db(DB_NAME).collection("movies");

            const deleteResult =
                await movies
                    .deleteOne(
                        { title: "Jac Kessler's Popsy" }
                    );

            return deleteResult;
        },
    "aggregationPipeline":
        client =>
            client
                .db(DB_NAME)
                .collection("movies")
                .aggregate([
                    {
                        $match: { directors: "Quentin Tarantino" },
                    },
                    {
                        $lookup: {
                            from: "comments",
                            foreignField: "movie_id",
                            localField: "_id",
                            as: "comments",
                        },
                    },
                    {
                        $group: {
                            _id: { $year: "$released" },
                            movies: {
                                $push: {
                                    _id: "$_id",
                                    title: "$title",
                                    cast: "$cast",
                                    released: "$released",
                                    comments: { $slice: [ "$comments", 5 ] },
                                    commentCount: { $size: "$comments" }
                                }
                            }
                        }
                    },
                    { $sort: { _id: 1 } }
                ])
                .toArray(),
    "explainPlan":
        client =>
            client
                .db(DB_NAME)
                .collection("movies")
                .find({ directors: "Quentin Tarantino" })
                .explain(),
        "explainAggregationPlan":
            client =>
                client
                    .db(DB_NAME)
                    .collection("movies")
                    .aggregate([
                        { $match: { directors: "Quentin Tarantino" } }
                    ])
                    .explain()
});

const httpServer =
    express()
        .use("/lib/revealjs", express.static("./node_modules/reveal.js/dist"))
        .use("/lib/revealjs/plugins", express.static("./node_modules/reveal.js/plugin"))
        .use("/lib/revealjs/plugins/mermaid", express.static("./node_modules/reveal.js-mermaid-plugin/plugin/mermaid"))
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

const handleSocketConnection =
    client =>
        socket =>
            SOCKET_COMMANDS
                [PIPE_SYNC](Object.entries)
                .reduce(
                    (s, [ command, handler ]) =>
                        s.on(command,
                            async () => {
                                try {
                                    void await client
                                        [PIPE_SYNC](handler)
                                        [PIPE](r => JSON.stringify(r, null, 4))
                                        [PIPE](r => socket.emit("data", r));
                                } catch (ex) {
                                    console.error(ex);
                                    socket.emit("error", { message: ex.message });
                                }
                            }),
                        socket);

MongoClient
    .connect("mongodb://127.0.0.1")
    .then(client => {
        winston.info(`Connected to MongoDB`);

        io.on("connection", handleSocketConnection(client));

        const HTTP_PORT = 80;
        httpServer.listen(HTTP_PORT);

        winston.info(`Listening on ${HTTP_PORT}`);
    });