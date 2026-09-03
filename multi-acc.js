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

// Dependencies: LuckPerms, KubeJSHTTP

var DISCORD_WEBHOOK_URL = "REPLACE_ME";

var MULTIACCOUNT_PERMISSION_CHECKIP = "multiaccount.command.checkip";
var MULTIACCOUNT_PERMISSION_ALERT = "multiaccount.alert";

var LuckPermsApiProvider = Java.loadClass(
	"net.luckperms.api.LuckPermsProvider",
);

var HttpAPI = Java.loadClass("com.awizo.KubeJSHTTP.HttpAPI");

var luckPermsApi = null;
var playerIPMap = new Map();

function getLuckPerms() {
	if (luckPermsApi) {
		return luckPermsApi;
	}

	try {
		luckPermsApi = LuckPermsApiProvider.get();

		console.log("[Multi-Account] luckPermsApi API loaded successfully!");

		return luckPermsApi;
	} catch (error) {
		return null;
	}
}

function hasPermission(player, permission) {
	var api = getLuckPerms();

	if (!api || !player) {
		return false;
	}

	try {
		return api
			.getUserManager()
			.getUser(player.uuid)
			.getCachedData()
			.getPermissionData()
			.checkPermission(permission)
			.asBoolean();
	} catch (error) {
		console.error(
			"[Multi-Account] Failed to check permission " +
				permission +
				" for " +
				player.username +
				": " +
				error,
		);

		return false;
	}
}

function getPlayerIP(player) {
	try {
		var ip = player.ipAddress;

		if (!ip) {
			return null;
		}

		if (ip.includes("/")) {
			ip = ip.split("/")[1];
		}

		if (ip.includes(":")) {
			ip = ip.split(":")[0];
		}

		return ip;
	} catch (error) {
		console.warn(
			"[Multi-Account] Failed to get IP for " +
				player.username +
				": " +
				error,
		);

		return null;
	}
}

function sendPlayerNotification(player, otherPlayers) {
	player.tell(
		"§c[ALERT] §fMulti-account detected! Other accounts on your IP: §e" +
			otherPlayers.join(", "),
	);
}

function notifyStaff(server, playerName, otherPlayers) {
	var message =
		"§c[ADMIN] §fPlayer §6" +
		playerName +
		"§f has the same IP as: §e" +
		otherPlayers.join(", ");

	server.players.forEach((player) => {
		if (hasPermission(player, MULTIACCOUNT_PERMISSION_ALERT)) {
			player.tell(message);
		}
	});
}

function sendDiscordNotification(player, otherPlayers) {
	var playerName =
		player && typeof player.getName === "function"
			? player.getName().getString()
			: "Unknown";

	try {
		HttpAPI.post(
			DISCORD_WEBHOOK_URL,
			JSON.stringify({
				embeds: [
					{
						title: "Multi-Account Alert",
						description:
							"Player: " +
							playerName +
							"\n" +
							"Other Accounts on IP: " +
							otherPlayers.join(", ") +
							"\n" +
							"Timestamp: <t:" +
							Math.floor(Date.now() / 1000) +
							":S>",
						color: 3447003,
						footer: {
							text: "Sputnik watch",
						},
					},
				],
			}),
		);
	} catch (e) {
		console.error("[SputnikWatch] Failed to send webhook: " + e);
	}
}

function rebuildPlayerIPMap(server) {
	playerIPMap.clear();

	server.players.forEach((player) => {
		var name = player.username;
		var ip = getPlayerIP(player);

		if (!ip) {
			return;
		}

		if (!playerIPMap.has(ip)) {
			playerIPMap.set(ip, new Set());
		}

		playerIPMap.get(ip).add(name);
	});

	console.log(
		"[Multi-Account] IP map rebuilt. Tracking " +
			playerIPMap.size +
			" IP(s).",
	);
}

