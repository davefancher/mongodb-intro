"use strict";

const runMqlExample =
    (socket, highlight) =>
        () => {
            const output = document.getElementById("mqlExampleOutput");

            socket
                .once(
                    "data",
                    data => {
                        const content = document.createTextNode(data);
                        output.replaceChildren(content);

                        highlight.highlightBlock(output);
                    })
                .emit("runMqlExample");
        };

const clearMqlExample =
    () => {
        const output = document.getElementById("mqlExampleOutput");

        output.replaceChildren([]);
    };

window.addEventListener(
    "load",
    () => {
        Reveal.initialize({
            hash: true,
            plugins: [
                RevealHighlight,
                RevealMarkdown,
                RevealMermaid,
                RevealNotes
            ]
        });

        const socket =
            io("ws://localhost", { transports: [ "websocket" ] })
                .on("error", err => console.log(err));

        const highlight = Reveal.getPlugin("highlight");

        document
            .getElementById("runMqlExampleButton")
            .addEventListener(
                "mouseup",
                runMqlExample(socket, highlight));

        document
            .getElementById("clearMqlExampleButton")
            .addEventListener(
                "mouseup",
                clearMqlExample);
    });
