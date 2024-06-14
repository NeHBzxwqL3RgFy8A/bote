
/*
 * **************************************************************************************
 * Copyright (C) 2022 FoE-Helper team - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the AGPL license.
 *
 * See file LICENSE.md or go to
 * https://github.com/mainIine/foe-helfer-extension/blob/master/LICENSE.md
 * for full license details.
 *
 * **************************************************************************************
 */

FoEproxy.addHandler('AnnouncementsService', 'fetchAllAnnouncements', (data, postData) => {
    // Closes the box when the player navigates back to the city
    HTML.CloseOpenBox('gbgMenu');
});

FoEproxy.addHandler('GuildBattlegroundStateService', 'getState', (data, postData) => {
    // Don't create a new box while another one is still open
    if ($('#gbgMenu').length > 0) {
        return;
    }

    gbg.ShowMapDialog();
});

let gbg = {

    ShowMapDialog: () => {
        let body = [];

        HTML.AddCssFile('gbg');

        HTML.Box({
            'id': 'gbgMenu',
            'title': 'Battle',
            'auto_close': true,
            'dragdrop': true,
            'minimize': false
        });

        body.push(`<div>
		<button class="btn-default" onclick="gbg.lockDialog(); gbg.doEncounter(1);" id="oneHit">1 Hit</button>
		<button class="btn-default" onclick="gbg.lockDialog(); gbg.doEncounter(10);" id="tenHit">10 Hits</button>
		<button class="btn-default" onclick="gbg.lockDialog(); gbg.doEncounter(-1);" id="sectorKill">Kill Sector</button>
		<button class="btn-default" onclick="gbg.stop = true;" id="stop" disabled>Stop</button>
		</div>`);
		body.push(`<p>------------</p>`);
		body.push(`<div>
		<input type="checkbox" class="slider round" style="margin: 0 auto" id="race">Full Take Y/N</input>
		<p id="raceTF">Full Take: ${gbg.racing}</p>
		</div>`);
		body.push(`<div>
		<input type="checkbox" class="slider round" style="margin: 0 auto" id="demolish">Holding @200 Y/N</input>
		<p id="holdingTF">Holding: ${gbg.holding}</p>
		</div>`);
		body.push(`<p>------------</p>`);
		body.push(`<div>
		<input type="checkbox" class="slider" style="margin: 0 auto" id="preset">Preset 0 or 1?</input>
		<p id="preDisp">Using preset ${gbg.preset}</p>
		</div>`);
		body.push(`<div>
		<input type="range" min="0.25" max="1" step="0.05" value="1.00" class="slider" style="display: block; margin: 0 auto" id="atkspd">Attack Speed Modifier</input>
		<p id="atkMult">Multiplier: ${gbg.atkspdmod}</p>
		</div>`);
        body.push(`<p>------------</p>`);
        body.push(`<p id="stats">Current Target: ${gbg.currentTarget}  |  Battles Won: ${gbg.battleInSession}  |  Losses: ${gbg.losses}</p>`);
		body.push(`<p id="attr">Attrition Gained: ${gbg.attritionGained}</p>`);
        body.push(`<p id="dead">Dead Troops: ${gbg.dead}</p>`);
        body.push(`<p>------------</p>`);
        body.push(`<p>Rewards Earned:</p>`);
        body.push(`<p id="dias">Diamonds: ${gbg.diamonds}</p>`);
        body.push(`<p id="fps">Forge Points: ${gbg.fp}</p>`);

        $('#gbgMenuBody').html(body);
		document.querySelector("#atkspd").oninput = function() {
			gbg.atkspdmod = this.value;
			gbg.refreshDialog();
		};
		document.querySelector("#race").oninput = function() {
			gbg.racing = this.checked;
			gbg.refreshDialog();
		};
		document.querySelector("#demolish").oninput = function() {
			gbg.holding = this.checked;
			gbg.refreshDialog();
		};
		document.querySelector("#preset").oninput = function() {
			gbg.preset = this.checked ? 1 : 0;
			gbg.refreshDialog();
		};
    },
	
	lockDialog: () => {
		document.getElementById("oneHit").disabled = true;
		document.getElementById("tenHit").disabled = true;
		document.getElementById("sectorKill").disabled = true;
		document.getElementById("stop").disabled = false;
		gbg.refreshDialog();
	},
	
	unlockDialog: () => {
		document.getElementById("oneHit").disabled = false;
		document.getElementById("tenHit").disabled = false;
		document.getElementById("sectorKill").disabled = false;
		document.getElementById("stop").disabled = true;
		gbg.refreshDialog();
	},
	
	refreshDialog:() => {
		document.getElementById("raceTF").innerHTML = `Full Take: ${gbg.racing}`;
		document.getElementById("holdingTF").innerHTML = `Holding: ${gbg.holding}`;
		document.getElementById("preDisp").innerHTML = `Using preset ${gbg.preset}`;
		document.getElementById("atkMult").innerHTML = `Multiplier: ${gbg.atkspdmod}`;
		document.getElementById("stats").innerHTML = `Current Target: ${gbg.currentTarget}  |  Battles Won: ${gbg.battleInSession}  |  Losses: ${gbg.losses}`;
		document.getElementById("attr").innerHTML = `Attrition Gained: ${gbg.attritionGained}`;
		document.getElementById("dead").innerHTML = `Dead Troops: ${gbg.dead}`;
		document.getElementById("dias").innerHTML = `Diamonds: ${gbg.diamonds}`;
		document.getElementById("fps").innerHTML = `Forge Points: ${gbg.fp}`;
	},
	
	racing: false,
	holding: false,
	preset: 0,
	atkspdmod: 1,
    diamonds: 0,
    fp: 0,
    losses: 0,
    battleInSession: 0,
    won: false,
    currentTarget: null, 
	stop: false,
    units: [null, null, null, null, null, null, null, null],
    changed: 0,
    dead: 0,
    battlesWon: null,
	era: null,
    currentParticipantId: null,
    waveCount: null,
	attritionGained: 0, 
	attritionStart: null,

    doEncounter: (n) => {
		
		gbg.atkStep1(n);
		
    },

    atkStep1: (n) => {
		gbg.refreshDialog();
		
		if (gbg.stop) {
			gbg.currentTarget = null;
		}
		
        if (0 == n) {
			gbg.unlockDialog();
            alert("Job Finished");
            return;
        }

        if (gbg.losses == 3) {
			gbg.unlockDialog();
            alert("Too many losses");
            gbg.losses = 0;
            return;
        }

        if (null == gbg.currentTarget) {
			gbg.stop = false; 
			gbg.unlockDialog();
            alert("Retarget");
            return;
        }

        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

		newReq.onload = function () {
			gbg.atkStep2(n);
		};

        newReq.send(FoEproxy.blobber(reqData.step1Req(gbg.currentTarget)));
    },

    atkStep2: (n) => {
        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(gbg.armyRefill, (500 + Math.ceil(Math.random() * 250) + (100 + Math.ceil(Math.random() * 20)) * gbg.changed) * gbg.atkspdmod, n);
        };

        newReq.send(FoEproxy.blobber(reqData.step2Req()));
    },

    armyRefill: (n) => {
        if (gbg.units.includes(null)) {
            gbg.unlockDialog();
			alert("NO UNITS");
            return;
        }

        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);
		
		newReq.onload = function () {
			gbg.atkStep3(n);
		};

        newReq.send(FoEproxy.blobber(reqData.armyRefillReq(gbg.units)));
    },

    atkStep3: (n) => {
        if (gbg.waveCount == null) {
			gbg.unlockDialog();
            alert("WAVECOUNT NULL");
            return;
        }

        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            if (gbg.waveCount == 2 && gbg.won && gbg.currentTarget != null) {
                setTimeout(gbg.atkStep4, (300 + Math.ceil(Math.random() * 200)) * gbg.atkspdmod, n);
            } else {
                gbg.battleInSession += gbg.won;
                gbg.losses += (!gbg.won);
                gbg.losses *= (!gbg.won);
                gbg.waveCount = null;
                gbg.won = false;
                gbg.units = [null, null, null, null, null, null, null, null];
                setTimeout(gbg.doEncounter, (500 + Math.ceil(Math.random() * 250)) * gbg.atkspdmod, n - 1);
            }
        };

        newReq.send(FoEproxy.blobber(reqData.step3Req(gbg.currentTarget)));
    },

    atkStep4: (n) => {
		if (gbg.battlesWon == null) {
			gbg.unlockDialog();
            alert("BATTLESWON NULL");
            return;
        }
		
		if (gbg.era == null) {
			gbg.unlockDialog();
            alert("ERA NULL");
            return;
        }
		
        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            gbg.battleInSession += gbg.won;
            gbg.losses += (!gbg.won);
            gbg.losses *= (!gbg.won);
            gbg.waveCount = null;
            gbg.won = false;
            gbg.units = [null, null, null, null, null, null, null, null];
            setTimeout(gbg.doEncounter, (500 + Math.ceil(Math.random() * 250)) * gbg.atkspdmod, n - 1);
        };
		
		newReq.send(FoEproxy.blobber(reqData.step4Req(gbg.currentTarget, gbg.battlesWon, gbg.era)));
    },

};

