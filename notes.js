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
	var NOTES_FILE = "kubejs/data/notes.json";

	var PERMISSION_READ = "note.read";
	var PERMISSION_ADD = "note.add";
	var PERMISSION_REMOVE = "note.rm";
	var PERMISSION_CLEAR = "note.clear";

	var LuckPermsApiProvider = Java.loadClass(
		"net.luckperms.api.LuckPermsProvider",
	);

	var luckPermsApi = null;

	var data = {
		version: 1,
		players: {},
	};

	function getLuckPerms() {
		if (luckPermsApi) {
			return luckPermsApi;
		}

		try {
			luckPermsApi = LuckPermsApiProvider.get();
			return luckPermsApi;
		} catch (error) {
			console.error(
				"[Notes] Failed to load LuckPerms API: " + String(error),
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
			console.error("[Notes] Permission check failed: " + String(error));

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

	function hasAnyPermission(source) {
		return (
			sourceHasPermission(source, PERMISSION_READ) ||
			sourceHasPermission(source, PERMISSION_ADD) ||
			sourceHasPermission(source, PERMISSION_REMOVE) ||
			sourceHasPermission(source, PERMISSION_CLEAR)
		);
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

	function getNumber(value, fallback) {
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

	function createPlayerData(name) {
		return {
			name: String(name),
			notes: {},
		};
	}

	function createNote(author, text) {
		return {
			author: String(author),
			text: String(text),
			createdAt: Date.now(),
		};
	}

	function normaliseNote(input) {
		var note = {
			author: "Unknown",
			text: "",
			createdAt: 0,
		};

		if (!input) {
			return note;
		}

		var author = getMapValue(input, "author");

		var text = getMapValue(input, "text");

		var createdAt = getMapValue(input, "createdAt");

		if (author !== null && author !== undefined) {
			note.author = String(author);
		}

		if (text !== null && text !== undefined) {
			note.text = String(text);
		}

		note.createdAt = Math.floor(getNumber(createdAt, 0));

		return note;
	}

	function normalisePlayer(input) {
		var player = {
			name: "Unknown",
			notes: {},
		};

		if (!input) {
			return player;
		}

		var name = getMapValue(input, "name");

		if (name !== null && name !== undefined) {
			player.name = String(name);
		}

		var loadedNotes = getMapValue(input, "notes");

		if (!loadedNotes) {
			return player;
		}

		try {
			if (typeof loadedNotes.entrySet === "function") {
				var entries = loadedNotes.entrySet().iterator();

				while (entries.hasNext()) {
					var entry = entries.next();

					var adminUuid = String(entry.getKey());

					player.notes[adminUuid] = normaliseNote(entry.getValue());
				}
			} else {
				for (var adminUuid in loadedNotes) {
					var note = loadedNotes[adminUuid];

					if (!note) {
						continue;
					}

					player.notes[String(adminUuid)] = normaliseNote(note);
				}
			}
		} catch (error) {
			console.error("[Notes] Failed to load notes: " + String(error));
		}

		return player;
	}

	function loadData() {
		try {
			var loaded = JsonIO.read(NOTES_FILE);

			data = {
				version: 1,
				players: {},
			};

			if (!loaded) {
				saveData();
				return;
			}

			var loadedPlayers = getMapValue(loaded, "players");

			if (!loadedPlayers) {
				saveData();
				return;
			}

			if (typeof loadedPlayers.entrySet === "function") {
				var entries = loadedPlayers.entrySet().iterator();

				while (entries.hasNext()) {
					var entry = entries.next();

					var uuid = String(entry.getKey());

					data.players[uuid] = normalisePlayer(entry.getValue());
				}
			} else {
				for (var uuid in loadedPlayers) {
					var player = loadedPlayers[uuid];

					if (!player) {
						continue;
					}

					data.players[String(uuid)] = normalisePlayer(player);
				}
			}

			console.log(
				"[Notes] Loaded " + countPlayers() + " player record(s).",
			);

			saveData();
		} catch (error) {
			console.error("[Notes] Failed to load data: " + String(error));

			data = {
				version: 1,
				players: {},
			};

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
				var player = data.players[uuid];

				if (!player) {
					continue;
				}

				if (!player.notes || typeof player.notes !== "object") {
					player.notes = {};
				}

				var playerOutput = {
					name: String(player.name || "Unknown"),
					notes: {},
				};

				for (var adminUuid in player.notes) {
					var note = player.notes[adminUuid];

					if (!note) {
						continue;
					}

					playerOutput.notes[String(adminUuid)] = {
						author: String(note.author || "Unknown"),
						text: String(note.text || ""),
						createdAt: Math.floor(getNumber(note.createdAt, 0)),
					};
				}

				output.players[String(uuid)] = playerOutput;
			}

			JsonIO.write(NOTES_FILE, output);

			console.log(
				"[Notes] Saved " + countPlayers() + " player record(s).",
			);
		} catch (error) {
			console.error("[Notes] Failed to save data: " + String(error));
		}
	}

	function countPlayers() {
		var count = 0;

		for (var uuid in data.players) {
			count++;
		}

		return count;
	}

	function getOnlinePlayer(name) {
		try {
			var players = Utils.server.getPlayerList().getPlayers();

			var target = String(name).toLowerCase();

			for (var i = 0; i < players.size(); i++) {
				var player = players.get(i);

				if (String(player.username).toLowerCase() === target) {
					return player;
				}
			}
		} catch (error) {
			console.error(
				"[Notes] Failed to find online player: " + String(error),
			);
		}

		return null;
	}

	function findPlayerUuidByName(name) {
		var online = getOnlinePlayer(name);

		if (online) {
			return String(online.uuid);
		}

		var target = String(name).toLowerCase();

		for (var uuid in data.players) {
			var player = data.players[uuid];

			if (!player) {
				continue;
			}

			if (String(player.name).toLowerCase() === target) {
				return String(uuid);
			}
		}

		return null;
	}

	function getOrCreatePlayer(uuid, name) {
		var key = String(uuid);

		var player = data.players[key];

		if (!player) {
			player = createPlayerData(name);

			data.players[key] = player;
		} else {
			player.name = String(name);

			if (!player.notes || typeof player.notes !== "object") {
				player.notes = {};
			}
		}

		return player;
	}

	function formatDate(timestamp) {
		var value = getNumber(timestamp, 0);

		if (value <= 0) {
			return "Unknown";
		}

		try {
			var date = new Date(value);

			function pad(number) {
				return String(number).padStart(2, "0");
			}

			return (
				date.getFullYear() +
				"-" +
				pad(date.getMonth() + 1) +
				"-" +
				pad(date.getDate()) +
				" " +
				pad(date.getHours()) +
				":" +
				pad(date.getMinutes())
			);
		} catch (error) {
			return "Unknown";
		}
	}

	function addNote(player, targetName, text) {
		var noteText = String(text || "").trim();

		if (noteText.length === 0) {
			player.tell(Text.of("Note cannot be empty.").red());

			return false;
		}

		var targetUuid = findPlayerUuidByName(targetName);

		if (!targetUuid) {
			player.tell(Text.of("Player not found.").red());

			return false;
		}

		var online = getOnlinePlayer(targetName);

		var targetNameStored;

		if (online) {
			targetNameStored = String(online.username);
		} else {
			targetNameStored = String(data.players[targetUuid].name);
		}

		var targetData = getOrCreatePlayer(targetUuid, targetNameStored);

		if (!targetData.notes || typeof targetData.notes !== "object") {
			targetData.notes = {};
		}

		var adminUuid = String(player.uuid);

		targetData.notes[adminUuid] = createNote(player.username, noteText);

		saveData();

		player.tell(
			Text.of("Note saved for ")
				.gray()
				.append(Text.of(targetData.name).white()),
		);

		return true;
	}

	function removeNote(player, targetName) {
		var targetUuid = findPlayerUuidByName(targetName);

		if (!targetUuid) {
			player.tell(Text.of("Player not found.").red());

			return false;
		}

		var targetData = data.players[targetUuid];

		if (!targetData.notes || typeof targetData.notes !== "object") {
			targetData.notes = {};
		}

		var adminUuid = String(player.uuid);

		if (!targetData.notes[adminUuid]) {
			player.tell(
				Text.of(
					"You do not have a note for " + targetData.name + ".",
				).yellow(),
			);

			return false;
		}

		delete targetData.notes[adminUuid];

		saveData();

		player.tell(
			Text.of("Your note for ")
				.gray()
				.append(Text.of(targetData.name).white())
				.append(Text.of(" was removed.").green()),
		);

		return true;
	}

	function clearNotes(source, targetName) {
		var targetUuid = findPlayerUuidByName(targetName);

		if (!targetUuid) {
			source.sendFailure(Text.of("Player not found.").red());

			return false;
		}

		var targetData = data.players[targetUuid];

		if (!targetData.notes || typeof targetData.notes !== "object") {
			targetData.notes = {};
		}

		var removed = 0;

		for (var adminUuid in targetData.notes) {
			delete targetData.notes[adminUuid];

			removed++;
		}

		saveData();

		source.sendSuccess(
			Text.of("Cleared " + removed + " note(s) for ")
				.gray()
				.append(Text.of(targetData.name).white()),
			false,
		);

		return true;
	}

	function showNotes(source, targetName) {
		var targetUuid = findPlayerUuidByName(targetName);

		if (!targetUuid) {
			source.sendFailure(Text.of("Player not found.").red());

			return false;
		}

		var targetData = data.players[targetUuid];

		if (!targetData.notes || typeof targetData.notes !== "object") {
			targetData.notes = {};
		}

		source.sendSuccess(
			Text.of("────────────────────────────────────").darkGray(),
			false,
		);

		source.sendSuccess(Text.of("PLAYER NOTES").gold().bold(), false);

		source.sendSuccess(
			Text.of("Player: ").gray().append(Text.of(targetData.name).white()),
			false,
		);

		var count = 0;

		for (var adminUuid in targetData.notes) {
			var note = targetData.notes[adminUuid];

			if (!note) {
				continue;
			}

			count++;

			source.sendSuccess(Text.of("").white(), false);

			source.sendSuccess(
				Text.of("[" + String(note.author) + "]")
					.aqua()
					.bold(),
				false,
			);

			source.sendSuccess(Text.of(String(note.text)).white(), false);

			source.sendSuccess(
				Text.of(formatDate(note.createdAt)).darkGray(),
				false,
			);
		}

		if (count === 0) {
			source.sendSuccess(
				Text.of("No notes have been added for this player.").gray(),
				false,
			);
		}

		source.sendSuccess(
			Text.of("────────────────────────────────────").darkGray(),
			false,
		);

		return true;
	}

	ServerEvents.commandRegistry(function (event) {
		var Commands = event.commands;

		var Arguments = event.arguments;

		var addCommand = Commands.literal("add")
			.requires(function (source) {
				return (
					source.isPlayer() &&
					sourceHasPermission(source, PERMISSION_ADD)
				);
			})
			.then(
				Commands.argument(
					"player",
					Arguments.STRING.create(event),
				).then(
					Commands.argument(
						"note",
						Arguments.GREEDY_STRING.create(event),
					).executes(function (ctx) {
						try {
							var player = ctx.source.player;

							var targetName = Arguments.STRING.getResult(
								ctx,
								"player",
							);

							var noteText = Arguments.GREEDY_STRING.getResult(
								ctx,
								"note",
							);

							return addNote(player, targetName, noteText)
								? 1
								: 0;
						} catch (error) {
							console.error(
								"[Notes] Add error: " + String(error),
							);

							ctx.source.sendFailure(
								Text.of(
									"Failed to add note: " + String(error),
								).red(),
							);

							return 0;
						}
					}),
				),
			);

		var removeCommand = Commands.literal("rm")
			.requires(function (source) {
				return (
					source.isPlayer() &&
					sourceHasPermission(source, PERMISSION_REMOVE)
				);
			})
			.then(
				Commands.argument(
					"player",
					Arguments.STRING.create(event),
				).executes(function (ctx) {
					try {
						return removeNote(
							ctx.source.player,
							Arguments.STRING.getResult(ctx, "player"),
						)
							? 1
							: 0;
					} catch (error) {
						console.error("[Notes] Remove error: " + String(error));

						ctx.source.sendFailure(
							Text.of(
								"Failed to remove note: " + String(error),
							).red(),
						);

						return 0;
					}
				}),
			);

		var clearCommand = Commands.literal("clear")
			.requires(function (source) {
				return sourceHasPermission(source, PERMISSION_CLEAR);
			})
			.then(
				Commands.argument(
					"player",
					Arguments.STRING.create(event),
				).executes(function (ctx) {
					try {
						return clearNotes(
							ctx.source,
							Arguments.STRING.getResult(ctx, "player"),
						)
							? 1
							: 0;
					} catch (error) {
						console.error("[Notes] Clear error: " + String(error));

						ctx.source.sendFailure(
							Text.of(
								"Failed to clear notes: " + String(error),
							).red(),
						);

						return 0;
					}
				}),
			);

		var noteRoot = Commands.literal("note")
			.requires(function (source) {
				return hasAnyPermission(source);
			})
			.then(addCommand)
			.then(removeCommand)
			.then(clearCommand)
			.then(
				Commands.argument("player", Arguments.STRING.create(event))
					.requires(function (source) {
						return sourceHasPermission(source, PERMISSION_READ);
					})
					.executes(function (ctx) {
						try {
							return showNotes(
								ctx.source,
								Arguments.STRING.getResult(ctx, "player"),
							)
								? 1
								: 0;
						} catch (error) {
							console.error(
								"[Notes] Read error: " + String(error),
							);

							ctx.source.sendFailure(
								Text.of(
									"Failed to read notes: " + String(error),
								).red(),
							);

							return 0;
						}
					}),
			);

		event.register(noteRoot);
	});

	loadData();

	console.log("[Notes] Loaded successfully.");
})();
