let fsp = {

    Show: () => {
        let body = [];
        HTML.AddCssFile('fsp');

        HTML.Box({
            'id': 'fspMenu',
            'title': 'FSP',
            'auto_close': true,
            'dragdrop': true,
            'minimize': false
        });

        body.push(`<div>
		<button class="btn-default" onclick="fsp.stop = false; fsp.lockDialog(); fsp.goofy(fsp.aid);" id="fsp_start">AUTO FSP</button>
		<button class="btn-default" onclick="fsp.stop = true;" id="halt" disabled>Stop</button>
		</div>`);
        body.push(`<p>------------</p>`);
        body.push(`<div>
		<input type="checkbox" class="slider round" style="margin: 0 auto" id="ignore_bg">Use without BG charges?</input>
		<p id="ignore_bg_tf">Ignoring BG?: ${fsp.ignoreBG}</p>
		</div>`);
        body.push(`<p>------------</p>`);
        body.push(`<p id="fsp-details">Current Target: ${(MainParser.CityMapData[fsp.targID] == undefined ? undefined : MainParser.CityMapData[fsp.targID].cityentity_id)} | FP buffer left: ${fsp.maxFP - fsp.currFP} | Collections Made: ${fsp.col_count}</p>`);

        $('#fspMenuBody').html(body);

        document.querySelector("#ignore_bg").oninput = function () {
            fsp.ignoreBG = this.checked;
            fsp.refreshDialog();
        };

        fsp.refreshDialog();
    },

    refreshDialog: () => {
        document.getElementById("ignore_bg_tf").innerHTML = `Ignoring BG?: ${fsp.ignoreBG}`;
        document.getElementById("fsp-details").innerHTML = `Current Target: ${(MainParser.CityMapData[fsp.targID] == undefined ? undefined : MainParser.CityMapData[fsp.targID].cityentity_id)} | FP buffer left: ${fsp.maxFP - fsp.currFP} | Collections Made: ${fsp.col_count}`;
    },

    lockDialog: () => {
        document.getElementById("halt").disabled = false;
        document.getElementById("fsp_start").disabled = true;
        fsp.refreshDialog();
    },

    unlockDialog: () => {
        document.getElementById("halt").disabled = true;
        document.getElementById("fsp_start").disabled = false;
        fsp.refreshDialog();
    },

    stop: false,

    ignoreBG: false,

    col_count: 0,
    fspID: null,
    aidID: null,
    targID: null,
    aoID: null,
	//bgID: null,
    plyrID: null,
    lvl: null,
    mx_lvl: null,
    currFP: null,
    maxFP: null,

    goofy: (func) => {
        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(func, 1500 + Math.ceil(Math.random() * 500));
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.goofy()));
    },

    aid: () => {
        fsp.refreshDialog();

        if (fsp.stop) {
            fsp.targID = null;
        }

        if (fsp.targID == null) {
            fsp.stop = false;
            fsp.unlockDialog();
            alert("Stopped");
            return;
        }
		/*
        if (MainParser.CityMapData[fsp.targID].state.socialInteractionId != undefined) {
            fsp.unlockDialog();
            alert("Unexpected aid");
            return;
        }
		*/
        if (BlueGalaxy.DoubleCollections == 0 && !fsp.ignoreBG) {
            fsp.unlockDialog();
            alert("No BG Charges");
            return;
        }

        if (MainParser.Inventory[fsp.aidID].inStock < 25) {
            fsp.unlockDialog();
            alert("Not enough self-aid kits");
            return;
        }

        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(fsp.goofy, 1200 + Math.ceil(Math.random() * 400), fsp.fsp);
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.aid(fsp.aidID, fsp.targID)));
    },

    fsp: () => {
        if (MainParser.Inventory[fsp.fspID].inStock < 25) {
            alert("Not enough finish special productions");
            return;
        }

        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(fsp.collect, 1200 + Math.ceil(Math.random() * 600));
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.fsp(fsp.fspID, fsp.targID)));
    },

    collect: () => {
        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(fsp.enter, 1000 + Math.ceil(Math.random() * 200));
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.collect(fsp.targID)));
    },

    enter: () => {
        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(fsp.contribute, 800 + Math.ceil(Math.random() * 500));
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.enter(fsp.aoID, fsp.plyrID)));
    },

    contribute: () => {
        if ((fsp.lvl < fsp.mx_lvl && ResourceStock['strategy_points'] > fsp.maxFP - fsp.currFP) || ResourceStock['strategy_points'] <= 0) {
            fsp.unlockDialog();
            alert("Too many FP");
            return;
        }

        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            fsp.col_count += 1;
			fsp.currFP += ResourceStock['strategy_points'];
            setTimeout(fsp.goofy, 500 + Math.ceil(Math.random() * 200), fsp.aid);
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.contribute(fsp.aoID, fsp.plyrID, fsp.lvl, ResourceStock['strategy_points'])));
    },

    reqData: {
        goofy: () => {
            return `[{"__class__":"ServerRequest","requestData":["item",null],"requestClass":"NoticeIndicatorService","requestMethod":"remove","requestId":7}]`;
        },
        aid: (aidID, targID) => {
            return `[{"__class__":"ServerRequest","requestData":[{"__class__":"UseItemOnBuildingPayload","itemId":${aidID},"mapEntityId":${targID},"optionIndex":0}],"requestClass":"InventoryService","requestMethod":"useItem","requestId":7}]`;
        },
        fsp: (fspID, targID) => {
            return `[{"__class__":"ServerRequest","requestData":[{"__class__":"UseItemOnBuildingPayload","itemId":${fspID},"mapEntityId":${targID},"optionIndex":0}],"requestClass":"InventoryService","requestMethod":"useItem","requestId":7}]`;
        },
        collect: (targID) => {
            return `[{"__class__":"ServerRequest","requestData":[[${targID}]],"requestClass":"CityProductionService","requestMethod":"pickupProduction","requestId":7}]`;
        },
        enter: (bldID, plyrID) => {
            return `[{"__class__":"ServerRequest","requestData":[${bldID},${plyrID}],"requestClass":"GreatBuildingsService","requestMethod":"getConstruction","requestId":7}]`;
        },
        contribute: (bldID, plyrID, lvl, amt) => {
            return `[{"__class__":"ServerRequest","requestData":[${bldID},${plyrID},${lvl},${amt},false],"requestClass":"GreatBuildingsService","requestMethod":"contributeForgePoints","requestId":7}]`;
        },
    },
};

