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
	var DAILY_QUESTS_FILE = "kubejs/data/dailyquests/players.json";
	var DAILY_QUESTS_CONFIG = "config/dailyquests.json";

	var data = null;
	var config = null;
	var lastResetCheckTick = 0;

	var LuckPermsApiProvider = Java.loadClass(
		"net.luckperms.api.LuckPermsProvider",
	);

	var luckPermsApi = null;

	function getDefaultConfig() {
		return {
			resetCheckInterval: 20,
			questPermissionReroll: "dailyquests.command.reroll",
			rewards: {
				easy: {
					item: "numismatics:bevel",
					name: "Bevel",
					amount: 1,
				},
				medium: {
					item: "numismatics:bevel",
					name: "Bevel",
					amount: 3,
				},
				hard: {
					item: "numismatics:cog",
					name: "Cog",
					amount: 1,
				},
			},
			quests: {
				easy: [
					{
						id: "easy_iron",
						name: "Iron Collector",
						itemName: "Iron Ingots",
						description: "Collect 10 Iron Ingots",
						item: "minecraft:iron_ingot",
						amount: 10,
						reward: "easy",
					},
					{
						id: "easy_copper",
						name: "Copper Collector",
						itemName: "Copper Ingots",
						description: "Collect 16 Copper Ingots",
						item: "minecraft:copper_ingot",
						amount: 16,
						reward: "easy",
					},
					{
						id: "easy_coal",
						name: "Coal Collector",
						itemName: "Coal",
						description: "Collect 20 Coal",
						item: "minecraft:coal",
						amount: 20,
						reward: "easy",
					},
					{
						id: "easy_wheat",
						name: "Farmer",
						itemName: "Wheat",
						description: "Collect 12 Wheat",
						item: "minecraft:wheat",
						amount: 12,
						reward: "easy",
					},
					{
						id: "easy_redstone",
						name: "Redstone Gatherer",
						itemName: "Redstone Dust",
						description: "Collect 8 Redstone Dust",
						item: "minecraft:redstone",
						amount: 8,
						reward: "easy",
					},
					{
						id: "easy_oak",
						name: "Lumberjack",
						itemName: "Oak Logs",
						description: "Collect 16 Oak Logs",
						item: "minecraft:oak_log",
						amount: 16,
						reward: "easy",
					},
				],
				medium: [
					{
						id: "medium_iron",
						name: "Iron Miner",
						itemName: "Iron Ingots",
						description: "Collect 32 Iron Ingots",
						item: "minecraft:iron_ingot",
						amount: 32,
						reward: "medium",
					},
					{
						id: "medium_copper",
						name: "Copper Miner",
						itemName: "Copper Ingots",
						description: "Collect 32 Copper Ingots",
						item: "minecraft:copper_ingot",
						amount: 32,
						reward: "medium",
					},
					{
						id: "medium_gold",
						name: "Gold Collector",
						itemName: "Gold Ingots",
						description: "Collect 16 Gold Ingots",
						item: "minecraft:gold_ingot",
						amount: 16,
						reward: "medium",
					},
					{
						id: "medium_redstone",
						name: "Redstone Engineer",
						itemName: "Redstone Blocks",
						description: "Collect 12 Redstone Blocks",
						item: "minecraft:redstone_block",
						amount: 12,
						reward: "medium",
					},
					{
						id: "medium_bread",
						name: "Baker",
						itemName: "Bread",
						description: "Collect 16 Bread",
						item: "minecraft:bread",
						amount: 16,
						reward: "medium",
					},
					{
						id: "medium_diamond",
						name: "Gem Hunter",
						itemName: "Diamonds",
						description: "Collect 8 Diamonds",
						item: "minecraft:diamond",
						amount: 8,
						reward: "medium",
					},
				],
				hard: [
					{
						id: "hard_diamond",
						name: "Diamond Hunter",
						itemName: "Diamonds",
						description: "Collect 8 Diamonds",
						item: "minecraft:diamond",
						amount: 8,
						reward: "hard",
					},
					{
						id: "hard_gold",
						name: "Gold Hoarder",
						itemName: "Gold Ingots",
						description: "Collect 16 Gold Ingots",
						item: "minecraft:gold_ingot",
						amount: 16,
						reward: "hard",
					},
					{
						id: "hard_scrap",
						name: "Netherite Scavenger",
						itemName: "Netherite Scrap",
						description: "Collect 4 Netherite Scrap",
						item: "minecraft:netherite_scrap",
						amount: 4,
						reward: "hard",
					},
					{
						id: "hard_redstone",
						name: "Redstone Builder",
						itemName: "Redstone Blocks",
						description: "Collect 32 Redstone Blocks",
						item: "minecraft:redstone_block",
						amount: 32,
						reward: "hard",
					},
					{
						id: "hard_pearls",
						name: "End Explorer",
						itemName: "Ender Pearls",
						description: "Collect 16 Ender Pearls",
						item: "minecraft:ender_pearl",
						amount: 16,
						reward: "hard",
					},
					{
						id: "hard_star",
						name: "Star Hunter",
						itemName: "Nether Star",
						description: "Collect 1 Nether Star",
						item: "minecraft:nether_star",
						amount: 1,
						reward: "hard",
					},
				],
			},
		};
	}

	function loadConfig() {
		var defaults = getDefaultConfig();

		try {
			var loaded = JsonIO.read(DAILY_QUESTS_CONFIG);

			if (!loaded || typeof loaded !== "object") {
				throw new Error("Invalid configuration");
			}

			config = loaded;

			if (
				typeof config.resetCheckInterval !== "number" ||
				config.resetCheckInterval < 1
			) {
				config.resetCheckInterval = defaults.resetCheckInterval;
			}

			if (
				typeof config.questPermissionReroll !== "string" ||
				!config.questPermissionReroll
			) {
				config.questPermissionReroll = defaults.questPermissionReroll;
			}

			if (!config.rewards || typeof config.rewards !== "object") {
				config.rewards = defaults.rewards;
			}

			if (!config.rewards.easy) {
				config.rewards.easy = defaults.rewards.easy;
			}

			if (!config.rewards.medium) {
				config.rewards.medium = defaults.rewards.medium;
			}

			if (!config.rewards.hard) {
				config.rewards.hard = defaults.rewards.hard;
			}

			if (!config.quests || typeof config.quests !== "object") {
				config.quests = defaults.quests;
			}

			if (
				!Array.isArray(config.quests.easy) ||
				config.quests.easy.length === 0
			) {
				config.quests.easy = defaults.quests.easy;
			}

			if (
				!Array.isArray(config.quests.medium) ||
				config.quests.medium.length === 0
			) {
				config.quests.medium = defaults.quests.medium;
			}

			if (
				!Array.isArray(config.quests.hard) ||
				config.quests.hard.length === 0
			) {
				config.quests.hard = defaults.quests.hard;
			}

			JsonIO.write(DAILY_QUESTS_CONFIG, config);

			console.log("[DailyQuests] Configuration loaded.");
		} catch (error) {
			config = defaults;

			try {
				JsonIO.write(DAILY_QUESTS_CONFIG, config);

				console.log(
					"[DailyQuests] Created default configuration: " +
						DAILY_QUESTS_CONFIG,
				);
			} catch (writeError) {
				console.error(
					"[DailyQuests] Failed to create configuration: " +
						String(writeError),
				);
			}
		}
	}

	function getLuckPerms() {
		if (luckPermsApi) {
			return luckPermsApi;
		}

		try {
			luckPermsApi = LuckPermsApiProvider.get();

			return luckPermsApi;
		} catch (error) {
			console.error(
				"[DailyQuests] Failed to load LuckPerms API: " + String(error),
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
			return api
				.getUserManager()
				.getUser(player.uuid)
				.getCachedData()
				.getPermissionData()
				.checkPermission(permission)
				.asBoolean();
		} catch (error) {
			console.error(
				"[DailyQuests] Permission check failed: " + String(error),
			);

			return false;
		}
	}

	function pad2(value) {
		return String(value).padStart(2, "0");
	}

	function getToday() {
		var now = new Date();

		return (
			now.getFullYear() +
			"-" +
			pad2(now.getMonth() + 1) +
			"-" +
			pad2(now.getDate())
		);
	}

	function getResetCountdown() {
		var now = new Date();
		var nextMidnight = new Date(now);

		nextMidnight.setHours(24, 0, 0, 0);

		var remaining = Math.max(0, nextMidnight.getTime() - now.getTime());

		var totalSeconds = Math.floor(remaining / 1000);

		var hours = Math.floor(totalSeconds / 3600);

		totalSeconds %= 3600;

		var minutes = Math.floor(totalSeconds / 60);

		var seconds = totalSeconds % 60;

		if (hours > 0) {
			return hours + "h " + pad2(minutes) + "m " + pad2(seconds) + "s";
		}

		if (minutes > 0) {
			return minutes + "m " + pad2(seconds) + "s";
		}

		return seconds + "s";
	}

	function createEmptyData() {
		return {
			lastReset: getToday(),
			players: {},
		};
	}

	function loadData() {
		try {
			var loaded = JsonIO.read(DAILY_QUESTS_FILE);

			if (!loaded || typeof loaded !== "object") {
				data = createEmptyData();
				saveData();
				return;
			}

			if (!loaded.players || typeof loaded.players !== "object") {
				loaded.players = {};
			}

			if (typeof loaded.lastReset !== "string") {
				loaded.lastReset = getToday();
			}

			data = loaded;
		} catch (error) {
			data = createEmptyData();
			saveData();
		}
	}

	function saveData() {
		if (!data) {
			return;
		}

		try {
			JsonIO.write(DAILY_QUESTS_FILE, data);
		} catch (error) {
			console.error(
				"[DailyQuests] Failed to save data: " + String(error),
			);
		}
	}

	function randomQuest(category) {
		var pool = config.quests[category];

		if (!Array.isArray(pool) || pool.length === 0) {
			return null;
		}

		return pool[Math.floor(Math.random() * pool.length)];
	}

	function getQuestById(id) {
		if (!id) {
			return null;
		}

		var categories = ["easy", "medium", "hard"];

		for (var i = 0; i < categories.length; i++) {
			var pool = config.quests[categories[i]];

			for (var j = 0; j < pool.length; j++) {
				if (pool[j].id === id) {
					return pool[j];
				}
			}
		}

		return null;
	}

	function getQuestReward(quest) {
		if (!quest) {
			return null;
		}

		if (quest.reward && typeof quest.reward === "object") {
			return quest.reward;
		}

		if (typeof quest.reward === "string") {
			return config.rewards[quest.reward];
		}

		return null;
	}

	function getPlayerUuid(player) {
		return String(player.uuid);
	}

	function createPlayerData(player) {
		var easy = randomQuest("easy");
		var medium = randomQuest("medium");
		var hard = randomQuest("hard");

		return {
			name: String(player.username),
			easyQuest: easy ? easy.id : null,
			mediumQuest: medium ? medium.id : null,
			hardQuest: hard ? hard.id : null,
			easyClaimed: false,
			mediumClaimed: false,
			hardClaimed: false,
		};
	}

	function createOfflinePlayerData(name) {
		var easy = randomQuest("easy");
		var medium = randomQuest("medium");
		var hard = randomQuest("hard");

		return {
			name: String(name),
			easyQuest: easy ? easy.id : null,
			mediumQuest: medium ? medium.id : null,
			hardQuest: hard ? hard.id : null,
			easyClaimed: false,
			mediumClaimed: false,
			hardClaimed: false,
		};
	}

	function repairPlayerData(player, playerData) {
		var changed = false;

		if (!playerData.name) {
			playerData.name = String(player.username);
			changed = true;
		}

		var categories = ["easy", "medium", "hard"];

		for (var i = 0; i < categories.length; i++) {
			var category = categories[i];

			var questField = category + "Quest";

			var claimedField = category + "Claimed";

			if (
				typeof playerData[questField] !== "string" ||
				!getQuestById(playerData[questField])
			) {
				var quest = randomQuest(category);

				playerData[questField] = quest ? quest.id : null;

				playerData[claimedField] = false;

				changed = true;
			}

			if (typeof playerData[claimedField] !== "boolean") {
				playerData[claimedField] = false;

				changed = true;
			}
		}

		if (playerData.cogsEarned !== undefined) {
			delete playerData.cogsEarned;
			changed = true;
		}

		return changed;
	}

	function getPlayerData(player) {
		var uuid = getPlayerUuid(player);

		if (!data.players[uuid]) {
			data.players[uuid] = createPlayerData(player);

			saveData();

			return data.players[uuid];
		}

		var playerData = data.players[uuid];

		var changed = repairPlayerData(player, playerData);

		playerData.name = String(player.username);

		if (changed) {
			saveData();
		}

		return playerData;
	}

	function countItem(player, itemId) {
		var total = 0;

		try {
			var inventory = player.inventory;

			if (!inventory) {
				return 0;
			}

			var items = inventory.items;

			for (var i = 0; i < items.length; i++) {
				var stack = items[i];

				if (!stack || stack.empty) {
					continue;
				}

				if (stack.id !== itemId) {
					continue;
				}

				total += stack.count;
			}
		} catch (error) {
			console.error(
				"[DailyQuests] Inventory count error: " + String(error),
			);

			return 0;
		}

		return total;
	}

	function removeItems(player, itemId, amount) {
		var remaining = amount;

		try {
			var inventory = player.inventory;

			if (!inventory) {
				return false;
			}

			var items = inventory.items;

			for (var i = 0; i < items.length; i++) {
				if (remaining <= 0) {
					break;
				}

				var stack = items[i];

				if (!stack || stack.empty) {
					continue;
				}

				if (stack.id !== itemId) {
					continue;
				}

				var removeAmount = Math.min(remaining, stack.count);

				stack.shrink(removeAmount);

				remaining -= removeAmount;
			}
		} catch (error) {
			console.error(
				"[DailyQuests] Inventory removal error: " + String(error),
			);

			return false;
		}

		return remaining <= 0;
	}

	function giveReward(player, reward) {
		if (
			!reward ||
			!reward.item ||
			typeof reward.amount !== "number" ||
			reward.amount <= 0
		) {
			return false;
		}

		try {
			player.give(Item.of(reward.item, reward.amount));

			return true;
		} catch (error) {
			console.error("[DailyQuests] Reward error: " + String(error));

			return false;
		}
	}

	function getProgress(player, quest) {
		if (!quest) {
			return 0;
		}

		return Math.min(countItem(player, quest.item), quest.amount);
	}

	function separator(player) {
		player.tell(Text.of("───────────────────────────────────").gray());
	}

	function getCategoryColor(category) {
		if (category === "medium") {
			return "yellow";
		}

		if (category === "hard") {
			return "red";
		}

		return "green";
	}

	function tellQuest(player, category, quest, claimed) {
		if (!quest) {
			player.tell(Text.of("Quest data is unavailable.").red());

			return;
		}

		var reward = getQuestReward(quest);

		var progress = getProgress(player, quest);

		var itemName =
			quest.itemName ||
			quest.description.replace(/^Collect\s+\d+\s+/i, "");

		var rewardName = reward && reward.name ? reward.name : reward.item;

		player.tell(
			Text.of(category.toUpperCase())
				.color(getCategoryColor(category))
				.bold(),
		);

		player.tell(Text.of(quest.name).white().bold());

		player.tell(
			Text.of("Collect: ")
				.gray()
				.append(Text.of(progress + " / " + quest.amount + " ").white())
				.append(Text.of(itemName).gray()),
		);

		player.tell(
			Text.of("Reward: ")
				.gray()
				.append(Text.of(reward.amount + "x " + rewardName).gold()),
		);

		if (claimed) {
			player.tell(Text.of("[ CLAIMED ]").darkGray());
		} else if (progress >= quest.amount) {
			player.tell(
				Text.of("[ CLAIM ]")
					.green()
					.bold()
					.clickRunCommand("/dailyquests claim " + category),
			);
		} else {
			player.tell(Text.of("[ NOT COMPLETE ]").red());
		}

		player.tell("");
	}

	function openDailyQuests(player) {
		if (!player) {
			return;
		}

		checkDailyReset(player.server);

		var playerData = getPlayerData(player);

		var easyQuest = getQuestById(playerData.easyQuest);

		var mediumQuest = getQuestById(playerData.mediumQuest);

		var hardQuest = getQuestById(playerData.hardQuest);

		separator(player);

		player.tell(Text.of("DAILY QUESTS").gold().bold());

		player.tell(
			Text.of("Resets in: ")
				.gray()
				.append(Text.of(getResetCountdown()).aqua()),
		);

		player.tell("");

		tellQuest(player, "easy", easyQuest, playerData.easyClaimed);

		tellQuest(player, "medium", mediumQuest, playerData.mediumClaimed);

		tellQuest(player, "hard", hardQuest, playerData.hardClaimed);

		player.tell(
			Text.of("[ REFRESH ]").aqua().clickRunCommand("/dailyquests"),
		);

		separator(player);
	}

	function claimQuest(player, category) {
		if (!player) {
			return 0;
		}

		if (
			category !== "easy" &&
			category !== "medium" &&
			category !== "hard"
		) {
			return 0;
		}

		checkDailyReset(player.server);

		var playerData = getPlayerData(player);

		var questField = category + "Quest";

		var claimedField = category + "Claimed";

		var quest = getQuestById(playerData[questField]);

		if (!quest) {
			player.tell(
				Text.of(
					"Your quest data was repaired. Run /dailyquests again.",
				).yellow(),
			);

			repairPlayerData(player, playerData);

			saveData();

			return 0;
		}

		if (playerData[claimedField]) {
			player.tell(Text.of("This quest has already been claimed.").red());

			return 0;
		}

		var reward = getQuestReward(quest);

		if (!reward) {
			player.tell(
				Text.of(
					"This quest has an invalid reward configuration.",
				).red(),
			);

			return 0;
		}

		var currentAmount = countItem(player, quest.item);

		if (currentAmount < quest.amount) {
			player.tell(Text.of("You do not have enough items.").red());

			player.tell(
				Text.of(
					"Required: " +
						quest.amount +
						" | You have: " +
						currentAmount,
				).gray(),
			);

			return 0;
		}

		if (countItem(player, quest.item) < quest.amount) {
			player.tell(
				Text.of(
					"Your inventory changed. The claim was cancelled.",
				).red(),
			);

			return 0;
		}

		if (!removeItems(player, quest.item, quest.amount)) {
			player.tell(Text.of("The quest items could not be removed.").red());

			return 0;
		}

		if (!giveReward(player, reward)) {
			player.tell(
				Text.of(
					"The reward could not be given. Contact an administrator.",
				).red(),
			);

			return 0;
		}

		playerData[claimedField] = true;

		saveData();

		player.tell(Text.of("Quest claimed successfully!").green());

		player.tell(
			Text.of("Reward: ")
				.gray()
				.append(
					Text.of(
						reward.amount + "x " + (reward.name || reward.item),
					).gold(),
				),
		);

		player.tell("");

		openDailyQuests(player);

		return 1;
	}

	function findOnlinePlayer(server, name) {
		var target = String(name).toLowerCase();

		var players = server.players;

		for (var i = 0; i < players.length; i++) {
			var player = players[i];

			if (String(player.username).toLowerCase() === target) {
				return player;
			}
		}

		return null;
	}

	function findSavedPlayer(name) {
		var target = String(name).toLowerCase();

		for (var uuid in data.players) {
			var playerData = data.players[uuid];

			if (!playerData || !playerData.name) {
				continue;
			}

			if (String(playerData.name).toLowerCase() === target) {
				return {
					uuid: uuid,
					name: String(playerData.name),
				};
			}
		}

		return null;
	}

	function rerollPlayer(server, name) {
		checkDailyReset(server);

		var onlinePlayer = findOnlinePlayer(server, name);

		if (onlinePlayer) {
			var uuid = getPlayerUuid(onlinePlayer);

			data.players[uuid] = createPlayerData(onlinePlayer);

			saveData();

			onlinePlayer.tell(
				Text.of(
					"Your daily quests have been rerolled by an administrator.",
				).yellow(),
			);

			openDailyQuests(onlinePlayer);

			return true;
		}

		var savedPlayer = findSavedPlayer(name);

		if (!savedPlayer) {
			return false;
		}

		data.players[savedPlayer.uuid] = createOfflinePlayerData(
			savedPlayer.name,
		);

		saveData();

		return true;
	}

	function resetDailyQuests(server) {
		var today = getToday();

		console.log("[DailyQuests] Resetting daily quests for " + today);

		data.players = {};
		data.lastReset = today;

		var players = server.players;

		for (var i = 0; i < players.length; i++) {
			var player = players[i];

			data.players[getPlayerUuid(player)] = createPlayerData(player);
		}

		saveData();

		for (var j = 0; j < players.length; j++) {
			players[j].tell(Text.of("Daily quests have been reset!").green());

			players[j].tell(
				Text.of("Use /dailyquests to view your new quests.").gray(),
			);
		}

		console.log("[DailyQuests] Daily reset complete.");
	}

	function checkDailyReset(server) {
		if (!data) {
			loadData();
		}

		var today = getToday();

		if (data.lastReset !== today) {
			resetDailyQuests(server);
		}
	}

	ServerEvents.commandRegistry(function (event) {
		var Commands = event.commands;

		var Arguments = event.arguments;

		event.register(
			Commands.literal("dailyquests")
				.executes(function (ctx) {
					try {
						var player = ctx.source.player;

						if (!player) {
							ctx.source.sendFailure(
								Text.of(
									"This command can only be used by a player.",
								).red(),
							);

							return 0;
						}

						openDailyQuests(player);

						return 1;
					} catch (error) {
						console.error(
							"[DailyQuests] /dailyquests error: " +
								String(error),
						);

						ctx.source.sendFailure(
							Text.of(
								"Daily Quests encountered an error. Check the server console.",
							).red(),
						);

						return 0;
					}
				})
				.then(
					Commands.literal("claim")
						.then(
							Commands.literal("easy").executes(function (ctx) {
								return claimQuest(ctx.source.player, "easy");
							}),
						)
						.then(
							Commands.literal("medium").executes(function (ctx) {
								return claimQuest(ctx.source.player, "medium");
							}),
						)
						.then(
							Commands.literal("hard").executes(function (ctx) {
								return claimQuest(ctx.source.player, "hard");
							}),
						),
				),
		);

		event.register(
			Commands.literal("reroll")
				.requires(
					(source) =>
						source.isPlayer() &&
						(source.hasPermission(3) ||
							hasPermission(
								source.player,
								config.questPermissionReroll,
							)),
				)
				.then(
					Commands.argument(
						"player",
						Arguments.PLAYER.create(event),
					).executes((ctx) => {
						try {
							var target = Arguments.PLAYER.getResult(
								ctx,
								"player",
							);

							if (!target) {
								ctx.source.sendFailure(
									Text.of("You must specify a player.").red(),
								);

								return 0;
							}

							var name = String(target.username);

							var uuid = getPlayerUuid(target);

							checkDailyReset(ctx.source.server);

							data.players[uuid] = createPlayerData(target);

							saveData();

							target.tell(
								Text.of(
									"Your daily quests have been rerolled by an administrator.",
								).yellow(),
							);

							openDailyQuests(target);

							ctx.source.sendSuccess(
								Text.of(
									"Daily quests rerolled for " + name + ".",
								).green(),
								true,
							);

							return 1;
						} catch (error) {
							console.error(
								"[DailyQuests] /reroll error: " + String(error),
							);

							ctx.source.sendFailure(
								Text.of(
									"Reroll failed. Check the server console.",
								).red(),
							);

							return 0;
						}
					}),
				),
		);
	});

	PlayerEvents.loggedIn(function (event) {
		try {
			checkDailyReset(event.server);

			getPlayerData(event.player);
		} catch (error) {
			console.error("[DailyQuests] Player join error: " + String(error));

			event.player.tell(
				Text.of(
					"Daily Quests failed to load. Check the server console.",
				).red(),
			);
		}
	});

	ServerEvents.tick(function (event) {
		try {
			var currentTick = event.server.tickCount;

			if (currentTick - lastResetCheckTick < config.resetCheckInterval) {
				return;
			}

			lastResetCheckTick = currentTick;

			checkDailyReset(event.server);
		} catch (error) {
			console.error("[DailyQuests] Tick error: " + String(error));
		}
	});

	loadConfig();
	loadData();

	console.log("[DailyQuests] Loaded successfully.");
})();
