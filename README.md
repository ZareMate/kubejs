# KubeJS Scripts

A collection of **KubeJS scripts** created and maintained by **ZareMate**.

This repository contains scripts intended for use with Minecraft servers and modpacks running [KubeJS](https://kubejs.com/). The scripts are primarily focused on server-side automation, utilities, integrations, and custom functionality.

## 📁 Repository

The repository is available at:

https://github.com/ZareMate/kubejs

## 📜 Scripts

### `multi-acc.js`

A KubeJS script for detecting and managing players using multiple accounts.

The script integrates with **LuckPerms** and can provide functionality such as:

* Checking player IP/account associations
* Detecting multiple accounts
* Permission-based commands
* Sending alerts through Discord webhooks

> **Note:** Some scripts may require additional mods, libraries, permissions, or external services to function correctly. Check the comments at the top of each script for dependencies and configuration instructions.

## 🛠️ Installation

1. Install [KubeJS](https://kubejs.com/) on your Minecraft server.
2. Download or clone this repository.
3. Copy the required `.js` script(s) into your KubeJS server scripts directory, typically:

```text
server/kubejs/server_scripts/
```

4. Configure any required values inside the script.
5. Restart the server or reload the KubeJS scripts where supported.

## ⚙️ Configuration

Configuration is generally done directly inside each script.

Before using a script, check for variables such as:

```js
const DISCORD_WEBHOOK_URL = 'REPLACE_ME';
```

Replace placeholder values with your own configuration where required.

Scripts may also require specific permissions or integrations. These requirements are documented within the individual files whenever applicable.

## 📦 Dependencies

Dependencies vary between scripts.

Common dependencies may include:

* [KubeJS](https://kubejs.com/)
* [LuckPerms](https://luckperms.net/)
* Other Minecraft mods or server-side integrations

Always check the individual script before installation.

## ✏️ Modifying the Scripts

You are welcome to modify the scripts in accordance with the repository license.

When modifying a script, please preserve the original author attribution and license notice.

If you make substantial modifications, you may add yourself as a modifier in the file's header while retaining the original author information.

Example:

```js
/*
 * Copyright (c) 2026 @ZareMate
 * Original author: @ZareMate
 *
 * Modified by: YourName
 *
 * Licensed under the MIT License.
 */
```

## 🤝 Contributions

Issues and pull requests are welcome.

When submitting changes, please:

* Explain what the script or change does.
* Test the script before submitting it.
* Preserve existing attribution and licensing information.
* Document any new dependencies or configuration requirements.

## 📄 License

The scripts in this repository are distributed under the **MIT License**.

See [`LICENSE`](LICENSE) for the full license text.

## 👤 Author

Created and maintained by **@ZareMate**.

GitHub:
https://github.com/ZareMate
