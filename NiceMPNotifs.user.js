// ==UserScript==
// @name		NiceMPNotifs
// @namespac	CrazyJeux/Daring-Do
// @author		CrazyJeux/Daring-Do
// @match		*://www.jeuxvideo.com/*
// @description	Les icônes des MP et des notifications sont toujours visibles, les nombres indiqués sont régulièrement mis à jour et cliquer sur l'icône des MP amène directement à ceux-ci.
// @version		2
// @resource	jQueryJS    https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.0/jquery.min.js
// @grant		GM_getResourceText
// @grant		unsafeWindow
// @grant		GM_info
// ==/UserScript==

function unique() {
    function toCall() {
        function updateNbOfNewMP() {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                    var h = $.parseHTML(xmlhttp.responseText);
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
                        return;
                    }
                    var $unreadFolders = $container.find(".nonlus:not([data-folder='1337']):not([data-folder='666']) a");
                    //console.log("$unreadFolders length is: "+$unreadFolders.length);
                    if ($unreadFolders.length === 0) {
                        $nbNewMPArea.attr("data-val", 0)
                            .attr("data-count", 0);
                        return;
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
                    $nbNewMPArea.attr("data-val", mainNb)
                        .attr("data-count", mainNb);
                }
            };
            var url = "http://www.jeuxvideo.com/messages-prives/boite-reception.php";
            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        }




        function check() {
            //console.log("check...");
            if ($sticky.is(".header-affix")) {
                //console.log("is affix");
                $sticky.removeClass("header-affix");
            }
        }





        var sticky = document.querySelector(".header-sticky");
        if (sticky === null) {
            return;
        }
        var $sticky = $(sticky);
        $sticky.css("position", "fixed")
            .css("width", "100%")
            .css("top", "0");

        check();

        $(window).scroll(check);




        var $nbNewMPArea = $(".account-number-mp");
        if ($nbNewMPArea.length !== 0) {
            setInterval(updateNbOfNewMP, 3000);




            var style = document.createElement("style");
            style.type = "text/css";
            style.setAttribute("data-nicempnotifs-style", "true");
            style.innerHTML = ".account-number-mp:hover, .account-number-notif:hover { font-size: 110%; } ";
            style.innerHTML += " .header-top >.header-container { display: none; }";
            document.head.appendChild(style);

            /*
            var $pseudoArea = $(".account-pseudo");

            $nbNewMPArea.on("mouseenter", function(e) {
                $pseudoArea.get(0).style.color = "white";
            });
            $nbNewMPArea.on("mouseleave", function(e) {
                $pseudoArea.get(0).style.color = "inherit";
            });
            */

            $nbNewMPArea.on("click", function(e) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                var newLink = document.createElement("a");
                newLink.target = "_blank";
                var src = "http://www.jeuxvideo.com/messages-prives/boite-reception.php";
                newLink.href = src;
                newLink.innerHTML = src;
                document.body.appendChild(newLink);
                newLink.click();
                newLink.remove();
            });
        }
    }




    var script = document.createElement("script");
    script.type = "text/javascript";
    script.setAttribute("data-script-nicempnotifs", "true");
    script.innerHTML = "(function(){ " + toCall.toString() + " toCall();})();";
    document.head.appendChild(script);
}






if (typeof unsafeWindow.jQuery === "undefined") {
    var jQueryEl = document.createElement("script");
    jQueryEl.type = "text/javascript";
    var content = GM_getResourceText("jQueryJS");
    jQueryEl.innerHTML = content;
    jQueryEl.setAttribute("data-info", "jQueryJS");
    document.head.appendChild(jQueryEl);
}

unique();

//Respeed
addEventListener('instantclick:newpage', unique);
