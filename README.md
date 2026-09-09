# KubeJS Scripts

A collection of **KubeJS scripts** created and maintained by **ZareMate**.

This repository contains server-side KubeJS scripts for Minecraft, focused on automation, utilities, integrations, player management, and custom server functionality.

## 📁 Repository

**GitHub:** https://github.com/ZareMate/kubejs

## 📜 Scripts

### `multi-acc.js`

A multi-account detection and management script.

**Features:**
- Tracks player IP/account associations while players are online
- Detects players sharing an IP address
- `/checkip` command for checking current IP groups
- LuckPerms-based permission checks
- Staff alerts for detected shared IPs
- Optional Discord webhook notifications
- Rebuilds the IP map when `/checkip` is used

**Dependencies:**
- KubeJS
- LuckPerms
- KubeJSHTTP

**Configuration:**
```js
var DISCORD_WEBHOOK_URL = "REPLACE_ME";
var MULTIACCOUNT_PERMISSION_CHECKIP = "multiaccount.command.checkip";
var MULTIACCOUNT_PERMISSION_ALERT = "multiaccount.alert";
```

**Permissions:**

| Permission | Purpose |
|---|---|
| `multiaccount.command.checkip` | Allows `/checkip` |
| `multiaccount.alert` | Receives multi-account staff alerts |

Server permission level 3 can also use `/checkip`.

---

### `dailyquests.js`

A persistent daily quest system with configurable quests, rewards, player progress, and administrative rerolling.

**Features:**
- Three daily quest difficulties: Easy, Medium, and Hard
- Random quest assignment per player
- Persistent player quest data stored in JSON
- Quest completion tracking
- Inventory-based progress checking
- Item removal when claiming a completed quest
- Configurable rewards
- Daily reset at midnight
- Displays the remaining time until the next reset
- Detects a missed reset after the server was offline by comparing the saved reset date
- Automatically creates the default configuration when needed
- Repairs invalid or outdated player quest data
- Administrative `/reroll <player>` command
- Rerolling works for both online players and players with saved quest data

**Dependencies:**
- KubeJS
- LuckPerms

**Generated files:**
```text
server/kubejs/config/dailyquests.json
server/kubejs/data/dailyquests/players.json
```

The configuration file contains the reset-check interval, reroll permission, rewards, and quest pools.

**Default reroll permission:**
```text
dailyquests.command.reroll
```

**Commands:**

| Command | Description | Permission |
|---|---|---|
| `/dailyquests` | Opens the player's daily quests | Player |
| `/dailyquests claim <easy\|medium\|hard>` | Claims a completed quest | Player |
| `/reroll <player>` | Rerolls a player's daily quests | `dailyquests.command.reroll` |

Server permission level 3 can also use `/reroll <player>`.

### Daily reset behavior

Daily quest data is stored on disk and includes the date of the last reset.

The script checks the current date when the server starts, players join, quest data is opened/claimed, and periodically while the server is running. If the stored reset date is older than the current date, the daily quests are reset.

This means the server does **not** need to be online exactly at `00:00`. If it was offline during the reset, the next startup/check detects the new day and resets the quests.

The GUI displays the countdown to the next midnight:

```text
Resets in: 5h 23m 41s
```

## 🛠️ Installation

1. Install [KubeJS](https://kubejs.com/) on your Minecraft server.
2. Install any dependencies required by the script you want to use.
3. Download or clone this repository.
4. Copy the required `.js` files into:

```text
server/kubejs/server_scripts/
```

5. Start or restart the server.
6. Configure the generated/configuration values as required.

For `dailyquests.js`, the default configuration is automatically created at:

```text
server/kubejs/config/dailyquests.json
```

For `multi-acc.js`, configure the webhook and permissions directly in the script.

## ⚙️ Configuration

Configuration depends on the individual script.

### Daily Quests

`dailyquests.json` controls:
- Reset check interval
- Reroll permission
- Easy, medium, and hard rewards
- Easy, medium, and hard quest pools
- Quest names, descriptions, item IDs, amounts, and reward types

Example structure:

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

### Multi-Account

Set the Discord webhook URL if Discord notifications are required:

```js
var DISCORD_WEBHOOK_URL = "REPLACE_ME";
```

Do not commit a real Discord webhook URL to a public repository.

## 📦 Dependencies

Dependencies vary by script.

| Script | KubeJS | LuckPerms | KubeJSHTTP |
|---|:---:|:---:|:---:|
| `multi-acc.js` | ✅ | ✅ | ✅ |
| `dailyquests.js` | ✅ | ✅ | ❌ |

Always check the script header and configuration before installation.

## ✏️ Modifying the Scripts

You are welcome to modify the scripts in accordance with the repository license.

When modifying a script:
- Preserve the original author attribution.
- Preserve the original copyright notice.
- Preserve the license notice.
- Document substantial changes when appropriate.

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

## 🤝 Contributions

Issues and pull requests are welcome.

When submitting changes:
- Explain what the change does.
- Test the script before submitting it.
- Preserve existing attribution and licensing information.
- Document new dependencies or configuration requirements.
- Avoid committing secrets such as Discord webhook URLs.

## 📄 License

The scripts in this repository are distributed under the **MIT License**.

See [`LICENSE`](LICENSE) for the full license text.

## 👤 Author

Created and maintained by **@ZareMate**.

**GitHub:** https://github.com/ZareMate