FoEproxy.addHandler('CityMapService', 'updateEntity', (data, postData) => {
    if (data.responseData[0].id == fsp.aoID && data.responseData[0].player_id == fsp.plyrID) {
        fsp.currFP = (data.responseData[0].state.invested_forge_points !== undefined ? data.responseData[0].state.invested_forge_points : 0);
        fsp.maxFP = data.responseData[0].state.forge_points_for_level_up;
        fsp.lvl = data.responseData[0].level;
        fsp.mx_lvl = data.responseData[0].max_level;
    }
});

FoEproxy.addHandler('CityProductionService', 'pickupProduction', (data, postData) => {
    fsp.fspID = MainParser.fspID;
    fsp.aidID = MainParser.aidID;
    fsp.aoID = MainParser.BG.id;
	//fsp.bgID = MainParser.BG.id;
    fsp.plyrID = MainParser.BG.player_id;
    fsp.lvl = MainParser.BG.level;
    fsp.mx_lvl = MainParser.BG.max_level;
    fsp.currFP = MainParser.BG.state.invested_forge_points;
    fsp.maxFP = MainParser.BG.state.forge_points_for_level_up;

    fsp.targID = postData[0].requestData[0][0];

    if ($('#fspMenu').length === 0) {
        fsp.Show();
    } 
});
