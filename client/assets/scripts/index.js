"use strict";

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

        const socket = io("ws://localhost", { transports: [ "websocket" ] });
    });
