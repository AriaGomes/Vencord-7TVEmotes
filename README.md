# Vencord-7TVEmotes

Adds 7TV emotes to discord messages.
Replaces text with corresponding 7TV Emotes.

# Demo

![Demo GIF](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/demo.gif?raw=true)

# How to use

Install the plugin by building vencord source code with the instructions [here](https://docs.vencord.dev/installing/custom-plugins/)

Once vencord has been built with the custom userplugin and set vencord to use those built files and restart you will see a new plugin called "7TV Emotes" enable the plugin and start using emotes.

![plugins photo](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/plugins.png?raw=true)

Type a popular-ish emote and have fun. You may need to adjust some settings to configure this to your liking. See settings below

# Settings

![settings photo](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/settings.png?raw=true)

### Global Emotes

Default - Enabled

Fetches the [most popular 7TV emotes](https://7tv.app/emotes). If no setIDs set and this is disabled you will have no emotes. This settings is also affected by the amount of Emote Pages set.

### Emote Scale

Default - 1x

Selects the scale of the emote that will be fetched from 7TV CDN. 1x is more than enough for regular use.

### Emote Pages

Default - 50

Fetches this amount of emote pages from the global most popular set. Each page contains around 100 emotes. Increasing this will increase the time it takes to fetch all emotes. This setting requres that Global Emotes is enabled or this will have no effect

### Show Notifications

Default - Disabled

Shows the user the status of emote fetching. This is more for debugging and really annoying on every startup so disabled by default

![Notifications GIF](https://github.com/AriaGomes/Vencord-7TVEmotes/blob/main/README%20Assests/notifications.gif?raw=true)

### Emote Set IDs

Default - Empty

Enter emote set IDs that will be fetched first before the global emotes. You can use this to use your favourite emotes by entering your favourite community set emotes or make your own and use that set here. You can disable global emotes and only use emote set IDs as well. You can enter as many emote set IDs as you would like but will increase the time it takes to fetch them. Each emote set ID will grab 10 pages as all the sets I have seen have a limit of 1k emotes. Each page has around 100 emotes

![EmoteIDs photo]()