let reqData = {
    step1Req: (id) => {
        return `[{"__class__":"ServerRequest","requestData":[{"__class__":"BattlegroundBattleType","attackerPlayerId":0,"defenderPlayerId":0,"type":"battleground","currentWaveId":0,"totalWaves":0,"provinceId":${id},"battlesWon":0}],"requestClass":"BattlefieldService","requestMethod":"getArmyPreview","requestId":7}]`;
    },
    step2Req: () => {
        return `[{"__class__":"ServerRequest","requestData":[{"__class__":"ArmyContext","battleType":"battleground"}],"requestClass":"ArmyUnitManagementService","requestMethod":"getArmyInfo","requestId":7}]`;
    },
    step3Req: (id) => {
        return `[{"__class__":"ServerRequest","requestData":[{"__class__":"BattlegroundBattleType","attackerPlayerId":0,"defenderPlayerId":0,"type":"battleground","currentWaveId":0,"totalWaves":0,"provinceId":${id},"battlesWon":0},true],"requestClass":"BattlefieldService","requestMethod":"startByBattleType","requestId":7}]`;
    },
    step4Req: (id, won, era) => {
        return `[{"__class__":"ServerRequest","requestData":[{"__class__":"BattlegroundBattleType","attackerPlayerId":0,"defenderPlayerId":0,"era":"${era}","type":"battleground","currentWaveId":0,"totalWaves":2,"provinceId":${id},"battlesWon":${won}},true],"requestClass":"BattlefieldService","requestMethod":"startByBattleType","requestId":7}]`;
    },
    armyRefillReq: (units) => {
        return `[{"__class__":"ServerRequest","requestData":[[{"__class__":"ArmyPool","units":[${units[0]},${units[1]},${units[2]},${units[3]},${units[4]},${units[5]},${units[6]},${units[7]}],"type":"attacking"},{"__class__":"ArmyPool","units":[],"type":"defending"},{"__class__":"ArmyPool","units":[],"type":"arena_defending"}],{"__class__":"ArmyContext","battleType":"battleground"}],"requestClass":"ArmyUnitManagementService","requestMethod":"updatePools","requestId":7}]`;
    },
}

