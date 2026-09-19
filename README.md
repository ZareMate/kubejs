# KubeJS Scripts

A collection of **KubeJS scripts** created and maintained by **ZareMate**.

This repository contains server-side KubeJS scripts for Minecraft, focused on automation, utilities, integrations, player management, and custom server functionality.

## 📁 Repository

**GitHub:** https://github.com/ZareMate/kubejs

---

# 📜 Scripts

## `clockin.js`

A staff administration Clock-In system for tracking administration work sessions.

### Features

* Clock in and out of administration shifts
* Persistent Clock-In data
* Track total worked time
* View Clock-In information
* View a Clock-In leaderboard
* Permission-based command access

### Commands

| Command                | Description                   | Permission                    |
| ---------------------- | ----------------------------- | ----------------------------- |
| `/clockin`             | Opens the Clock-In system     | `clockin.login`               |
| `/clockin in`          | Clock in                      | `clockin.command.in`          |
| `/clockin out`         | Clock out                     | `clockin.command.out`         |
| `/clockin leaderboard` | View the Clock-In leaderboard | `clockin.command.leaderboard` |
| `/clockin info`        | View Clock-In information     | `clockin.command.info`        |

### Permissions

```text
clockin.login
clockin.command.status
clockin.command.in
clockin.command.out
clockin.command.leaderboard
clockin.command.info
```

| Permission                    | Purpose                                        |
| ----------------------------- | ---------------------------------------------- |
| `clockin.login`               | Allows access to the Clock-In system           |
| `clockin.command.status`      | Allows access to Clock-In status functionality |
| `clockin.command.in`          | Allows `/clockin in`                           |
| `clockin.command.out`         | Allows `/clockin out`                          |
| `clockin.command.leaderboard` | Allows `/clockin leaderboard`                  |
| `clockin.command.info`        | Allows `/clockin info`                         |

Minecraft **permission level 3** can also bypass the individual Clock-In command permission checks.

---

## `multi-acc.js`

A multi-account detection and management script.

### Features

* Tracks player IP/account associations while players are online
* Detects players sharing an IP address
* `/checkip` command for checking current IP groups
* LuckPerms-based permission checks
* Staff alerts for detected shared IPs
* Optional Discord webhook notifications
* Rebuilds the IP map when `/checkip` is used

### Dependencies

* KubeJS
* LuckPerms
* KubeJSHTTP

### Configuration

```js
var DISCORD_WEBHOOK_URL = "REPLACE_ME";
var MULTIACCOUNT_PERMISSION_CHECKIP = "multiaccount.command.checkip";
var MULTIACCOUNT_PERMISSION_ALERT = "multiaccount.alert";
```

### Command

| Command    | Description                                             | Permission                     |
| ---------- | ------------------------------------------------------- | ------------------------------ |
| `/checkip` | Checks current player IP groups and rebuilds the IP map | `multiaccount.command.checkip` |

### Permissions

```text
multiaccount.command.checkip
multiaccount.alert
```

| Permission                     | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `multiaccount.command.checkip` | Allows `/checkip`                   |
| `multiaccount.alert`           | Receives multi-account staff alerts |

Minecraft **permission level 3** can also use `/checkip`.

### Discord Webhook

The script can optionally send multi-account notifications to Discord.

Configure:

```js
var DISCORD_WEBHOOK_URL = "REPLACE_ME";
```

**Do not commit a real Discord webhook URL to a public repository.**

---

## `dailyquests.js`

A persistent daily quest system with configurable quests, rewards, player progress, and administrative rerolling.

### Features

* Three daily quest difficulties:

  * Easy
  * Medium
  * Hard
* Random quest assignment per player
* Persistent player quest data stored in JSON
* Quest completion tracking
* Inventory-based progress checking
* Item removal when claiming a completed quest
* Configurable rewards
* Daily reset at midnight
* Displays the remaining time until the next reset
* Detects a missed reset after the server was offline
* Automatically creates the default configuration when needed
* Repairs invalid or outdated player quest data
* Administrative `/reroll <player>` command
* Rerolling works for both online players and players with saved quest data

### Dependencies

* KubeJS
* LuckPerms

### Generated Files

