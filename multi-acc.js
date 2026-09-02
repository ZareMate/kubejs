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


var DISCORD_WEBHOOK_URL = 'REPLACE_ME';

var MULTIACCOUNT_PERMISSION_CHECKIP = 'multiaccount.command.checkip';
var MULTIACCOUNT_PERMISSION_ALERT = 'multiaccount.alert';

var LuckPermsApiProvider = Java.loadClass(
    'net.luckperms.api.LuckPermsProvider'
);

var luckPermsApi = null;
var playerIPMap = new Map();

function getLuckPerms() {
    if (luckPermsApi) {
        return luckPermsApi;
    }

    try {
        luckPermsApi = LuckPermsApiProvider.get();

        console.log('[Multi-Account] luckPermsApi API loaded successfully!');

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
            '[Multi-Account] Failed to check permission ' +
            permission +
            ' for ' +
            player.username +
            ': ' +
            error
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

        if (ip.includes('/')) {
            ip = ip.split('/')[1];
        }

        if (ip.includes(':')) {
            ip = ip.split(':')[0];
        }

        return ip;
    } catch (error) {
        console.warn(
            '[Multi-Account] Failed to get IP for ' +
            player.username +
            ': ' +
            error
        );

        return null;
    }
}

function sendPlayerNotification(player, otherPlayers) {
    player.tell(
        '§c[ALERT] §fMulti-account detected! Other accounts on your IP: §e' +
        otherPlayers.join(', ')
    );
}

function notifyStaff(server, playerName, otherPlayers) {
    var message =
        '§c[ADMIN] §fPlayer §6' +
        playerName +
        '§f has the same IP as: §e' +
        otherPlayers.join(', ');

    server.players.forEach(player => {
        if (hasPermission(player, MULTIACCOUNT_PERMISSION_ALERT)) {
            player.tell(message);
        }
    });
}

function sendDiscordNotification(server, playerName, otherPlayers) {
    var payload = {
        content: '⚠️ **MULTI-ACCOUNT DETECTED**',
        embeds: [{
            title: 'Multi-Account Alert',
            color: 16711680,
            fields: [
                {
                    name: 'Player',
                    value: playerName,
                    inline: true
                },
                {
                    name: 'Other Accounts on IP',
                    value: otherPlayers.join(', '),
                    inline: false
                },
                {
                    name: 'Timestamp',
                    value: new Date().toISOString(),
                    inline: true
                }
            ]
        }]
    };
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
        playerName => playerName !== name
    );

    if (otherPlayers.length > 0) {
        console.log(
            '[Multi-Account] ALERT: ' +
            name +
            ' shares IP with: ' +
            otherPlayers.join(', ')
        );

        sendPlayerNotification(player, otherPlayers);
        notifyStaff(server, name, otherPlayers);
        sendDiscordNotification(server, name, otherPlayers);
    }

    players.add(name);
}

function removePlayer(name) {
    for (var [ip, players] of playerIPMap) {
        if (!players.delete(name)) {
            continue;
        }

        console.log(
            '[Multi-Account] Removed ' +
            name +
            ' from IP tracking (' +
            ip +
            ')'
        );

        if (players.size === 0) {
            playerIPMap.delete(ip);
        }

        break;
    }
}

PlayerEvents.loggedIn(event => {
    var player = event.player;
    var server = event.server;

    console.log(
        '[Multi-Account] ' +
        player.username +
        ' joined from: ' +
        getPlayerIP(player)
    );

    server.schedule(10, () => {
        checkMultiAccount(server, player);
    });
});

PlayerEvents.loggedOut(event => {
    var name = event.player.username;

    console.log(
        '[Multi-Account] ' +
        name +
        ' left the server'
    );

    removePlayer(name);
});

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('checkip')
            .requires(source =>
                source.isPlayer() &&
                (
                    source.hasPermission(3) ||
                    hasPermission(
                        source.player,
                        MULTIACCOUNT_PERMISSION_CHECKIP
                    )
                )
            )
            .executes(ctx => {
                var source = ctx.source;
                var group = 1;
                var found = false;

                source.sendSuccess(
                    Text.of('§6Players sharing an IP:'),
                    false
                );

                for (var players of playerIPMap.values()) {
                    if (players.size <= 1) {
                        continue;
                    }

                    found = true;

                    source.sendSuccess(
                        Text.of(
                            `§7Group ${group}: §e${Array.from(players).join(', ')}`
                        ),
                        false
                    );

                    group++;
                }

                if (!found) {
                    source.sendSuccess(
                        Text.of('§7No players currently share an IP.'),
                        false
                    );
                }

                return 1;
            })
    );
});

console.log('[Multi-Account] Script loaded successfully!');
console.log('[Multi-Account] /checkip permission: ' + MULTIACCOUNT_PERMISSION_CHECKIP);
console.log('[Multi-Account] Chat alert permission: ' + MULTIACCOUNT_PERMISSION_ALERT);
console.log('[Multi-Account] Commands: /checkip');
console.log(
    '[Multi-Account] Webhook: ' +
    (DISCORD_WEBHOOK_URL !== 'REPLACE_ME' ? '✓ Configured' : '✗ Not configured')
);