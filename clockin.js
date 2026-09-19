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

// Dependencies: LuckPerms
(function () {
	var CLOCKIN_FILE = "kubejs/data/clockin.json";
	var PERMISSION_LOGIN = "clockin.login";
	var PERMISSION_STATUS = "clockin.command.status";
	var PERMISSION_IN = "clockin.command.in";
	var PERMISSION_OUT = "clockin.command.out";
	var PERMISSION_LEADERBOARD = "clockin.command.leaderboard";
	var PERMISSION_INFO = "clockin.command.info";

	var LuckPermsApiProvider = Java.loadClass(
		"net.luckperms.api.LuckPermsProvider",
	);

	var luckPermsApi = null;

	function getLuckPerms() {
		if (luckPermsApi) {
			return luckPermsApi;
		}

		try {
			luckPermsApi = LuckPermsApiProvider.get();
			console.log("[ClockIn] LuckPerms API loaded.");
			return luckPermsApi;
		} catch (error) {
			console.error(
				"[ClockIn] Failed to load LuckPerms API: " + String(error),
			);
			return null;
		}
	}

	function hasPermission(player, permission) {
		var api = getLuckPerms();

		if (!api || !player) {
			return false;
		}

		try {
			var user = api.getUserManager().getUser(player.uuid);

			if (!user) {
				return false;
			}

			return user
				.getCachedData()
				.getPermissionData()
				.checkPermission(permission)
				.asBoolean();
		} catch (error) {
			console.error(
				"[ClockIn] Permission check failed for " +
					String(player.username) +
					": " +
					String(error),
			);
			return false;
		}
	}

	function sourceHasPermission(source, permission) {
		if (!source) {
			return false;
		}

		if (source.hasPermission(3)) {
			return true;
		}

		if (!source.isPlayer()) {
			return false;
		}

		return hasPermission(source.player, permission);
	}

	function sourceHasAnyCommandPermission(source) {
		return (
			sourceHasPermission(source, PERMISSION_STATUS) ||
			sourceHasPermission(source, PERMISSION_IN) ||
			sourceHasPermission(source, PERMISSION_OUT) ||
			sourceHasPermission(source, PERMISSION_LEADERBOARD) ||
			sourceHasPermission(source, PERMISSION_INFO)
		);
	}

	var data = {
		version: 1,
		players: {},
	};

	function createEmptyData() {
		return {
			version: 1,
			players: {},
		};
	}

	function createPlayerData(uuid, name) {
		return {
			name: String(name),
			totalSeconds: 0,
			clockedIn: false,
			clockInAt: 0,
			autoClockedOut: false,
		};
	}

	function getMapValue(object, key) {
		if (!object) {
			return null;
		}

		try {
			if (typeof object.get === "function") {
				var value = object.get(key);

				if (value !== null && value !== undefined) {
					return value;
				}
			}
		} catch (error) {}

		try {
			if (object[key] !== undefined && object[key] !== null) {
				return object[key];
			}
		} catch (error) {}

		return null;
	}

	function toNumber(value, fallback) {
		if (value === null || value === undefined) {
			return fallback;
		}

		try {
			var number = Number(value);

			if (isFinite(number)) {
				return number;
			}
		} catch (error) {}

		return fallback;
	}

	function toBoolean(value, fallback) {
		if (value === true || value === false) {
			return value;
		}

		var text = String(value).toLowerCase();

		if (text === "true") {
			return true;
		}

		if (text === "false") {
			return false;
		}

		return fallback;
	}

	function normalisePlayerData(input) {
		var playerData = {
			name: "Unknown",
			totalSeconds: 0,
			clockedIn: false,
			clockInAt: 0,
			autoClockedOut: false,
		};

		if (!input) {
			return playerData;
		}

		var name = getMapValue(input, "name");
		var totalSeconds = getMapValue(input, "totalSeconds");
		var clockedIn = getMapValue(input, "clockedIn");
		var clockInAt = getMapValue(input, "clockInAt");
		var autoClockedOut = getMapValue(input, "autoClockedOut");

		if (name !== null && name !== undefined && String(name).length > 0) {
			playerData.name = String(name);
		}

		playerData.totalSeconds = Math.max(
			0,
			Math.floor(toNumber(totalSeconds, 0)),
		);

		playerData.clockInAt = Math.max(0, Math.floor(toNumber(clockInAt, 0)));

		playerData.clockedIn = toBoolean(clockedIn, false);
		playerData.autoClockedOut = toBoolean(autoClockedOut, false);

		return playerData;
	}

	function loadData() {
		try {
			var loaded = JsonIO.read(CLOCKIN_FILE);

			console.log(loaded);

			data = createEmptyData();

			if (!loaded) {
				console.log("[ClockIn] No existing data file found.");
				saveData();
				return;
			}

			var version = getMapValue(loaded, "version");

			if (version !== null && version !== undefined) {
				data.version = Math.floor(toNumber(version, 1));
			}

			var loadedPlayers = getMapValue(loaded, "players");

			if (!loadedPlayers) {
				saveData();
				return;
			}

			try {
				if (typeof loadedPlayers.entrySet === "function") {
					var entries = loadedPlayers.entrySet().iterator();

					while (entries.hasNext()) {
						var entry = entries.next();
						var uuid = String(entry.getKey());
						var playerData = normalisePlayerData(entry.getValue());

						data.players[uuid] = playerData;
					}
				} else {
					for (var uuid in loadedPlayers) {
						var input = loadedPlayers[uuid];

						if (!input) {
							continue;
						}

						data.players[String(uuid)] = normalisePlayerData(input);
					}
				}
			} catch (error) {
				console.error(
					"[ClockIn] Failed to load player records: " + String(error),
				);
			}

			console.log(
				"[ClockIn] Loaded " + countPlayers() + " player record(s).",
			);

			saveData();
		} catch (error) {
			console.error(
				"[ClockIn] Failed to load clock-in data: " + String(error),
			);

			data = createEmptyData();
			saveData();
		}
	}

	function saveData() {
		try {
			var output = {
				version: 1,
				players: {},
			};

			for (var uuid in data.players) {
				var playerData = data.players[uuid];

				if (!playerData) {
					continue;
				}

				var totalSeconds = toNumber(playerData.totalSeconds, 0);

				if (!isFinite(totalSeconds) || totalSeconds < 0) {
					totalSeconds = 0;
				}

				var clockInAt = toNumber(playerData.clockInAt, 0);

				if (!isFinite(clockInAt) || clockInAt < 0) {
					clockInAt = 0;
				}

				output.players[String(uuid)] = {
					name: String(playerData.name || "Unknown"),
					totalSeconds: Math.floor(totalSeconds),
					clockedIn: playerData.clockedIn === true,
					clockInAt: Math.floor(clockInAt),
					autoClockedOut: playerData.autoClockedOut === true,
				};
			}

			JsonIO.write(CLOCKIN_FILE, output);

			console.log(
				"[ClockIn] Saved " + countPlayers() + " player record(s).",
			);
		} catch (error) {
			console.error("[ClockIn] FAILED TO SAVE DATA: " + String(error));
		}
	}

	function countPlayers() {
		var count = 0;

		for (var uuid in data.players) {
			count++;
		}

		return count;
	}

	function getPlayerUuid(player) {
		return String(player.uuid);
	}

	function getOrCreatePlayerData(player) {
		var uuid = getPlayerUuid(player);
		var playerData = data.players[uuid];

		if (!playerData) {
			playerData = createPlayerData(uuid, player.username);

			data.players[uuid] = playerData;
			saveData();
		} else {
			playerData.name = String(player.username);

			playerData.totalSeconds = Math.max(
				0,
				Math.floor(toNumber(playerData.totalSeconds, 0)),
			);

			playerData.clockInAt = Math.max(
				0,
				Math.floor(toNumber(playerData.clockInAt, 0)),
			);
		}

		return playerData;
	}

	function findPlayerDataByUuid(uuid) {
		return data.players[String(uuid)] || null;
	}

	function findPlayerDataByName(name) {
		var target = String(name).toLowerCase();

		for (var uuid in data.players) {
			var playerData = data.players[uuid];

			if (!playerData) {
				continue;
			}

			if (String(playerData.name).toLowerCase() === target) {
				return playerData;
			}
		}

		return null;
	}

	function getCurrentSessionSeconds(playerData) {
		if (
			!playerData ||
			playerData.clockedIn !== true ||
			!playerData.clockInAt
		) {
			return 0;
		}

		var clockInAt = toNumber(playerData.clockInAt, 0);

		if (!isFinite(clockInAt) || clockInAt <= 0) {
			return 0;
		}

		var elapsed = Math.floor((Date.now() - clockInAt) / 1000);

		if (!isFinite(elapsed) || elapsed < 0) {
			return 0;
		}

		return elapsed;
	}

	function getTotalSeconds(playerData) {
		if (!playerData) {
			return 0;
		}

		var totalSeconds = toNumber(playerData.totalSeconds, 0);

		if (!isFinite(totalSeconds) || totalSeconds < 0) {
			totalSeconds = 0;
		}

		var currentSession = getCurrentSessionSeconds(playerData);

		return Math.max(0, Math.floor(totalSeconds) + currentSession);
	}

	function formatDuration(totalSeconds) {
		var seconds = toNumber(totalSeconds, 0);

		if (!isFinite(seconds) || seconds < 0) {
			seconds = 0;
		}

		seconds = Math.floor(seconds);

		var days = Math.floor(seconds / 86400);
		seconds %= 86400;

		var hours = Math.floor(seconds / 3600);
		seconds %= 3600;

		var minutes = Math.floor(seconds / 60);
		seconds %= 60;

		if (days > 0) {
			return (
				days +
				"d " +
				String(hours).padStart(2, "0") +
				"h " +
				String(minutes).padStart(2, "0") +
				"m " +
				String(seconds).padStart(2, "0") +
				"s"
			);
		}

		if (hours > 0) {
			return (
				hours +
				"h " +
				String(minutes).padStart(2, "0") +
				"m " +
				String(seconds).padStart(2, "0") +
				"s"
			);
		}

		if (minutes > 0) {
			return minutes + "m " + String(seconds).padStart(2, "0") + "s";
		}

		return seconds + "s";
	}

	function sendSeparator(player) {
		player.tell(Text.of("────────────────────────────────────").darkGray());
	}

	function sendLoginPrompt(player) {
		player.tell("");

		player.tell(Text.of("ADMINISTRATION TIME TRACKING").gold().bold());

		player.tell(
			Text.of("You can track your administration help time.").gray(),
		);

		player.tell(
			Text.of("[ CLOCK IN ]")
				.green()
				.bold()
				.clickRunCommand("/clockin in"),
		);

		player.tell(Text.of("Use /clockin to view your tracked time.").gray());

		player.tell("");
	}

	function clockIn(player) {
		var playerData = getOrCreatePlayerData(player);

		if (playerData.clockedIn) {
			player.tell(Text.of("You are already clocked in.").yellow());

			return false;
		}

		playerData.clockedIn = true;
		playerData.clockInAt = Date.now();
		playerData.autoClockedOut = false;

		saveData();

		player.tell(Text.of("You are now clocked in.").green());

		player.tell(
			Text.of("Administration time tracking has started.").gray(),
		);

		return true;
	}

	function clockOut(player, automatic) {
		var playerData = getOrCreatePlayerData(player);

		if (!playerData.clockedIn) {
			player.tell(Text.of("You are not currently clocked in.").yellow());

			return false;
		}

		var sessionSeconds = getCurrentSessionSeconds(playerData);

		var totalSeconds = toNumber(playerData.totalSeconds, 0);

		if (!isFinite(totalSeconds) || totalSeconds < 0) {
			totalSeconds = 0;
		}

		playerData.totalSeconds =
			Math.floor(totalSeconds) + Math.floor(sessionSeconds);

		playerData.clockedIn = false;
		playerData.clockInAt = 0;
		playerData.autoClockedOut = automatic === true;

		saveData();

		if (automatic) {
			player.tell(
				Text.of(
					"You were clocked out because you left the server.",
				).yellow(),
			);

			player.tell(
				Text.of("Session time: ")
					.gray()
					.append(Text.of(formatDuration(sessionSeconds)).aqua()),
			);

			return true;
		}

		player.tell(Text.of("You are now clocked out.").green());

		player.tell(
			Text.of("Session time: ")
				.gray()
				.append(Text.of(formatDuration(sessionSeconds)).aqua()),
		);

		player.tell(
			Text.of("Total administration time: ")
				.gray()
				.append(
					Text.of(formatDuration(playerData.totalSeconds)).aqua(),
				),
		);

		return true;
	}

	function showStatus(player) {
		var playerData = getOrCreatePlayerData(player);
		var total = getTotalSeconds(playerData);

		sendSeparator(player);

		player.tell(Text.of("ADMIN CLOCK-IN").gold().bold());

		if (playerData.clockedIn) {
			player.tell(
				Text.of("Status: ")
					.gray()
					.append(Text.of("CLOCKED IN").green().bold()),
			);

			player.tell(
				Text.of("Current session: ")
					.gray()
					.append(
						Text.of(
							formatDuration(
								getCurrentSessionSeconds(playerData),
							),
						).aqua(),
					),
			);

			player.tell(
				Text.of("Total time: ")
					.gray()
					.append(Text.of(formatDuration(total)).aqua()),
			);

			player.tell("");

			player.tell(
				Text.of("[ CLOCK OUT ]")
					.red()
					.bold()
					.clickRunCommand("/clockin out"),
			);
		} else {
			player.tell(
				Text.of("Status: ")
					.gray()
					.append(Text.of("CLOCKED OUT").red().bold()),
			);

			player.tell(
				Text.of("Total time: ")
					.gray()
					.append(Text.of(formatDuration(total)).aqua()),
			);

			player.tell("");

			player.tell(
				Text.of("[ CLOCK IN ]")
					.green()
					.bold()
					.clickRunCommand("/clockin in"),
			);
		}

		sendSeparator(player);
	}

	function getLeaderboard() {
		var entries = [];

		for (var uuid in data.players) {
			var playerData = data.players[uuid];

			if (!playerData) {
				continue;
			}

			entries.push({
				name: String(playerData.name || "Unknown"),
				time: getTotalSeconds(playerData),
			});
		}

		entries.sort(function (a, b) {
			if (b.time !== a.time) {
				return b.time - a.time;
			}

			return a.name.localeCompare(b.name);
		});

		return entries;
	}

	function showLeaderboard(source) {
		var entries = getLeaderboard();

		source.sendSuccess(
			Text.of("────────────────────────────────────").darkGray(),
			false,
		);

		source.sendSuccess(
			Text.of("ADMIN CLOCK-IN LEADERBOARD").gold().bold(),
			false,
		);

		if (entries.length === 0) {
			source.sendSuccess(
				Text.of("No administration time has been recorded yet.").gray(),
				false,
			);

			source.sendSuccess(
				Text.of("────────────────────────────────────").darkGray(),
				false,
			);

			return;
		}

		var limit = Math.min(entries.length, 10);

		for (var i = 0; i < limit; i++) {
			var entry = entries[i];

			source.sendSuccess(
				Text.of("#" + (i + 1) + " ")
					.gold()
					.append(Text.of(entry.name).white())
					.append(Text.of(" — ").darkGray())
					.append(Text.of(formatDuration(entry.time)).aqua()),
				false,
			);
		}

		source.sendSuccess(
			Text.of("Showing top " + limit + " players.").gray(),
			false,
		);

		source.sendSuccess(
			Text.of("────────────────────────────────────").darkGray(),
			false,
		);
	}

	function showPlayerInfo(source, targetName) {
		var playerData = findPlayerDataByName(targetName);

		if (!playerData) {
			source.sendFailure(
				Text.of("No clock-in data found for " + targetName + ".").red(),
			);

			return false;
		}

		var total = getTotalSeconds(playerData);

		source.sendSuccess(
			Text.of("────────────────────────────────────").darkGray(),
			false,
		);

		source.sendSuccess(Text.of("ADMIN CLOCK-IN INFO").gold().bold(), false);

		source.sendSuccess(
			Text.of("Player: ").gray().append(Text.of(playerData.name).white()),
			false,
		);

		source.sendSuccess(
			Text.of("Status: ")
				.gray()
				.append(
					Text.of(
						playerData.clockedIn ? "CLOCKED IN" : "CLOCKED OUT",
					).color(playerData.clockedIn ? "green" : "red"),
				),
			false,
		);

		if (playerData.clockedIn) {
			source.sendSuccess(
				Text.of("Current session: ")
					.gray()
					.append(
						Text.of(
							formatDuration(
								getCurrentSessionSeconds(playerData),
							),
						).aqua(),
					),
				false,
			);
		}

		source.sendSuccess(
			Text.of("Total time: ")
				.gray()
				.append(Text.of(formatDuration(total)).aqua()),
			false,
		);

		source.sendSuccess(
			Text.of("────────────────────────────────────").darkGray(),
			false,
		);

		return true;
	}

	ServerEvents.commandRegistry(function (event) {
		var Commands = event.commands;
		var Arguments = event.arguments;

		var clockInCommand = Commands.literal("in")
			.requires(function (source) {
				return (
					source.isPlayer() &&
					sourceHasPermission(source, PERMISSION_IN)
				);
			})
			.executes(function (ctx) {
				try {
					return clockIn(ctx.source.player) ? 1 : 0;
				} catch (error) {
					console.error(
						"[ClockIn] /clockin in error: " + String(error),
					);

					ctx.source.sendFailure(
						Text.of("Clock-in error: " + String(error)).red(),
					);

					return 0;
				}
			});

		var clockOutCommand = Commands.literal("out")
			.requires(function (source) {
				return (
					source.isPlayer() &&
					sourceHasPermission(source, PERMISSION_OUT)
				);
			})
			.executes(function (ctx) {
				try {
					return clockOut(ctx.source.player, false) ? 1 : 0;
				} catch (error) {
					console.error(
						"[ClockIn] /clockin out error: " + String(error),
					);

					ctx.source.sendFailure(
						Text.of("Clock-out error: " + String(error)).red(),
					);

					return 0;
				}
			});

		var leaderboardCommand = Commands.literal("leaderboard")
			.requires(function (source) {
				return sourceHasPermission(source, PERMISSION_LEADERBOARD);
			})
			.executes(function (ctx) {
				try {
					showLeaderboard(ctx.source);
					return 1;
				} catch (error) {
					console.error(
						"[ClockIn] /clockin leaderboard error: " +
							String(error),
					);

					ctx.source.sendFailure(
						Text.of("Leaderboard error: " + String(error)).red(),
					);

					return 0;
				}
			});

		var infoCommand = Commands.literal("info")
			.requires(function (source) {
				return sourceHasPermission(source, PERMISSION_INFO);
			})
			.then(
				Commands.argument(
					"player",
					Arguments.STRING.create(event),
				).executes(function (ctx) {
					try {
						var targetName = Arguments.STRING.getResult(
							ctx,
							"player",
						);

						return showPlayerInfo(ctx.source, targetName) ? 1 : 0;
					} catch (error) {
						console.error(
							"[ClockIn] /clockin info error: " + String(error),
						);

						ctx.source.sendFailure(
							Text.of("Info error: " + String(error)).red(),
						);

						return 0;
					}
				}),
			);

		var clockInRoot = Commands.literal("clockin")
			.requires(function (source) {
				return sourceHasAnyCommandPermission(source);
			})
			.executes(function (ctx) {
				try {
					if (!ctx.source.isPlayer()) {
						ctx.source.sendFailure(
							Text.of("Only players can use /clockin.").red(),
						);

						return 0;
					}

					if (!sourceHasPermission(ctx.source, PERMISSION_STATUS)) {
						ctx.source.sendFailure(
							Text.of(
								"You do not have permission to use /clockin.",
							).red(),
						);

						return 0;
					}

					showStatus(ctx.source.player);
					return 1;
				} catch (error) {
					console.error("[ClockIn] /clockin error: " + String(error));

					ctx.source.sendFailure(
						Text.of(
							"Clock-in status error: " + String(error),
						).red(),
					);

					return 0;
				}
			});

		clockInRoot.then(clockInCommand);
		clockInRoot.then(clockOutCommand);
		clockInRoot.then(leaderboardCommand);
		clockInRoot.then(infoCommand);

		event.register(clockInRoot);
	});

	PlayerEvents.loggedIn(function (event) {
		try {
			var player = event.player;
			var uuid = String(player.uuid);
			var playerData = findPlayerDataByUuid(uuid);

			if (playerData && playerData.clockedIn) {
				var sessionSeconds = getCurrentSessionSeconds(playerData);

				var totalSeconds = toNumber(playerData.totalSeconds, 0);

				if (!isFinite(totalSeconds) || totalSeconds < 0) {
					totalSeconds = 0;
				}

				playerData.totalSeconds =
					Math.floor(totalSeconds) + Math.floor(sessionSeconds);

				playerData.clockedIn = false;
				playerData.clockInAt = 0;
				playerData.autoClockedOut = true;
				playerData.name = String(player.username);

				saveData();
			}

			if (playerData && playerData.autoClockedOut) {
				player.tell(
					Text.of(
						"You were clocked out because you left the server.",
					).yellow(),
				);

				player.tell(
					Text.of(
						"Your previous administration session has been closed.",
					).gray(),
				);

				playerData.autoClockedOut = false;
				saveData();
			}

			if (hasPermission(player, PERMISSION_LOGIN)) {
				sendLoginPrompt(player);
			}
		} catch (error) {
			console.error("[ClockIn] Login handler error: " + String(error));
		}
	});

	PlayerEvents.loggedOut(function (event) {
		try {
			var player = event.player;
			var uuid = String(player.uuid);
			var playerData = findPlayerDataByUuid(uuid);

			if (!playerData || !playerData.clockedIn) {
				return;
			}

			var sessionSeconds = getCurrentSessionSeconds(playerData);

			var totalSeconds = toNumber(playerData.totalSeconds, 0);

			if (!isFinite(totalSeconds) || totalSeconds < 0) {
				totalSeconds = 0;
			}

			playerData.totalSeconds =
				Math.floor(totalSeconds) + Math.floor(sessionSeconds);

			playerData.clockedIn = false;
			playerData.clockInAt = 0;
			playerData.autoClockedOut = true;
			playerData.name = String(player.username);

			saveData();

			console.log(
				"[ClockIn] Automatically clocked out " +
					String(player.username) +
					" after " +
					formatDuration(sessionSeconds) +
					".",
			);
		} catch (error) {
			console.error("[ClockIn] Logout handler error: " + String(error));
		}
	});

	loadData();

	console.log("[ClockIn] Loaded successfully.");
})();