```text
server/kubejs/config/dailyquests.json
server/kubejs/data/dailyquests/players.json
```

### Commands

| Command                     | Description                     | Permission                   |
| --------------------------- | ------------------------------- | ---------------------------- |
| `/dailyquests`              | Opens the player's daily quests | Player                       |
| `/dailyquests claim easy`   | Claims a completed Easy quest   | Player                       |
| `/dailyquests claim medium` | Claims a completed Medium quest | Player                       |
| `/dailyquests claim hard`   | Claims a completed Hard quest   | Player                       |
| `/reroll <player>`          | Rerolls a player's daily quests | `dailyquests.command.reroll` |

### Permission

```text
dailyquests.command.reroll
```

| Permission                   | Purpose                   |
| ---------------------------- | ------------------------- |
| `dailyquests.command.reroll` | Allows `/reroll <player>` |

Minecraft **permission level 3** can also use `/reroll <player>`.

### Configuration

The generated `dailyquests.json` file controls:

* Reset check interval
* Reroll permission
* Easy rewards
* Medium rewards
* Hard rewards
* Easy quest pool
* Medium quest pool
* Hard quest pool
* Quest names
* Quest descriptions
* Item IDs
* Required item amounts
* Reward types

Example:

```json
{
  "resetCheckInterval": 20,
  "questPermissionReroll": "dailyquests.command.reroll",
  "rewards": {
    "easy": {},
    "medium": {},
    "hard": {}
  },
  "quests": {
    "easy": [],
    "medium": [],
    "hard": []
  }
}
```

### Daily Reset

Daily quest data is stored on disk and includes the date of the last reset.

The script checks the current date:

* When the server starts
* When players join
* When quest data is opened
* When quests are claimed
* Periodically while the server is running

If the stored reset date is older than the current date, the daily quests are reset.

The server does **not** need to be online exactly at `00:00`.

If the server was offline during the reset, the next startup or check detects the new day and resets the quests.

The GUI displays the countdown to the next midnight:

```text
Resets in: 5h 23m 41s
```

---

## `notes.js`

A player notes system for administration.

Notes are stored persistently and allow staff members to keep administrative notes associated with players.

### Commands

| Command                | Description                           | Permission   |
| ---------------------- | ------------------------------------- | ------------ |
| `/note <player>`       | Read notes for a player               | `note.read`  |
| `/note add <player>`   | Add or replace your note for a player | `note.add`   |
| `/note rm <player>`    | Remove your own note for a player     | `note.rm`    |
| `/note clear <player>` | Clear all notes for a player          | `note.clear` |

### Permissions

```text
note.read
note.add
note.rm
note.clear
```

| Permission   | Purpose                                           |
| ------------ | ------------------------------------------------- |
| `note.read`  | Allows reading player notes                       |
| `note.add`   | Allows adding or replacing your note for a player |
| `note.rm`    | Allows removing your own note for a player        |
| `note.clear` | Allows clearing all notes for a player            |

Minecraft **permission level 3** can also access the permission-protected note commands.

### Note Storage

Notes are stored in:

```text
server/kubejs/data/notes.json
```

Each administrator can have their own note for a player.

Using:

```text
/note add <player>
```

when that administrator already has a note for the player replaces their existing note.

---

# 🔐 Permissions

## Complete Permission List

```text
clockin.login
clockin.command.status
clockin.command.in
clockin.command.out
clockin.command.leaderboard
clockin.command.info

multiaccount.command.checkip
multiaccount.alert

dailyquests.command.reroll

note.read
note.add
note.rm
note.clear
```

### Permission Overview

| Permission                     | Script        | Description                          |
| ------------------------------ | ------------- | ------------------------------------ |
| `clockin.login`                | Clock-In      | Access Clock-In system               |
| `clockin.command.status`       | Clock-In      | Access Clock-In status functionality |
| `clockin.command.in`           | Clock-In      | `/clockin in`                        |
| `clockin.command.out`          | Clock-In      | `/clockin out`                       |
| `clockin.command.leaderboard`  | Clock-In      | `/clockin leaderboard`               |
| `clockin.command.info`         | Clock-In      | `/clockin info`                      |
| `multiaccount.command.checkip` | Multi-Account | `/checkip`                           |
| `multiaccount.alert`           | Multi-Account | Multi-account alerts                 |
| `dailyquests.command.reroll`   | Daily Quests  | `/reroll <player>`                   |
| `note.read`                    | Notes         | `/note <player>`                     |
| `note.add`                     | Notes         | `/note add <player>`                 |
| `note.rm`                      | Notes         | `/note rm <player>`                  |
| `note.clear`                   | Notes         | `/note clear <player>`               |

