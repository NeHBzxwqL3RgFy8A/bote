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
		<button class="btn-default" onclick="fsp.goofy(fsp.aid);" id="fsp_start">AUTO FSP</button>
		</div>`);
        body.push(`<p>------------</p>`);
        body.push(`<p id="fsp-details">Current Target: ${(MainParser.CityMapData[fsp.targID] !== undefined ? MainParser.CityMapData[fsp.targID].cityentity_id : undefined)} | FP buffer left: ${fsp.maxFP - fsp.currFP}</p>`);

        $('#fspMenuBody').html(body);
		
		fsp.refreshDialog(); 
    },

    refreshDialog: () => {
        document.getElementById("fsp-details").innerHTML = `Current Target: ${MainParser.CityMapData[fsp.targID].cityentity_id} | FP buffer left: ${fsp.maxFP - fsp.currFP}`;
    },

    fspID: null,
    aidID: null,
    targID: null,
    aoID: null,
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
            setTimeout(func, 15 + Math.ceil(Math.random() * 20));
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.goofy()));
    },

    aid: () => {
        if (BlueGalaxy.DoubleCollections == 0) {
            alert("No more BG charges");
            return;
        }

        fsp.refreshDialog();

        if (MainParser.Inventory[fsp.aidID].inStock < 25) {
            alert("Not enough self-aid kits");
            return;
        }

        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(fsp.goofy, 250 + Math.ceil(Math.random() * 100), fsp.fsp);
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
            setTimeout(fsp.collect, 250 + Math.ceil(Math.random() * 100));
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.fsp(fsp.fspID, fsp.targID)));
    },

    collect: () => {
        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(fsp.enter, 150 + Math.ceil(Math.random() * 50));
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.collect(fsp.targID)));
    },

    enter: () => {
        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(fsp.contribute, 250 + Math.ceil(Math.random() * 100));
        };

        newReq.send(FoEproxy.blobber(fsp.reqData.enter(fsp.aoID, fsp.plyrID)));
    },

    contribute: () => {
        if (fsp.lvl < fsp.mx_lvl && ResourceStock['strategy_points'] > fsp.maxFP - fsp.currFP) {
            alert("Too many FP");
            return;
        }

        const newReq = new XMLHttpRequest();
        newReq.open("POST", "https://us9.forgeofempires.com/game/json?h=" + FoEproxy.json);
        newReq.setRequestHeader("Client-Identification", FoEproxy.ClientIdentification);
        newReq.setRequestHeader("Content-Type", FoEproxy.ContentType);

        newReq.onload = function () {
            setTimeout(fsp.goofy, 150 + Math.ceil(Math.random() * 50), fsp.aid);
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
    if (BlueGalaxy.DoubleCollections > 0) {
        fsp.fspID = MainParser.fspID;
        fsp.aidID = MainParser.aidID;
        fsp.aoID = MainParser.AO.id;
        fsp.plyrID = MainParser.AO.player_id;
        fsp.lvl = MainParser.AO.level;
        fsp.mx_lvl = MainParser.AO.max_level;
        fsp.currFP = MainParser.AO.state.invested_forge_points;
        fsp.maxFP = MainParser.AO.state.forge_points_for_level_up;
        if ($('#fspMenu').length === 0) {
            fsp.Show();
        }
        fsp.targID = postData[0].requestData[0][0];
    }
});
