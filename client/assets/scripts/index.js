"use strict";

const runDemo =
    (socket, highlight) =>
        event => {
            const demoName = event.target.getAttribute("data-demo-name");

            const outputElement = document.getElementById(`${demoName}_output`);

            socket
                .once(
                    "data",
                    data => {
                        const content = document.createTextNode(data);
                        outputElement.replaceChildren(content);

                        highlight.highlightBlock(output);
                    })
                .emit(demoName);
        };

const clearDemo =
    event => {
        const demoName = event.target.getAttribute("data-demo-name");

        const outputElement = document.getElementById(`${demoName}_output`);

        outputElement.replaceChildren([]);
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
            .querySelectorAll("BUTTON.runDemoButton")
            .forEach(button => {
                console.log(button);
                button
                    .addEventListener(
                        "mouseup",
                        runDemo(socket, highlight));
            });

        document
            .querySelectorAll("BUTTON.clearDemoButton")
            .forEach(button => {
                button
                    .addEventListener(
                        "mouseup",
                        clearDemo);
            });
    });
