/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import {
    Button,
    Forms,
    React,
    TextInput,
    useEffect,
    useState,
} from "@webpack/common";

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
    page: 1,
};

const emoteMap: Record<string, string> = {};
(window as any).__7tv_emoteMap = emoteMap; // Expose the emote map to patched code

const settings = definePluginSettings({
    useGlobalEmotes: {
        type: OptionType.BOOLEAN,
        description:
            "Use the global 7TV emotes." +
            " If disabled, only emotes from the manually entered emote set id will be used.",
        default: true,
        restartNeeded: true,
    },
    showNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show notifications when fetching emotes.",
        default: true,
        restartNeeded: false,
    },
    emotePages: {
        type: OptionType.NUMBER,
        description:
            "Number of pages to fetch from the 7TV API. " +
            "Each page contains 100 emotes, so increasing this will increase how long all emotes are loaded " +
            "This only applies when using global emotes.",
        default: 50,
        restartNeeded: true,
    },
    emoteScale: {
        type: OptionType.SELECT,
        description: "Scale of the emote image in messages.", // I have no idea if this has any effect when the image is turned into emoji. but will use the corresponding image scale for it.
        options: [
            { label: "1x", value: "1x", default: true },
            { label: "2x", value: "2x" },
            { label: "3x", value: "3x" },
            { label: "4x", value: "4x" },
        ],
        restartNeeded: true,
    },
    emoteSetIDs: {
        type: OptionType.COMPONENT,
        component: () => {
            const { emoteSetIDs } = settings.use(["emoteSetIDs"]);
            if (emoteSetIDs.length === 0) {
                emoteSetIDs.push(""); // Ensure at least one input
            }

            return (
                <>
                    <EmoteIDInput title={"Emote Set IDs"} emoteSetIDs={emoteSetIDs} />
                </>
            );
        },
        restartNeeded: true,
    },
});

async function fetchEmoteSetNames(setID: string): Promise<string | void> {
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
                    page: GQLVariables.page,
                },
            }),
        });
        const data = await response.json();
        const emoteSetName = data.data.emoteSets.emoteSet.name;
        if (!emoteSetName) {
            console.warn(`Emote set with ID ${setID} not found.`);
            return `Emote Set ${setID}`;
        }
        return emoteSetName;
    } catch (err) {
        console.error(`Failed to fetch emote set name for ID ${setID}:`, err);
    }
}

async function fetchEmotesBySetID(setID: string) {
    for (let page = 1; page <= 10; page++) { // only fetch 10 pages per set, as most sets are limited to 1k emotes
        GQLVariables.page = page;
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
                        page: GQLVariables.page,
                    },
                }),
            });
            const data = await response.json();
            const emotes = data.data.emoteSets.emoteSet.emotes.items;
            for (const emote of emotes) {
                // Check if the emote already exists in the map, will only keep the most popular emote with the same name
                if (!(emote.alias in (window as any).__7tv_emoteMap)) {
                    (window as any).__7tv_emoteMap[
                        emote.alias
                    ] = `https://cdn.7tv.app/emote/${emote.id}/${settings.store.emoteScale}.webp`;
                }
            }
            settings.store.showNotifications &&
                showNotification(
                    {
                        title: "Fetching 7TV Emotes...",
                        body: `Fetched ${emotes.length} emotes from set ${await fetchEmoteSetNames(setID)
                            .then(name => name || `Emote Set ${setID}`)
                            .catch(() => `Emote Set ${setID}`)
                            }, page ${page}. Total Emotes Fetched: ${Object.keys((window as any).__7tv_emoteMap).length}`,
                        noPersist: true,
                        color: "var(--status-success)",
                        icon: emoteMap[
                            Object.keys(emoteMap)[Object.keys(emoteMap).length - 1]
                        ],
                        permanent: false,
                        dismissOnClick: true,
                    });
            console.log(
                `Fetched emotes from set ${setID}, page ${page}:`,
                Object.keys((window as any).__7tv_emoteMap).length,
                "emotes"
            );
        } catch (err) {
            console.error(
                `Failed to fetch emotes from set ${setID}, page ${page}:`,
                err
            );
        }
    }
}