/*
Grabs guild id
 */
FoEproxy.addHandler('GuildBattlegroundService', 'getBattleground', (data, postData) => {
    gbg.currentParticipantId = data.responseData.currentParticipantId;
});

/*
Gets ID of province being attacked, and the number of waves in battle.
 */
FoEproxy.addHandler('BattlefieldService', 'getArmyPreview', (data, postData) => {
    gbg.currentTarget = postData[0].requestData[0].provinceId;
    gbg.waveCount = data.responseData.length;
});

/*
Continues using units with 8+ HP, replaces rest with full HP
 */
FoEproxy.addHandler('ArmyUnitManagementService', 'getArmyInfo', (data, postData) => {
	let live = 0; 
	
	let presets = {
		0: {turturret : ["turturret", 1], sub_cruiser : ["sub_cruiser", 1], rogue : ["rogue", 6]},
		1: {hydroelectric_eel : ["hydroelectric_eel", 8]},
	};
	
	let inUse = presets[gbg.preset];
	
    let returnArmy = [];
	let returnIDs = {};
    for (let unit of data.responseData.units) {
		for (const pre in inUse) {
			if (unit.__class__ == "ArmyUnitStack" && unit.unitTypeId == inUse[pre][0] && unit.count > 10) {
				returnIDs[pre] = unit.unitIds;
			}
			
			if (unit.is_attacking && unit.unitTypeId == inUse[pre][0]) {
				if (unit.currentHitpoints >= 8) {
					returnArmy.push(unit.unitId);
					inUse[pre][1] -= (unit.unitTypeId == inUse[pre][0]);
				}
				live++;
			}
		}
    }
	
	let totalInc = 0;
	
	for (const pre in inUse) {
		if (returnIDs[pre] == undefined){
			alert("LOW UNITS");
			gbg.stop = true;
		}
		
		let inc = 0;
		while (inUse[pre][1] > 0) {
			returnArmy.push(returnIDs[pre][inc++]);
			inUse[pre][1]--;
		}
		totalInc += inc;
	}
	
    if (returnArmy.length > 8) {
        returnArmy.length = 8;
    }

    gbg.units = returnArmy;
    gbg.changed = totalInc;
    gbg.dead += (8 - live);
});

