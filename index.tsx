/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

const SEVENTV_API_URL = "https://7tv.io/v4/gql";

const GQLSearchquery = `
query SearchEmote($query: String!, $perPage: Int!, $page: Int!) {
    search {
        all(query: $query, page: $page, perPage: $perPage) {
            emotes {
                items {
                    id
                    defaultName
                }
            }
        }
    }
}
`;

const GQLVariables = {
    query: "",
    perPage: 100,
    sort: "TOP_ALL_TIME",
    page: 1
};

const emoteMap: Record<string, string> = {};
(window as any).__7tv_emoteMap = emoteMap; // Expose the emote map to patched code

async function fetchEmotes() {
    // Does first 50 pages of most popular emotes or 5000 emotes but some have same name and will not be added
    for (let page = 1; page <= 50; page++) {
        GQLVariables.page = page;
        try {
            const response = await fetch(SEVENTV_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: GQLSearchquery,
                    variables: GQLVariables
                })
            });
            const data = await response.json();
            for (const emote of data.data.search.all.emotes.items) {
                // Check if the emote already exists in the map, will only keep the most popular emote with the same name
                if (!(emote.defaultName in (window as any).__7tv_emoteMap)) {
                    (window as any).__7tv_emoteMap[emote.defaultName] = `https://cdn.7tv.app/emote/${emote.id}/1x.webp`;
                }
            }
            console.log(`Fetched emote page ${page}:`, Object.keys((window as any).__7tv_emoteMap).length, "emotes");
        } catch (err) {
            console.error(`Failed to fetch page ${page}:`, err);
        }
    }
}

export default definePlugin({
    name: "7TV Emotes",
    description:
    "Never hide image links in messages, even if it's the only content",
    authors: [{ name: "AriaGomes", id: 161545039502245888n }],
    patches: [
        {
            find: 'e=n?h(i):("paragraph"===i[0].type&&i[0].content instanceof Array&&(i[0].content=h(i[0].content)),i)',
                            replacement: {
                                match:
                                /e=n\?h\(i\):\("paragraph"===i\[0\]\.type&&i\[0\]\.content instanceof Array&&\(i\[0\]\.content=h\(i\[0\]\.content\)\),i\)/,
                            replace: () => `(
                                //console.log("AST node:", i),
                                (() => {
                                    if(i[0]?.type === "text"){
                                        const emoteMap = window.__7tv_emoteMap || {};
                                        const words = String(i[0]?.content).split(/(\\s+)/);
                                        const newContent = [];
                                        //console.log("Words:", words);
                                        //console.log("Emote map:", emoteMap);

                                        words.forEach((word, index) => {
                                            if (emoteMap[word]) {
                                                //console.log("Found emote:", word, "->", emoteMap[word])
                                                newContent.push({
                                                    name: word,
                                                    id: word,
                                                    src: emoteMap[word],
                                                    animated: true,
                                                    type: "emoji"
                                                });
                                            }
                                            else {
                                                //console.log("Not an emote:", word);
                                                newContent.push({ type: "text", content: word });
                                            }
                                        });

                                        e = newContent;
                                    }
                                })(),

                                             e
                            )`,
                            },
        },
    ],

    start: async () => {
        console.log("Fetching 7TV emotes...");
        await fetchEmotes();
        // console.log((window as any).__7tv_emoteMap);
    },
    stop: () => {
        console.log("Stopping 7TV Emotes plugin.");
    }
});