function sendCheckIPWebhook(player, groups) {
	var playerName =
		player && typeof player.getName === "function"
			? player.getName().getString()
			: "Unknown";

	if (groups.length === 0) {
		return;
	}

	var groupText = groups
		.map((players, index) => {
			return "**Group " + (index + 1) + ":** " + players.join(", ");
		})
		.join("\n");

	try {
		HttpAPI.post(
			DISCORD_WEBHOOK_URL,
			JSON.stringify({
				embeds: [
					{
						title: "IP Check",
						description:
							"Requested by: " +
							playerName +
							"\n\n" +
							groupText +
							"\n\n" +
							"Timestamp: <t:" +
							Math.floor(Date.now() / 1000) +
							":S>",
						color: 3447003,
						footer: {
							text: "Sputnik watch",
						},
					},
				],
			}),
		);

		console.log("[Multi-Account] /checkip results sent to Discord.");
	} catch (e) {
		console.error("[SputnikWatch] Failed to send /checkip webhook: " + e);
	}
}

function checkMultiAccount(server, player) {
	var name = player.username;
	var ip = getPlayerIP(player);

	if (!ip) {
		return;
	}

	if (!playerIPMap.has(ip)) {
		playerIPMap.set(ip, new Set());
	}

	var players = playerIPMap.get(ip);

	var otherPlayers = Array.from(players).filter(
		(playerName) => playerName !== name,
	);

	if (otherPlayers.length > 0) {
		console.log(
			"[Multi-Account] ALERT: " +
				name +
				" shares IP with: " +
				otherPlayers.join(", "),
		);

		sendPlayerNotification(player, otherPlayers);

		notifyStaff(server, name, otherPlayers);

		sendDiscordNotification(player, otherPlayers);
	}

	players.add(name);
}

function removePlayer(name) {
	for (var [ip, players] of playerIPMap) {
		if (!players.delete(name)) {
			continue;
		}

		console.log(
			"[Multi-Account] Removed " +
				name +
				" from IP tracking (" +
				ip +
				")",
		);

		if (players.size === 0) {
			playerIPMap.delete(ip);
		}

		break;
	}
}

PlayerEvents.loggedIn((event) => {
	var player = event.player;
	var server = event.server;

	console.log(
		"[Multi-Account] " +
			player.username +
			" joined from: " +
			getPlayerIP(player),
	);

	server.schedule(10, () => {
		checkMultiAccount(server, player);
	});
});

PlayerEvents.loggedOut((event) => {
	var name = event.player.username;

	console.log("[Multi-Account] " + name + " left the server");

	removePlayer(name);
});

ServerEvents.commandRegistry((event) => {
	const { commands: Commands } = event;

	event.register(
		Commands.literal("checkip")
			.requires(
				(source) =>
					source.isPlayer() &&
					(source.hasPermission(3) ||
						hasPermission(
							source.player,
							MULTIACCOUNT_PERMISSION_CHECKIP,
						)),
			)
			.executes((ctx) => {
				var source = ctx.source;
				var server = source.server;

				var group = 1;
				var found = false;
				var groups = [];

				rebuildPlayerIPMap(server);

				source.sendSuccess(Text.of("§6Players sharing an IP:"), false);

				for (var players of playerIPMap.values()) {
					if (players.size <= 1) {
						continue;
					}

					found = true;

					var playerList = Array.from(players);

					groups.push(playerList);

					source.sendSuccess(
						Text.of(`§7Group ${group}: §e${playerList.join(", ")}`),
						false,
					);

					group++;
				}

				if (!found) {
					source.sendSuccess(
						Text.of("§7No players currently share an IP."),
						false,
					);
				} else {
					sendCheckIPWebhook(source.player, groups);
				}

				return 1;
			}),
	);
});

console.log("[Multi-Account] Script loaded successfully!");

console.log(
	"[Multi-Account] /checkip permission: " + MULTIACCOUNT_PERMISSION_CHECKIP,
);

console.log(
	"[Multi-Account] Chat alert permission: " + MULTIACCOUNT_PERMISSION_ALERT,
);

console.log("[Multi-Account] Commands: /checkip");

console.log(
	"[Multi-Account] Webhook: " +
		(DISCORD_WEBHOOK_URL !== "REPLACE_ME"
			? "✓ Configured"
			: "✗ Not configured"),
);