/*
Checks if previous battle was won
 */
FoEproxy.addHandler('BattlefieldService', 'startByBattleType', (data, postData) => {
    gbg.battlesWon = data.responseData.battleType.battlesWon;
    gbg.won = (data.responseData.state.winnerBit == 1);
	gbg.era = data.responseData.battleType.era;
});

/*
Increments diamond and FP rewards
 */
FoEproxy.addHandler('RewardService', 'collectReward', (data, postData) => {
    if (data.responseData[0][0].subType == "strategy_points") {
        gbg.fp += 10;
    }
    if (data.responseData[0][0].subType == "premium") {
        gbg.diamonds += 45;
    }
});

/*
Stop attacking when hand is put up.
 */
FoEproxy.addWsHandler('GuildBattlegroundSignalsService', 'updateSignal', (data, postData) => {
    if ((data.responseData.provinceId == gbg.currentTarget || (gbg.currentTarget == 0 && data.responseData.provinceId == undefined)) && "ignore" == data.responseData.signal) {
        gbg.stop = true;
    }
});

/*
Stop attacking when approaching demolish danger.
 */
FoEproxy.addWsHandler('GuildBattlegroundService', 'getProvinces', (data, postData) => {
    if ((data.responseData[0].id == gbg.currentTarget || (gbg.currentTarget == 0 && data.responseData[0].id == undefined))) {
        if (data.responseData[0].lockedUntil != undefined) {
            gbg.stop = true;
            return;
        }

        attackers = data.responseData[0].conquestProgress;
        for (let attacker of attackers) {
            if (gbg.currentParticipantId == attacker.participantId) {
				if (!gbg.holding && attacker.maxProgress - attacker.progress <= (25 * !gbg.racing)) {
					gbg.stop = true;
					return;
				} else if (gbg.holding && !(attacker.progress <= 200 || gbg.racing)) {
					gbg.stop = true;
					return;
				}
            }
        }
    }
});

/*
Grabs attrition data for player. 
*/
FoEproxy.addHandler('GuildBattlegroundService', 'getPlayerParticipant', (data, postData) => {
	if (gbg.attritionStart == null) {
		gbg.attritionStart = data.responseData.attrition.level;
	} else {
		gbg.attritionGained = data.responseData.attrition.level - gbg.attritionStart;
	}
});