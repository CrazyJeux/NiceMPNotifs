// ==UserScript==
// @name         NiceMPNotifs
// @namespace    CrazyJeux/Daring-Do
// @author       CrazyJeux/Daring-Do
// @match        *://www.jeuxvideo.com/*
// @description  Les icônes des MP et des notifications sont toujours visibles, les nombres indiqués sont régulièrement mis à jour et cliquer sur l'icône des MP amène directement à ceux-ci.
// @version      7
// @resource     jQueryJS    https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.0/jquery.min.js
// @grant        GM_getResourceText
// @grant        unsafeWindow
// @run-at document-start
// ==/UserScript==

	'use strict';

function wrapper() {
	'use strict';

	var NiceMPNotifs = {
		// Temps entre deux mises à jour du nombre de MP.
		MP_UPDATE_DELAY_MS: 5000,
		// URL de la page à charger pour récupérer le nombre de MP.
		// Cette URL a été choisie parce qu'elle est rapide à charger.
		MP_UPDATE_URL: "/sso/add_pseudo.php",
		init: function () {
			NiceMPNotifs.addStyle();

			NiceMPNotifs.onDomReady(function () {
				NiceMPNotifs.startMPCountUpdateLoop();
				NiceMPNotifs.addMessageBoxLinkOnMPCount();
				NiceMPNotifs.removeHasNotifClassOnScroll();
			});
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
			style.innerHTML += " .account-pseudo, .account-number-mp, .account-number-notif { display: inline-block !important; }";
			style.innerHTML += " .header-sticky.header-affix .nav-platform { margin-left: 9rem }";
			style.innerHTML += " .header-top .logo.header-affix .logo-link { margin-top: 3px; width: 8rem; }";

			document.head.appendChild(style);
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
			// On récupère le premier `data-count` trouvé dans la page : c'est le nombre de MP.
			var regexMP = /data-count="(\d+)"/;
			var matchMP = htmlPage.match(regexMP);

			var mpCount = (matchMP && matchMP[1] !== undefined) ? matchMP[1] : 0;

			return parseInt(mpCount, 10);
		},
		/**
		 * Ajoute un lien vers la boîte de réception sur le nombre de MP.
		 */
		addMessageBoxLinkOnMPCount: function () {
			var mpIcon = document.querySelector(".account-number-mp");
			if (mpIcon !== null) {
				mpIcon.addEventListener("click", function (e) {
					e.stopImmediatePropagation();
					e.stopPropagation();
					NiceMPNotifs.openInNewTab("/messages-prives/boite-reception.php");
				});
			}
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
			console.log("open in new tab done");
		},
		removeHasNotifClassOnScroll: function () {
			function removeHasNotifClass() {
				if (MPspan.classList.contains("has-notif")) {
					MPspan.classList.remove("has-notif");
				}
			}

			var MPspan = document.querySelector(".account-number-mp");
			if (MPspan === null) {
				return;
			}
			$(window).scroll(removeHasNotifClass);

			removeHasNotifClass();
		}
	};

// Let's go :)
	NiceMPNotifs.init();
}

var inIframe = (window.top !== window.self);
if (!inIframe) {
	if (typeof unsafeWindow.jQuery !== "undefined") {
		window.$ = unsafeWindow.jQuery;
	} else {
		var jQueryEl = document.createElement("script");
		jQueryEl.type = "text/javascript";
		var content = GM_getResourceText("jQueryJS");
		jQueryEl.innerHTML = content;
		jQueryEl.setAttribute("data-info", "jQueryJS");
		document.head.appendChild(jQueryEl);
	}

	var scriptEl = document.createElement("script");
	scriptEl.type = "text/javascript";
	var content = "(function(){ " + wrapper.toString() + " wrapper();})();";
	scriptEl.innerHTML = content;
	scriptEl.setAttribute("data-info", "NiceMPNotifs");
	document.head.appendChild(scriptEl);
}
