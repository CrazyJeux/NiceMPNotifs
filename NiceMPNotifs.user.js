// ==UserScript==
// @name         NiceMPNotifs
// @namespace    CrazyJeux/Daring-Do
// @author       CrazyJeux/Daring-Do
// @match        *://www.jeuxvideo.com/*
// @description  Les icônes des MP et des notifications sont toujours visibles, les nombres indiqués sont régulièrement mis à jour et cliquer sur l'icône des MP amène directement à ceux-ci.
// @version      5
// @resource     jQueryJS    https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.0/jquery.min.js
// @grant        GM_getResourceText
// @grant        unsafeWindow
// @grant        GM_info
// @run-at document-start
// ==/UserScript==

'use strict';

var NiceMPNotifs = {

    // Temps entre deux mises à jour du nombre de MP.
    MP_UPDATE_DELAY_MS: 5000,
    // URL de la page à charger pour récupérer le nombre de MP.
    // Cette URL a été choisie parce qu'elle est rapide à charger.
    //MP_UPDATE_URL: "/sso/add_pseudo.php",
	MP_UPDATE_URL: "/messages-prives/boite-reception.php",

    init: function () {
        // L'exécution du script est inutile dans les iframes.
        if (NiceMPNotifs.isInIframe()) {
            return;
        }

        NiceMPNotifs.addStyle();
        NiceMPNotifs.loadJquery();

        NiceMPNotifs.onDomReady(function () {
            NiceMPNotifs.startMPCountUpdateLoop();
            NiceMPNotifs.addMessageBoxLinkOnMPCount();
        });
    },

    isInIframe: function () {
        return window.top !== window.self;
    },

    /**
     * Injecte le CSS nécessaire dans la page.
     */
    addStyle: function () {
        var style = document.createElement("style");
        style.type = "text/css";
        style.setAttribute("data-nicempnotifs-style", "true");

        style.innerHTML = ".account-number-mp:hover, .account-number-notif:hover { transform: scale(1.4); }";
        style.innerHTML += " .account-number { overflow: visible !important; }";
        style.innerHTML += " .account-number-mp+.account-number-notif { margin-left: 0.25rem !important; }";
        style.innerHTML += " .account-avatar-box { margin: 0px 0.375rem 0px 0px !important; }";
        style.innerHTML += " .account-pseudo, .account-number-mp, .account-number-notif { display: inline !important; }";

        document.head.appendChild(style);
    },

    /**
     * Charge jQuery s'il n'est pas déjà présent dans la page.
     */
    loadJquery: function () {

        if (unsafeWindow.jQuery !== undefined) {
            window.$ = unsafeWindow.jQuery;
            return;
        }

        var jQueryEl = document.createElement("script");
        jQueryEl.type = "text/javascript";
        var content = GM_getResourceText("jQueryJS");
        jQueryEl.innerHTML = content;
        jQueryEl.setAttribute("data-info", "jQueryJS");
        document.head.appendChild(jQueryEl);
    },

    /**
     * Appelle `callback` quand le dom est prêt.
     */
    onDomReady: function (callback) {
        // document.ready ne fonctionne pas sur GM avec @run-at document-start.
        var checkDomReady = setInterval(function () {

            // Pour vérifier que le DOM est chargé, on vérifie la présence du footer.
            if (document.querySelector(".stats") !== null) {
                clearInterval(checkDomReady);
                callback();
            }
        }, 50);
    },

    /**
     * Lance la boucle de mise à jour du nombre de MP.
     */
    startMPCountUpdateLoop: function () {
        setInterval(NiceMPNotifs.updateMPCount, NiceMPNotifs.MP_UPDATE_DELAY_MS);
    },

    /**
     * Récupère le nouveau nombre de MP et le met à jour si besoin.
     */
    updateMPCount: function () {
        NiceMPNotifs.getMPCount(function (newCount) {
            $('.account-number-mp:first').attr('data-val', newCount);
        });
    },

    /**
     * Récupère le nouveau nombre de MP. Appelle `callback` quand le nombre est
     * disponible.
     */
    getMPCount: function (callback) {
        $.get(NiceMPNotifs.MP_UPDATE_URL, function (htmlPage) {
            callback(NiceMPNotifs.parseMPCount(htmlPage));
        });
    },

    /**
     * Parse et retourne le nombre de MP dans la page HTML passé en paramètre.
     */
    parseMPCount: function (htmlPage) {
		var h = $.parseHTML(htmlPage);
		var $container = $("<div></div>");
		var found = false;
		for (var i = 0; i < h.length; i++) {
			var el = h[i];
			if (typeof el.querySelector !== "undefined") {
				var res = el.querySelector("#mp-menus");
				if (res !== null) {
					found = true;
					$container.append(res);
					break;
				}
			}
		}
		if (found === false) {
			//console.log("could not find mp-menus div...");
			return 0;
		}
		var $unreadFolders = $container.find(".nonlus:not([data-folder='1337']):not([data-folder='666']) a");
		//console.log("$unreadFolders length is: "+$unreadFolders.length);
		if ($unreadFolders.length === 0) {
			return 0;
		}
		var mainNb = 0;
		$unreadFolders.each(function() {
			var $span = $(this).find("span");
			if ($span.length === 0) {
				//console.log("pas de nouveau mp dans la boite actuelle...");
				return;
			}
			var nb = $span.text().replace("(", "").replace(")", "").trim();
			nb = parseInt(nb, 10);
			mainNb += nb;
		});
		//console.log("mainNb='"+mainNb+"'");
		return mainNb;
		
		
		
		/*
        // On récupère le premier `data-count` trouvé dans la page : c'est le nombre de MP.
        var regexMP = /data-count="(\d+)"/;
        var matchMP = htmlPage.match(regexMP);

        var mpCount = (matchMP && matchMP[1] !== undefined) ? matchMP[1] : 0;

        return parseInt(mpCount, 10);
		*/
    },

    /**
     * Ajoute un lien vers la boîte de réception sur le nombre de MP.
     */
    addMessageBoxLinkOnMPCount: function () {
        $(".account-number-mp:first").on("click", function (e) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            NiceMPNotifs.openInNewTab("/messages-prives/boite-reception.php");
        });
    },

    /**
     * Ouvre un lien dans un nouvel onglet en simulant le clic sur un lien
     * en target="_blank".
     */
    openInNewTab: function (url) {
        var newLink = document.createElement("a");
        newLink.target = "_blank";
        newLink.href = url;
        document.body.appendChild(newLink);
        newLink.click();
        newLink.remove();
    },
};

// Let's go :)
NiceMPNotifs.init();
