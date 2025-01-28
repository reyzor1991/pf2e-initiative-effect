const moduleName = "pf2e-initiative-effect";

Hooks.once("init", () => {
    game.settings.register(moduleName, "roll20", {
        name: "Roll 20 effect",
        scope: "world",
        config: true,
        default: "Compendium.pf2e-initiative-effect.initiative-effect.Item.BceRH6Nr4zn9l1sd",
        type: String,
    });

    game.settings.register(moduleName, "roll1", {
        name: "Roll 1 effect",
        scope: "world",
        config: true,
        default: "Compendium.pf2e-initiative-effect.initiative-effect.Item.F7vCiGa2Bt04zPz7",
        type: String,
    });

    game.settings.register(moduleName, "initType", {
        name: "Select type of reward/penalty",
        scope: "world",
        config: true,
        type: String,
        choices: {
            'effect': 'Apply effects',
            'heroReward': 'Add hero points/no penalty',
            'heroAll': 'Add hero points/effect penalty',
        },
        default: "effect",
    });
});

async function setRollEffect(actor, eff) {
    let source = await fromUuid(eff);
    if (!source) {
        return;
    }
    source = source.toObject();
    source.flags = mergeObject(source.flags ?? {}, {core: {sourceId: eff}});
    source.system.start.initiative = null;

    await actor.createEmbeddedDocuments("Item", [source]);
}

function changeHeroPoints(actor, delta) {
    const heroPointCount = actor.heroPoints.value;
    actor.update({
        "system.resources.heroPoints.value": Math.clamp(
            heroPointCount + delta,
            0,
            actor.heroPoints.max,
        ),
    });
    ui.notifications.info(`${actor.name} get hero point`);
}

function handle20(message, type) {
    if ("heroReward" === type || "heroAll" === type) {
        changeHeroPoints(message.actor, 1)
    } else if ("effect" === type) {
        const r20 = game.settings.get(moduleName, "roll20");
        setRollEffect(message.actor, r20);
    }
}

function handle1(message, type) {
    if ("effect" === type || "heroAll" === type) {
        const r1 = game.settings.get(moduleName, "roll1");
        setRollEffect(message.actor, r1);
    }
}

Hooks.on('preCreateChatMessage', async (message, user, _options) => {
    if (!message?.flags?.core?.initiativeRoll) {
        return;
    }
    const type = game.settings.get(moduleName, "initType");
    const total = message?.rolls?.[0]?.dice?.[0].total;
    let is20 = 20 === total;
    let is1 = 1 === total;

    if (is20) {
        handle20(message, type);
    } else if (is1) {
        handle1(message, type);
    }
});