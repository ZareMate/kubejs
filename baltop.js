/*
 * Modified by: @ZareMate
 * Original author: unknown
 *
 *
 * If you modify this script, you may additionally identify yourself as:
 *
 * Modified by: @YourUsername
 *
 * The original author attribution and copyright notice must remain.
 */

ServerEvents.commandRegistry(event => {
    var Commands = event.commands

    event.register(
        Commands.literal('baltop')
            .executes(ctx => {
                runBaltop(ctx.source, 'MERGED')
                return 1
            })
            .then(
                Commands.literal('players')
                    .executes(ctx => {
                        runBaltop(ctx.source, 'PLAYER')
                        return 1
                    })
            )
            .then(
                Commands.literal('teams')
                    .executes(ctx => {
                        runBaltop(ctx.source, 'TEAM')
                        return 1
                    })
            )
    )
})

function runBaltop(source, mode) {
    try {
        var Numismatics = Java.loadClass('dev.ithundxr.createnumismatics.Numismatics')
        var UsernameUtils = Java.loadClass('dev.ithundxr.createnumismatics.util.UsernameUtils').INSTANCE

        var bank = Numismatics.BANK
        var accounts = bank.accounts

        var list = []
        var it = accounts.entrySet().iterator()

        while (it.hasNext()) {
            var entry = it.next()
            var account = entry.getValue()
            var typeName = String(account.type.name())
            var type = null

            if (typeName === 'PLAYER') {
                type = 'PLAYER'
            } else if (typeName === 'BLAZE_BANKER') {
                type = 'TEAM'
            }

            if (type !== null && (mode === 'MERGED' || mode === type)) {
                var bal = account.getBalance()

                if (bal > 0) {
                    var label = type === 'TEAM' ? account.getLabel() : null

                    list.push({
                        uuid: entry.getKey(),
                        balance: bal,
                        type: type,
                        label: label
                    })
                }
            }
        }

        list.sort(function (a, b) {
            return b.balance - a.balance
        })

        var top = list.slice(0, 10)

        var title = 'TOP 10 - Balance'

        if (mode === 'PLAYER') {
            title = 'TOP 10 PLAYERS - Balance'
        } else if (mode === 'TEAM') {
            title = 'TOP 10 TEAMS - Balance'
        }

        var lines = []
        lines.push('§6§l======= ' + title + ' =======')

        if (top.length === 0) {
            if (mode === 'PLAYER') {
                lines.push('§7There are no players with any money in their bank account')
            } else if (mode === 'TEAM') {
                lines.push('§7There are no teams with any money in their bank account')
            } else {
                lines.push('§7There are no players or teams with any money in their bank account')
            }
        } else {
            for (var i = 0; i < top.length; i++) {
                var e = top[i]

                var name

                if (e.type === 'TEAM') {
                    name = e.label
                } else {
                    name = UsernameUtils.getName(e.uuid, null)
                }

                if (!name) {
                    name = e.uuid.toString()
                }

                var place = i + 1
                var placeColor = '§f'

                if (place === 1) {
                    placeColor = '§e'
                } else if (place === 2) {
                    placeColor = '§7'
                } else if (place === 3) {
                    placeColor = '§c'
                }

                var teamSuffix = ''

                if (mode === 'MERGED' && e.type === 'TEAM') {
                    teamSuffix = ' §bT'
                }

                lines.push(
                    placeColor +
                    '#' + place +
                    ' §f' + name +
                    ' §a- ' +
                    formatBalance(e.balance) +
                    teamSuffix
                )
            }
        }

        lines.push('§6§l=======================================')

        for (var j = 0; j < lines.length; j++) {
            source.sendSystemMessage(Text.of(lines[j]))
        }
    } catch (e) {
        console.error('Error has occured while entering /baltop: ' + e)
        source.sendSystemMessage(Text.red('Error has occured, check logs'))
    }
}

function formatBalance(spurs) {
    var coins = [
        { name: 'Sun', value: 4096 },
        { name: 'Crown', value: 512 },
        { name: 'Cog', value: 64 },
        { name: 'Sprocket', value: 16 },
        { name: 'Bevel', value: 8 },
        { name: 'Spur', value: 1 }
    ]

    var remaining = spurs
    var parts = []

    for (var i = 0; i < coins.length; i++) {
        var c = coins[i]
        var amount = Math.floor(remaining / c.value)

        if (amount > 0) {
            parts.push(
                amount +
                ' ' +
                c.name +
                (amount !== 1 ? 's' : '')
            )

            remaining -= amount * c.value
        }
    }

    if (parts.length === 0) {
        return '0 Spurs'
    }

    return parts.join(', ') + ' §7(' + spurs + ' spurs)'
}