async function fetchEmotes() {
    for (const setID of settings.store.emoteSetIDs) {
        if (setID.trim()) {
            await fetchEmotesBySetID(setID);
        }
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
                        variables: GQLVariables,
                    }),
                });
                const data = await response.json();
                for (const emote of data.data.search.all.emotes.items) {
                    // Check if the emote already exists in the map, will only keep the most popular emote with the same name
                    if (!(emote.defaultName in (window as any).__7tv_emoteMap)) {
                        (window as any).__7tv_emoteMap[
                            emote.defaultName
                        ] = `https://cdn.7tv.app/emote/${emote.id}/${settings.store.emoteScale}.webp`;
                    }
                }
                settings.store.showNotifications &&
                    showNotification({
                        title: "Fetching 7TV Emotes...",
                        body: `Fetched ${data.data.search.all.emotes.items.length} emotes from global most popular, page ${page}. Total Emotes Fetched: ${Object.keys((window as any).__7tv_emoteMap).length}`,
                        noPersist: true,
                        color: "var(--status-success)",
                        icon: emoteMap[
                            Object.keys(emoteMap)[Object.keys(emoteMap).length - 1]
                        ],
                        permanent: false,
                        dismissOnClick: true,
                    });
                console.log(
                    `Fetched emote page ${page}:`,
                    Object.keys((window as any).__7tv_emoteMap).length,
                    "emotes"
                );
            } catch (err) {
                console.error(`Failed to fetch page ${page}:`, err);
            }
        }
    }
}

function Input({
    initialValue,
    onChange,
    placeholder,
}: {
    placeholder: string;
    initialValue: string;
    onChange(value: string): void;
}) {
    const [value, setValue] = useState(initialValue);
    const [setName, setSetName] = useState("Unknown Emote Set");

    useEffect(() => {
        const fetchName = async () => {
            const name = await fetchEmoteSetNames(value);
            if (!name) {
                setSetName("Unknown Emote Set");
                return;
            } else {
                setSetName(String(name));
            }
        };
        fetchName();
    }, [value, initialValue]);

    return (
        <>
            <TextInput
                placeholder={placeholder}
                value={value}
                onChange={setValue}
                spellCheck={false}
                onBlur={() => value !== initialValue && onChange(value)}
            />
            <Forms.FormText>{setName || ""}</Forms.FormText>
        </>
    );
}

function EmoteIDInput({
    title,
    emoteSetIDs,
}: {
    title: string;
    emoteSetIDs: string[];
}) {
    function onChange(value: string, index: number) {
        emoteSetIDs[index] = value;

        // If editing the last input and it's not empty, add a new empty input
        if (index === emoteSetIDs.length - 1 && value.trim() !== "") {
            emoteSetIDs.push("");
        }

        // Remove empty non-last inputs
        for (let i = emoteSetIDs.length - 2; i >= 0; i--) {
            if (emoteSetIDs[i].trim() === "" && emoteSetIDs[i + 1] === "") {
                emoteSetIDs.splice(i, 1);
            }
        }
    }

    function onClickRemove(index: number) {
        if (emoteSetIDs.length > 1) {
            const updatedEmoteSetIDs = [...emoteSetIDs];
            updatedEmoteSetIDs.splice(index, 1);
            settings.store.emoteSetIDs = updatedEmoteSetIDs; // Update the settings store
        }
    }

    return (
        <>
            <Forms.FormTitle tag="h3">{title}</Forms.FormTitle>
            <Forms.FormText>
                Enter the 7TV emote set IDs to fetch emotes from. You can find the ID in
                the URL of the emote set page.
                <br />
                Example:{" "}
                <code>https://7tv.app/emote-sets/1234567890abcdef12345678</code>
                <br />
                Enter: <code>1234567890abcdef12345678</code>
                <br />
                This will fetch 10 pages of emotes from each entered set ID. All sets I have seen are limited to 1k emotes
            </Forms.FormText>
            {emoteSetIDs.map((id, index) => (
                <div
                    key={`${id}-${index}`} // Ensure a unique and stable key
                    style={{ display: "flex", gap: "0.5em", alignItems: "center" }}
                >
                    <Input
                        placeholder="Enter Emote Set ID"
                        initialValue={id}
                        onChange={value => onChange(value, index)}
                    />
                    <Button
                        size={Button.Sizes.MIN}
                        onClick={() => onClickRemove(index)}
                        style={{
                            background: "none",
                            color: "var(--status-danger)",
                            visibility:
                                index === emoteSetIDs.length - 1 ? "hidden" : "visible",
                        }}
                    >
                        Remove
                    </Button>
                </div>
            ))}
        </>
    );
}

export default definePlugin({
    name: "7TV Emotes",
    description: "Adds 7TV emotes to Discord messages.",
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
        const oldEmoteSetIDs = await DataStore.get<string[]>(
            "7TVEmotes_emoteSetIDs"
        );
        if (oldEmoteSetIDs != null) {
            settings.store.emoteSetIDs = oldEmoteSetIDs;
            await DataStore.del("7TVEmotes_emoteSetIDs");
        }
        console.log("Fetching 7TV emotes...");
        await fetchEmotes();
        // console.log((window as any).__7tv_emoteMap);
    },
    stop: () => {
        console.log("Stopping 7TV Emotes plugin.");
    },
});
