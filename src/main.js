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
});

async function setRollEffect(actor, eff) {
    let source = await fromUuid(eff);
    source = source.toObject();
    source.flags = mergeObject(source.flags ?? {}, {core: {sourceId: eff}});
    source.system.start.initiative = null;

    await actor.createEmbeddedDocuments("Item", [source]);
}

Hooks.on('preCreateChatMessage', async (message, user, _options) => {
    if (!message?.flags?.core?.initiativeRoll) {
        return;
    }
    const total = message?.rolls?.[0]?.dice?.[0].total;
    if (20 === total) {
        const r20 = game.settings.get(moduleName, "roll20");
        if (r20) {
            setTimeout(function () {
                setRollEffect(message.actor, r20);
            }, 500);
        }
    } else if (1 === total) {
        const r1 = game.settings.get(moduleName, "roll1");
        if (r1) {
            setTimeout(function () {
                setRollEffect(message.actor, r1);
            }, 500);
        }
    }
});