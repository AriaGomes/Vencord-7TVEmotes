# Vencord-7TVEmotes

The **Vencord-7TVEmotes** plugin enhances Discord messages by replacing text with corresponding 7TV emotes.

# Demo

![Demo GIF](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/demo.gif?raw=true)

# How to Use

To install the plugin, build the Vencord source code by following the instructions [here](https://docs.vencord.dev/installing/custom-plugins/). Once Vencord is configured to use the built files, restart Discord. The plugin will appear as "7TV Emotes" in the plugin list. Enable the plugin to start using emotes.

![Plugins Screenshot](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/plugins.png?raw=true)

Type a popular emote or configure the plugin settings to suit your preferences. See the settings section below for more details.

# Settings

![Settings Screenshot](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/settings.png?raw=true)

### Global Emotes

**Default:** Enabled

Fetches the [most popular 7TV emotes](https://7tv.app/emotes). If no emote set IDs are provided and this option is disabled, no emotes will be available. This setting is influenced by the number of emote pages configured.

### Emote Scale

**Default:** 1x

Specifies the scale of the emote images fetched from the 7TV CDN. The default scale (1x) is recommended for regular use.

### Emote Pages

**Default:** 50

Defines the number of pages to fetch from the global most popular emote set. Each page contains approximately 100 emotes. Increasing this value will extend the time required to fetch all emotes. This setting requires Global Emotes to be enabled; otherwise, it will have no effect.

### Show Notifications

**Default:** Disabled

Displays notifications about the status of emote fetching. This feature is primarily intended for debugging purposes and is disabled by default to avoid excessive notifications during startup.

![Notifications Screenshot](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/notifications.gif?raw=true)

### Emote Set IDs

**Default:** Empty

Allows users to specify custom emote set IDs to fetch emotes from. This feature enables the use of favorite community emotes or personal emote sets. If Global Emotes is disabled, only the specified emote set IDs will be used. Multiple emote set IDs can be entered, but fetching them may take additional time. Each emote set ID fetches up to 10 pages, with each page containing approximately 100 emotes.

![Emote Set IDs Screenshot](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/emoteIDs.png?raw=true)