---

# 🛠️ Installation

1. Install [KubeJS](https://kubejs.com/) on your Minecraft server.
2. Install any dependencies required by the script you want to use.
3. Download or clone this repository.
4. Copy the required `.js` files into:

```text
server/kubejs/server_scripts/
```

5. Start or restart the server.
6. Configure the scripts as required.

For `dailyquests.js`, the default configuration is automatically created at:

```text
server/kubejs/config/dailyquests.json
```

For `multi-acc.js`, configure the webhook and permissions directly in the script.

---

# ⚙️ Configuration

Configuration depends on the individual script.

## Daily Quests

`dailyquests.json` controls:

* Reset check interval
* Reroll permission
* Easy, medium, and hard rewards
* Easy, medium, and hard quest pools
* Quest names
* Quest descriptions
* Item IDs
* Required amounts
* Reward types

## Multi-Account

Set the Discord webhook URL if Discord notifications are required:

```js
var DISCORD_WEBHOOK_URL = "REPLACE_ME";
```

Do not commit a real Discord webhook URL to a public repository.

---

# 📦 Dependencies

Dependencies vary by script.

| Script           | KubeJS | LuckPerms | KubeJSHTTP |
| ---------------- | :----: | :-------: | :--------: |
| `clockin.js`     |    ✅   |     ✅     |      ❌     |
| `multi-acc.js`   |    ✅   |     ✅     |      ✅     |
| `dailyquests.js` |    ✅   |     ✅     |      ❌     |
| `notes.js`       |    ✅   |     ✅     |      ❌     |

Always check the individual script before installation.

---

# 📂 Data Storage

The scripts use persistent storage where required.

```text
server/kubejs/data/
├── dailyquests/
│   └── players.json
└── notes.json
```

Configuration files are stored under:

```text
server/kubejs/config/
└── dailyquests.json
```

Persistent data survives server restarts and KubeJS reloads.

Do not delete these files unless you intend to reset the associated data.

---

# 🔄 Reloading

After modifying a server script, reload the KubeJS server scripts:

```text
/kubejs reload server_scripts
```

Check the server console after reloading for errors.

A full server restart may be required for some changes.

---

# 🐛 Debugging

KubeJS reports script errors in the Minecraft server console.

Common errors include:

```text
Error loading server script
```

```text
TypeError
```

```text
Failed to load script
```

When debugging, check:

1. Minecraft version.
2. KubeJS version.
3. Required mods.
4. LuckPerms installation.
5. Required permission nodes.
6. Webhook configuration.
7. Script location.
8. KubeJS console output.

---

# ✏️ Modifying the Scripts

You are welcome to modify the scripts in accordance with the repository license.

When modifying a script:

* Preserve the original author attribution.
* Preserve the original copyright notice.
* Preserve the license notice.
* Document substantial changes when appropriate.

If you modify a script, you may additionally identify yourself in its header:

```js
/*
 * Copyright (c) 2026 @ZareMate
 * Original author: @ZareMate
 *
 * Licensed under the MIT License.
 *
 * If you modify this script, you may additionally identify yourself as:
 *
 * Modified by: @YourUsername
 *
 * The original author attribution and copyright notice must remain.
 */
```

---

# 🤝 Contributions

Issues and pull requests are welcome.

When submitting changes:

* Explain what the change does.
* Test the script before submitting it.
* Preserve existing attribution and licensing information.
* Document new dependencies or configuration requirements.
* Avoid committing secrets such as Discord webhook URLs.

---

# 📄 License

The scripts in this repository are distributed under the **MIT License**.

See [`LICENSE`](LICENSE) for the full license text.

---

# 👤 Author

Created and maintained by **@ZareMate**.

**GitHub:** https://github.com/ZareMate
