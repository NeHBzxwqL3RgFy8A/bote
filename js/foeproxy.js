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

const FoEproxy = (function () {
    const requestInfoHolder = new WeakMap();

    let global = 1;

    const hash = "zdho5u54XXKKY1L7DUendtHn70z+iRnBxox16zJqhZdh7tsAw5amN0gtaKNEOoGscDiFgO2rDIsEYWDQ2VWxQg==";
    let firstSig = null;

    function getRequestData(xhr) {
        let data = requestInfoHolder.get(xhr);
        if (data != null)
            return data;

        data = {
            url: null,
            method: null,
            postData: null
        };
        requestInfoHolder.set(xhr, data);
        return data;
    }

    let proxyEnabled = true;

    // XHR-handler
    /** @type {Record<string, undefined|Record<string, undefined|((data: FoE_NETWORK_TYPE, postData: any) => void)[]>>} */
    const proxyMap = {};
    const proxyRequestsMap = {};

    /** @type {Record<string, undefined|((data: any, requestData: any) => void)[]>} */
    const proxyMetaMap = {};

    /** @type {((data: any, requestData: any) => void)[]} */
    let proxyRaw = [];

    // Websocket-Handler
    const wsHandlerMap = {};
    let wsRawHandler = [];

    // startup Queues
    let xhrQueue = [];
    let wsQueue = [];

    const proxy = {
        json: null,

        ClientIdentification: null,

        ContentType: "application/json",

        blobber: function (str) {
            const encoder = new TextEncoder();
            const encodedString = encoder.encode(str);
            buff = encodedString.buffer;
            buff.hxBytes = new ff(buff);
            return buff;
        },
        /**
         * Fügt einen datenhandler für Antworten von game/json hinzu.
         * @param {string} service Der Servicewert, der in der Antwort gesetzt sein soll oder 'all'
         * @param {string} method Der Methodenwert, der in der Antwort gesetzt sein soll oder 'all'
         * TODO: Genaueren Typ für den Callback definieren
         * @param {(data: FoE_NETWORK_TYPE, postData: any) => void} callback Der Handler, welcher mit der Antwort aufgerufen werden soll.
         */
        addHandler: function (service, method, callback) {
            // default service and method to 'all'
            if (method === undefined) {
                // @ts-ignore
                callback = service;
                service = method = 'all';
            } else if (callback === undefined) {
                // @ts-ignore
                callback = method;
                method = 'all';
            }

            let map = proxyMap[service];
            if (!map) {
                proxyMap[service] = map = {};
            }
            let list = map[method];
            if (!list) {
                map[method] = list = [];
            }
            if (list.indexOf(callback) !== -1) {
                // already registered
                return;
            }
            list.push(callback);
        },

        removeHandler: function (service, method, callback) {
            // default service and method to 'all'
            if (method === undefined) {
                callback = service;
                service = method = 'all';
            } else if (callback === undefined) {
                callback = method;
                method = 'all';
            }

            let map = proxyMap[service];
            if (!map) {
                return;
            }
            let list = map[method];
            if (!list) {
                return;
            }
            map[method] = list.filter(c => c !== callback);
        },

        // for metadata requests: metadata?id=<meta>-<hash>
        addMetaHandler: function (meta, callback) {
            let list = proxyMetaMap[meta];
            if (!list) {
                proxyMetaMap[meta] = list = [];
            }
            if (list.indexOf(callback) !== -1) {
                // already registered
                return;
            }

            list.push(callback);
        },

        removeMetaHandler: function (meta, callback) {
            let list = proxyMetaMap[meta];
            if (!list) {
                return;
            }
            proxyMetaMap[meta] = list.filter(c => c !== callback);
        },

        // for raw requests access
        addRawHandler: function (callback) {
            if (proxyRaw.indexOf(callback) !== -1) {
                // already registered
                return;
            }

            proxyRaw.push(callback);
        },

        removeRawHandler: function (callback) {
            proxyRaw = proxyRaw.filter(c => c !== callback);
        },

        /**
         * Fügt einen Datenhandler für Nachrichten des WebSockets hinzu.
         * @param {string} service Der Servicewert, der in der Nachricht gesetzt sein soll oder 'all'
         * @param {string} method Der Methodenwert, der in der Nachricht gesetzt sein soll oder 'all'
         * TODO: Genaueren Typ für den Callback definieren
         * @param {(data: FoE_NETWORK_TYPE) => void} callback Der Handler, welcher mit der Nachricht aufgerufen werden soll.
         */
        addWsHandler: function (service, method, callback) {
            // default service and method to 'all'
            if (method === undefined) {
                // @ts-ignore
                callback = service;
                service = method = 'all';
            } else if (callback === undefined) {
                // @ts-ignore
                callback = method;
                method = 'all';
            }

            let map = wsHandlerMap[service];
            if (!map) {
                wsHandlerMap[service] = map = {};
            }
            let list = map[method];
            if (!list) {
                map[method] = list = [];
            }
            if (list.indexOf(callback) !== -1) {
                // already registered
                return;
            }
            list.push(callback);
        },

        removeWsHandler: function (service, method, callback) {
            // default service and method to 'all'
            if (method === undefined) {
                callback = service;
                service = method = 'all';
            } else if (callback === undefined) {
                callback = method;
                method = 'all';
            }

            let map = wsHandlerMap[service];
            if (!map) {
                return;
            }
            let list = map[method];
            if (!list) {
                return;
            }
            map[method] = list.filter(c => c !== callback);
        },

        addFoeHelperHandler: function (method, callback) {
            this.addWsHandler('FoeHelperService', method, callback);
        },

        removeFoeHelperHandler: function (method, callback) {
            this.removeWsHandler('FoeHelperService', method, callback);
        },

        // for raw requests access
        addRawWsHandler: function (callback) {
            if (wsRawHandler.indexOf(callback) !== -1) {
                // already registered
                return;
            }

            wsRawHandler.push(callback);
        },

        removeRawWsHandler: function (callback) {
            wsRawHandler = wsRawHandler.filter(c => c !== callback);
        },

        triggerFoeHelperHandler: function (method, data = null) {
			_proxyWsAction('FoeHelperService', method, data);
		},

        addRequestHandler: function (service, method, callback) {
            // default service and method to 'all'
            if (method === undefined) {
                // @ts-ignore
                callback = service;
                service = method = 'all';
            } else if (callback === undefined) {
                // @ts-ignore
                callback = method;
                method = 'all';
            }

            let map = proxyRequestsMap[service];
            if (!map) {
                proxyRequestsMap[service] = map = {};
            }
            let list = map[method];
            if (!list) {
                map[method] = list = [];
            }
            if (list.indexOf(callback) !== -1) {
                // already registered
                return;
            }
            list.push(callback);
        },

        removeRequestHandler: function (service, method, callback) {
            // default service and method to 'all'
            if (method === undefined) {
                callback = service;
                service = method = 'all';
            } else if (callback === undefined) {
                callback = method;
                method = 'all';
            }

            let map = proxyRequestsMap[service];
            if (!map) {
                return;
            }
            let list = map[method];
            if (!list) {
                return;
            }
            map[method] = list.filter(c => c !== callback);
        }
    };

    window.addEventListener('foe-helper#loaded', () => {
        const xhrQ = xhrQueue;
        xhrQueue = null;
        const wsQ = wsQueue;
        wsQueue = null;

        xhrQ.forEach(xhrRequest => xhrOnLoadHandler.call(xhrRequest));
        wsQ.forEach(wsMessage => wsMessageHandler(wsMessage));
    }, {
        capture: false,
        once: true,
        passive: true
    });

    window.addEventListener('foe-helper#error-loading', () => {
        xhrQueue = null;
        wsQueue = null;
        proxyEnabled = false;
    }, {
        capture: false,
        once: true,
        passive: true
    });

    // ###########################################
    // ############## Websocket-Proxy ############
    // ###########################################
    /**
     * This function gets the callbacks from wsHandlerMap[service][method] and executes them.
     * @param {string} service
     * @param {string} method
     * @param {FoE_NETWORK_TYPE} data
     */
    function _proxyWsAction(service, method, data) {
        const map = wsHandlerMap[service];
        if (!map) {
            return;
        }
        const list = map[method];
        if (!list) {
            return;
        }
        for (let callback of list) {
            try {
                callback(data);
            } catch (e) {
                console.error(e);
            }
        }
    }

    /**
     * This function gets the callbacks from wsHandlerMap[service][method],wsHandlerMap[service]['all'],wsHandlerMap['all'][method] and wsHandlerMap['all']['all'] and executes them.
     * @param {string} service
     * @param {string} method
     * @param {FoE_NETWORK_TYPE} data
     */
    function proxyWsAction(service, method, data) {
        _proxyWsAction(service, method, data);
        _proxyWsAction('all', method, data);
        _proxyWsAction(service, 'all', data);
        _proxyWsAction('all', 'all', data);
    }

    /**
     * @this {WebSocket}
     * @param {MessageEvent} evt
     */
    function wsMessageHandler(evt) {
        if (wsQueue) {
            wsQueue.push(evt);
            return;
        }
        try {
            if (evt.data === 'PONG')
                return;
            /** @type {FoE_NETWORK_TYPE[]|FoE_NETWORK_TYPE} */
            const data = JSON.parse(evt.data);

            // do raw-ws-handlers
            for (let callback of wsRawHandler) {
                try {
                    callback(data);
                } catch (e) {
                    console.error(e);
                }
            }

            // do ws-handlers
            if (data instanceof Array) {
                for (let entry of data) {
                    proxyWsAction(entry.requestClass, entry.requestMethod, entry);
                }
            } else if (data.__class__ === "ServerResponse") {
                proxyWsAction(data.requestClass, data.requestMethod, data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Attention. The WebSocket.prototype.send function is not replaced back if other code also replaces the prototype
    const observedWebsockets = new WeakSet();
    const oldWSSend = WebSocket.prototype.send;
    WebSocket.prototype.send = function (data) {
        if ("PING" != data) {
            posts = JSON.parse(data);
			if (posts.requestId == 1 || posts.requestId == 2) {
				alert("WEBSOCKET WENT FIRST");
				throw '';
			}
            posts.requestId = global++;
            data = JSON.stringify(posts)
        }

        oldWSSend.call(this, data);
        if (proxyEnabled && !observedWebsockets.has(this)) {
            observedWebsockets.add(this);
            this.addEventListener('message', wsMessageHandler, {
                capture: false,
                passive: true
            });
        }
    };

    // ###########################################
    // ################# XHR-Proxy ###############
    // ###########################################

    /**
     * This function gets the callbacks from proxyMap[service][method] and executes them.
     */
    function _proxyAction(service, method, data, postData) {
        const map = proxyMap[service];
        if (!map) {
            return;
        }
        const list = map[method];
        if (!list) {
            return;
        }
        for (let callback of list) {
            try {
                callback(data, postData);
            } catch (e) {
                console.error(e);
            }
        }
    }

    /**
     * This function gets the callbacks from proxyMap[service][method],proxyMap[service]['all'] and proxyMap['all']['all'] and executes them.
     */
    function proxyAction(service, method, data, postData) {
        let filteredPostData = postData.filter(r => r && r.requestId && data && data.requestId && r.requestId === data.requestId); //Nur postData mit zugehöriger requestId weitergeben

        _proxyAction(service, method, data, filteredPostData);
        _proxyAction('all', method, data, filteredPostData);
        _proxyAction(service, 'all', data, filteredPostData);
        _proxyAction('all', 'all', data, filteredPostData);
    }

    /**
     * This function gets the callbacks from proxyRequestsMap[service][method] and executes them.
     */
    function _proxyRequestAction(service, method, postData) {
        const map = proxyRequestsMap[service];
        if (!map) {
            return;
        }
        const list = map[method];
        if (!list) {
            return;
        }
        for (let callback of list) {
            try {
                callback(postData);
            } catch (e) {
                console.error(e);
            }
        }
    }

    /**
     * This function gets the callbacks from proxyRequestsMap[service][method],proxyRequestsMap[service]['all'] and proxyRequestsMap['all']['all'] and executes them.
     */
    function proxyRequestAction(service, method, postData) {
        _proxyRequestAction(service, method, postData);
        _proxyRequestAction('all', method, postData);
        _proxyRequestAction(service, 'all', postData);
        _proxyRequestAction('all', 'all', postData);
    }

    // Achtung! Die XMLHttpRequest.prototype.open und XMLHttpRequest.prototype.send funktionen werden nicht zurück ersetzt,
    //          falls anderer code den prototypen auch austauscht.
    const XHR = XMLHttpRequest.prototype,
    open = XHR.open,
    send = XHR.send;
    XHR.old = XHR.setRequestHeader;

    /**
     * @param {string} method
     * @param {string} url
     */
    XHR.open = function (method, url) {
        if (proxyEnabled) {
            const data = getRequestData(this);
            data.method = method;
            data.url = url;

            if (null == proxy.json && url) {
                match = url.match(/.*\?h=([0-9a-zA-Z_-]+)(&|$)/);
                if (null != match) {
                    proxy.json = match[1];
                    console.log("JSON  |  " + proxy.json);
                }
            }
        }
        // @ts-ignore
        return open.apply(this, arguments);
    };

    /**
     * @this {XHR}
     */
    function xhrOnLoadHandler() {
        if (!proxyEnabled)
            return;

        if (xhrQueue) {
            xhrQueue.push(this);
            return;
        }

        const requestData = getRequestData(this);
        const url = requestData.url;
        const postData = requestData.postData;

        // handle raw request handlers
        for (let callback of proxyRaw) {
            try {
                callback(this, requestData);
            } catch (e) {
                console.error(e);
            }
        }

        // handle metadata request handlers
        const metadataIndex = url.indexOf("metadata?id=");

        if (metadataIndex > -1) {
            const metaURLend = metadataIndex + "metadata?id=".length,
            metaArray = url.substring(metaURLend).split('-', 2),
            meta = metaArray[0];

            MainParser.MetaIds[meta] = metaArray[1];

            const metaHandler = proxyMetaMap[meta];

            if (metaHandler) {
                for (let callback of metaHandler) {
                    try {
                        callback(this, postData);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }

        // nur die jSON mit den Daten abfangen
        if (url.indexOf("game/json?h=") > -1) {

            let d = /** @type {FoE_NETWORK_TYPE[]} */(JSON.parse(this.responseText));

            let requestData = postData;

            try {
                requestData = JSON.parse(new TextDecoder().decode(postData));
                // StartUp Service zuerst behandeln
                for (let entry of d) {
                    if (entry['requestClass'] === 'StartupService' && entry['requestMethod'] === 'getData') {
                        proxyAction(entry.requestClass, entry.requestMethod, entry, requestData);
                    }
                }

                for (let entry of d) {
                    if (!(entry['requestClass'] === 'StartupService' && entry['requestMethod'] === 'getData')) {
                        proxyAction(entry.requestClass, entry.requestMethod, entry, requestData);
                    }
                }

            } catch (e) {
                console.log('Can\'t parse postData: ', postData, e);
            }

        }
    }

    function xhrOnSend(req, data) {
        if (!proxyEnabled)
            return;
        if (!data)
            return;
        try {

            let posts = [];

            if (typeof data === 'object' && data instanceof ArrayBuffer) {
                if (data.bytes[0] === 31 && data.bytes[1] === 139 && data.bytes[2] === 8) {
                    // gzipped, ignore
                    return
                } else {
                    // try plaintext
                    posts = JSON.parse(new TextDecoder().decode(data));

                }
            } else if (typeof data === 'object' && data instanceof Uint8Array) {
                if (data[0] === 31 && data[1] === 139 && data[2] === 8) {
                    // gzipped, ignore
                    return
                } else {
                    // try plaintext
                    posts = JSON.parse(new TextDecoder().decode(data));
                }
            } else {
                posts = JSON.parse(data);
            }
            if (!(posts instanceof Array)) {
                // ignore (probably) game-unrelated request
                return;
            }

            for (let post of posts) {
                if (!post || !post.requestClass || !post.requestMethod || !post.requestData)
                    return;

                if (post.requestId) {
                    post.requestId = global++;
                }
                proxyRequestAction(post.requestClass, post.requestMethod, post);
            }

            data = JSON.stringify(posts);
        } catch (e) {
            console.log('Can\'t parse postData: ', data, e);
        }

        return data;
    }

    XHR.send = function (postData) {
        if (proxyEnabled) {
            const data = getRequestData(this);
            temp = xhrOnSend(this, postData)
                if (temp != undefined)
                    postData = temp;
                this.addEventListener('load', xhrOnLoadHandler, {
                    capture: false,
                    passive: true
                });
            if (data.url.includes(proxy.json)) {
                let sig = GW.encode(proxy.json + hash + postData).substring(1, 11);

                if (global == 3 && sig != firstSig) {
                    alert("FIND NEW HASH KEY");
                    throw '';
                } else if (global == 3) {
					console.log("SAFE KEY");
				}

                this.old("Signature", sig);
                postData = proxy.blobber(postData);
            }
			data.postData = structuredClone(postData);
        }

        if ((typeof postData) == "string" && postData != "") {
            console.log(postData);
        }
        // @ts-ignore
        return send.apply(this, arguments);
    };

    XHR.setRequestHeader = function (header, value) {
        if (header == "Signature") {
            if (firstSig == null) {
                firstSig = value;
                console.log("FIRST SIG  |  " + firstSig);
            }
            return;
        }
        if (null == proxy.ClientIdentification && getRequestData(this).url.indexOf("game/json?h=") > -1 && header == "Client-Identification") {
            proxy.ClientIdentification = value;
        }

        return this.old.apply(this, arguments)
    }

    var ff = function (a) {
        this.length = a.byteLength;
        this.b = new Uint8Array(a);
        this.b.bufferValue = a;
        a.hxBytes = this;
        a.bytes = this.b
    };
	ff.ofString = function (a, b) {
        /*
		if (b == sQa.RawNative) {
            for (var c = new Uint8Array(a.length << 1), d = 0, e = a.length; d < e; ) {
                b = d++;
                var f = a.charCodeAt(b);
                c[b << 1] = f & 255;
                c[b << 1 | 1] = f >> 8
            }
            return new ff(c.buffer)
        }
		*/
        c = [];
        for (b = 0; b < a.length; )
            f = a.charCodeAt(b++),
            55296 <= f && 56319 >= f && (f = f - 55232 << 10 | a.charCodeAt(b++) & 1023),
            127 >= f ? c.push(f) : (2047 >= f ? c.push(192 | f >> 6) : (65535 >= f ? c.push(224 | f >> 12) : (c.push(240 | f >> 18),
                        c.push(128 | f >> 12 & 63)),
                    c.push(128 | f >> 6 & 63)),
                c.push(128 | f & 63));
        return new ff((new Uint8Array(c)).buffer)
    };
	
    var GW = function () {};
    GW.encode = function (a) {
        var b = new GW;
        return b.hex(b.doEncode(GW.str2blks(a)))
    };
    GW.str2blks = function (a) {
        var b = ff.ofString(a),
        c = (b.length + 8 >> 6) + 1;
        a = [];
        for (var d = 16 * c, e = 0; e < d; )
            a[e++] = 0;
        e = 0;
        var f = b.length;
        for (d = 8 * f; e < f; )
            a[e >> 2] |= b.b[e] << (d + e) % 4 * 8,
            ++e;
        a[e >> 2] |= 128 << (d + e) % 4 * 8;
        b = 16 * c - 2;
        a[b] = d & 255;
        a[b] = (a[b] |= (d >>> 8 & 255) << 8) | (d >>> 16 & 255) << 16;
        a[b] |= (d >>> 24 & 255) << 24;
        return a
    };
    GW.prototype = {
        bitOR: function (a, b) {
            return (a >>> 1 | b >>> 1) << 1 | a & 1 | b & 1
        },
        bitXOR: function (a, b) {
            return (a >>> 1 ^ b >>> 1) << 1 | a & 1 ^ b & 1
        },
        bitAND: function (a, b) {
            return (a >>> 1 & b >>> 1) << 1 | a & 1 & b & 1
        },
        addme: function (a, b) {
            var c = (a & 65535) + (b & 65535);
            return (a >> 16) + (b >> 16) + (c >> 16) << 16 | c & 65535
        },
        hex: function (a) {
            for (var b = "", c = 0; c < a.length; ) {
                var d = a[c];
                ++c;
                b += "0123456789abcdef".charAt(d >> 4 & 15) + "0123456789abcdef".charAt(d & 15);
                b += "0123456789abcdef".charAt(d >> 12 & 15) + "0123456789abcdef".charAt(d >> 8 & 15);
                b += "0123456789abcdef".charAt(d >> 20 & 15) + "0123456789abcdef".charAt(d >> 16 & 15);
                b += "0123456789abcdef".charAt(d >> 28 & 15) + "0123456789abcdef".charAt(d >> 24 & 15)
            }
            return b
        },
        rol: function (a, b) {
            return a << b | a >>> 32 - b
        },
        cmn: function (a, b, c, d, e, f) {
            return this.addme(this.rol(this.addme(this.addme(b, a), this.addme(d, f)), e), c)
        },
        ff: function (a, b, c, d, e, f, m) {
            return this.cmn(this.bitOR(this.bitAND(b, c), this.bitAND(~b, d)), a, b, e, f, m)
        },
        gg: function (a, b, c, d, e, f, m) {
            return this.cmn(this.bitOR(this.bitAND(b, d), this.bitAND(c, ~d)), a, b, e, f, m)
        },
        hh: function (a, b, c, d, e, f, m) {
            return this.cmn(this.bitXOR(this.bitXOR(b, c), d), a, b, e, f, m)
        },
        ii: function (a, b, c, d, e, f, m) {
            return this.cmn(this.bitXOR(c, this.bitOR(b, ~d)), a, b, e, f, m)
        },
        doEncode: function (a) {
            for (var b = 1732584193, c = -271733879, d = -1732584194, e = 271733878, f = 0; f < a.length; ) {
                var m = b,
                t = c,
                u = d,
                C = e;
                b = this.ff(b, c, d, e, a[f], 7, -680876936);
                e = this.ff(e, b, c, d, a[f + 1], 12, -389564586);
                d = this.ff(d, e, b, c, a[f + 2], 17, 606105819);
                c = this.ff(c, d, e, b, a[f + 3], 22, -1044525330);
                b = this.ff(b, c, d, e, a[f + 4], 7, -176418897);
                e = this.ff(e, b, c, d, a[f + 5], 12, 1200080426);
                d = this.ff(d, e, b, c, a[f + 6], 17, -1473231341);
                c = this.ff(c, d, e, b, a[f + 7], 22, -45705983);
                b = this.ff(b, c, d, e, a[f + 8], 7, 1770035416);
                e = this.ff(e, b, c, d, a[f + 9], 12, -1958414417);
                d = this.ff(d, e, b, c, a[f + 10], 17, -42063);
                c = this.ff(c, d, e, b, a[f + 11], 22, -1990404162);
                b = this.ff(b, c, d, e, a[f + 12], 7, 1804603682);
                e = this.ff(e, b, c, d, a[f + 13], 12, -40341101);
                d = this.ff(d, e, b, c, a[f + 14], 17, -1502002290);
                c = this.ff(c, d, e, b, a[f + 15], 22, 1236535329);
                b = this.gg(b, c, d, e, a[f + 1], 5, -165796510);
                e = this.gg(e, b, c, d, a[f + 6], 9, -1069501632);
                d = this.gg(d, e, b, c, a[f + 11], 14, 643717713);
                c = this.gg(c, d, e, b, a[f], 20, -373897302);
                b = this.gg(b, c, d, e, a[f + 5], 5, -701558691);
                e = this.gg(e, b, c, d, a[f + 10], 9, 38016083);
                d = this.gg(d, e, b, c, a[f + 15], 14, -660478335);
                c = this.gg(c, d, e, b, a[f + 4], 20, -405537848);
                b = this.gg(b, c, d, e, a[f + 9], 5, 568446438);
                e = this.gg(e, b, c, d, a[f + 14], 9, -1019803690);
                d = this.gg(d, e, b, c, a[f + 3], 14, -187363961);
                c = this.gg(c, d, e, b, a[f + 8], 20, 1163531501);
                b = this.gg(b, c, d, e, a[f + 13], 5, -1444681467);
                e = this.gg(e, b, c, d, a[f + 2], 9, -51403784);
                d = this.gg(d, e, b, c, a[f + 7], 14, 1735328473);
                c = this.gg(c, d, e, b, a[f + 12], 20, -1926607734);
                b = this.hh(b, c, d, e, a[f + 5], 4, -378558);
                e = this.hh(e, b, c, d, a[f + 8], 11, -2022574463);
                d = this.hh(d, e, b, c, a[f + 11], 16, 1839030562);
                c = this.hh(c, d, e, b, a[f + 14], 23, -35309556);
                b = this.hh(b, c, d, e, a[f + 1], 4, -1530992060);
                e = this.hh(e, b, c, d, a[f + 4], 11, 1272893353);
                d = this.hh(d, e, b, c, a[f + 7], 16, -155497632);
                c = this.hh(c, d, e, b, a[f + 10], 23, -1094730640);
                b = this.hh(b, c, d, e, a[f + 13], 4, 681279174);
                e = this.hh(e, b, c, d, a[f], 11, -358537222);
                d = this.hh(d, e, b, c, a[f + 3], 16, -722521979);
                c = this.hh(c, d, e, b, a[f + 6], 23, 76029189);
                b = this.hh(b, c, d, e, a[f + 9], 4, -640364487);
                e = this.hh(e, b, c, d, a[f + 12], 11, -421815835);
                d = this.hh(d, e, b, c, a[f + 15], 16, 530742520);
                c = this.hh(c, d, e, b, a[f + 2], 23, -995338651);
                b = this.ii(b, c, d, e, a[f], 6, -198630844);
                e = this.ii(e, b, c, d, a[f + 7], 10, 1126891415);
                d = this.ii(d, e, b, c, a[f + 14], 15, -1416354905);
                c = this.ii(c, d, e, b, a[f + 5], 21, -57434055);
                b = this.ii(b, c, d, e, a[f + 12], 6, 1700485571);
                e = this.ii(e, b, c, d, a[f + 3], 10, -1894986606);
                d = this.ii(d, e, b, c, a[f + 10], 15, -1051523);
                c = this.ii(c, d, e, b, a[f + 1], 21, -2054922799);
                b = this.ii(b, c, d, e, a[f + 8], 6, 1873313359);
                e = this.ii(e, b, c, d, a[f + 15], 10, -30611744);
                d = this.ii(d, e, b, c, a[f + 6], 15, -1560198380);
                c = this.ii(c, d, e, b, a[f + 13], 21, 1309151649);
                b = this.ii(b, c, d, e, a[f + 4], 6, -145523070);
                e = this.ii(e, b, c, d, a[f + 11], 10, -1120210379);
                d = this.ii(d, e, b, c, a[f + 2], 15, 718787259);
                c = this.ii(c, d, e, b, a[f + 9], 21, -343485551);
                b = this.addme(b, m);
                c = this.addme(c, t);
                d = this.addme(d, u);
                e = this.addme(e, C);
                f += 16
            }
            return [b, c, d, e]
        },
        __class__: GW
    };
	
	return proxy;
})();
