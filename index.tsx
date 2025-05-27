/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

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

const GQLEmoteSetQuery = `
query SearchEmoteSets ($id: String!, $query: String!, $perPage: Int!, $page: Int!) {
    emoteSets {
        emoteSet(id: $id) {
            name
            emotes(page: $page, perPage: $perPage, query: $query) {
                items {
                    id
                    alias
                }
            }
        }
    }
}
`;

const GQLVariables = {
    query: null,
    perPage: 100,
    sort: "TOP_ALL_TIME",
    page: 1
};

const emoteMap: Record<string, string> = {};
(window as any).__7tv_emoteMap = emoteMap; // Expose the emote map to patched code

const settings = definePluginSettings({
    useGlobalEmotes: {
        type: OptionType.BOOLEAN,
        description: "Use the global 7TV emotes." +
            " If disabled, only emotes from the manually entered emote set id will be used.",
        default: true,
    },
    emotePages: {
        type: OptionType.NUMBER,
        description: "Number of pages to fetch from the 7TV API. " +
            "Each page contains 100 emotes, so increasing this will increase how long all emotes are loaded ",
        default: 50,
    },
    emoteSetID: {
        type: OptionType.STRING,
        description: "Enter a emote set ID to use instead of fetching the most popular emotes. " +
            "You can find the ID in the URL of the emote set page on 7TV. " +
            "For example, for https://7tv.app/emotesets/1234567890abcdef, the ID is 1234567890abcdef.",
        default: "",
    },
    emoteScale: {
        type: OptionType.SELECT,
        description: "Scale of the emote image in messages.", // I have no idea if this has any effect when the image is turned into emoji. but will use the corresponding image scale for it.
        options: [
            { label: "1x", value: "1x", default: true },
            { label: "2x", value: "2x" },
            { label: "3x", value: "3x" },
            { label: "4x", value: "4x" },
        ]
    }
});

async function fetchEmotesBySetID(setID: string) {
    GQLVariables.page = 1;

    try {
        const response = await fetch(SEVENTV_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: GQLEmoteSetQuery,
                variables: {
                    id: setID,
                    query: null,
                    perPage: GQLVariables.perPage,
                    page: GQLVariables.page
                }
            })
        });
        const data = await response.json();
        console.log(data);
        const emotes = data.data.emoteSets.emoteSet.emotes.items;
        for (const emote of emotes) {
            // Check if the emote already exists in the map, will only keep the most popular emote with the same name
            if (!(emote.alias in (window as any).__7tv_emoteMap)) {
                (window as any).__7tv_emoteMap[emote.alias] = `https://cdn.7tv.app/emote/${emote.id}/${settings.store.emoteScale}.webp`;
            }
        }
        console.log(`Fetched emotes from set ${setID}:`, Object.keys((window as any).__7tv_emoteMap).length, "emotes");
    } catch (err) {
        console.error(`Failed to fetch emotes from set ${setID}:`, err);
    }
}

async function fetchEmotes() {

    // If a set ID is provided, fetch emotes from that set first then return and get the rest
    const setID = settings.store.emoteSetID.trim();
    if (setID) {
        await fetchEmotesBySetID(setID);
    }

    if (settings.store.useGlobalEmotes) {
        for (let page = 1; page <= settings.store.emotePages; page++) {
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
                        (window as any).__7tv_emoteMap[emote.defaultName] = `https://cdn.7tv.app/emote/${emote.id}/${settings.store.emoteScale}.webp`;
                    }
                }
                console.log(`Fetched emote page ${page}:`, Object.keys((window as any).__7tv_emoteMap).length, "emotes");
            } catch (err) {
                console.error(`Failed to fetch page ${page}:`, err);
            }
        }
    }
}

export default definePlugin({
    name: "7TV Emotes",
    description:
        "Never hide image links in messages, even if it's the only content",
    authors: [{ name: "AriaGomes", id: 161545039502245888n }],
    settings,
    patches: [
        {
            find: 'e=n?h(i):("paragraph"===i[0].type&&i[0].content instanceof Array&&(i[0].content=h(i[0].content)),i)',
            replacement: {
                match:
                    /e=n\?h\(i\):\("paragraph"===i\[0\]\.type&&i\[0\]\.content instanceof Array&&\(i\[0\]\.content=h\(i\[0\]\.content\)\),i\)/,
                replace: () => `(
                                //console.log("AST node:", i),
                                (() => {
                                    for (let node = 0; node < i.length; node++) {
                                        if(i[node].type === "text"){
                                            const emoteMap = window.__7tv_emoteMap || {};
                                            const words = String(i[node]?.content).split(/(\\s+)/);
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
                                                        surrogate: emoteMap[word],
                                                        animated: true,
                                                        type: "emoji"
                                                    });
                                                }
                                                else {
                                                    //console.log("Not an emote:", word);
                                                    newContent.push({ type: "text", content: word });
                                                }
                                            });

                                            e[node] = newContent;
                                        }
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
