
var mixiBar = {
  init: function() {
    gBrowser.addProgressListener(this.mWebProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
    window.addEventListener('mouseover', mixiBar.maybeShow, false);
    window.addEventListener('scroll', mixiBar.hide, false);
    this.mixiMagic = document.getElementById('mixi-magic');
    this.active = false;
  },

  /////////////////////////////
  // ミクシー・マジック

  mWebProgressListener: {
    onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus) {},

    onProgressChange : function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {},

    onLocationChange : function(aWebProgress, aRequest, aLocation) {
      try {
        mixiBar.active = (aLocation.host == "mixi.jp");
        mixiBar.hide();
      }
      catch(e) {
        // For some reason an exception is thrown when opening a "recently closed" tag
        // no try/catch would break the recent closed tab menu
      }
    },

    onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage) {},

    onSecurityChange : function(aWebProgress, aRequest, aState) {}
  },

  hide: function() {
    mixiBar.mixiMagic.setAttribute('hidden', 'true');
  },

  show: function(obj, aShashin, aName, aSex) {
    if ((obj.height <= 75) && (obj.width <= 75)) return;

    if (this.timer) window.clearTimeout( this.timer );
    
    var scrollTop = obj.ownerDocument.body.scrollTop;
    if (!scrollTop) {
      scrollTop = obj.ownerDocument.documentElement.scrollTop;
    }

    var scrollLeft = obj.ownerDocument.body.scrollLeft;
    if (!scrollLeft) {
      scrollLeft = obj.ownerDocument.documentElement.scrollLeft;
    }

    var top = 0, left = 0;
    var temp=obj;
    while (temp) {
      top += temp.offsetTop;
      left += temp.offsetLeft;
      temp = temp.offsetParent;
    }

    var tabHeight = document.getAnonymousElementByAttribute(gBrowser, "class", "tabbrowser-strip").boxObject.height;

    var view = obj.ownerDocument.defaultView;
    var style = view.getComputedStyle(obj, ""); 

    var borderLeft = (parseInt(style.getPropertyCSSValue('border-left-width').cssText) || 0) +
                     (parseInt(style.getPropertyCSSValue('margin-left').cssText) || 0) +
                     (parseInt(style.getPropertyCSSValue('padding-left').cssText) || 0); // XXX - this assumes pixels!
    var borderTop  = (parseInt(style.getPropertyCSSValue('border-top-width').cssText) || 0) +
                     (parseInt(style.getPropertyCSSValue('margin-top').cssText) || 0) +
                     (parseInt(style.getPropertyCSSValue('padding-top').cssText) || 0); // XXX - this assumes pixels!

    var pmTop  = top + document.getElementById('content').boxObject.y + tabHeight + borderTop - scrollTop + 24;
    var pmLeft = left + document.getElementById('content').boxObject.x - scrollLeft + borderLeft;

    if (pmTop + 24 > (document.getElementById('content').boxObject.y + document.getElementById('content').boxObject.height)) return;
    
    document.getElementById('mixi-magic').style.top = pmTop + 'px';
    document.getElementById('mixi-magic').style.left = pmLeft  + 'px';
    document.getElementById('mixi-magic-shashin').setAttribute('src', aShashin);
    document.getElementById('mixi-magic-name').setAttribute('value', aName);
    document.getElementById('mixi-magic-sex').setAttribute('value', aSex);
    document.getElementById('mixi-magic').removeAttribute('hidden');
    this.timer = window.setTimeout( mixiBar.hide, 3000 );
  },

  fetchAndShow: function(aTarget, aFriendUrl) {
    dump('Let\'s get '+aFriendUrl+'\n');
    var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance (Components.interfaces.nsIXMLHttpRequest);
    xhr.open ('GET', 'http://mixi.jp/'+aFriendUrl, true);

    xhr.onreadystatechange = function (aEvent) {
      if (xhr.readyState == 4) {
        if (xhr.status != 200) {
          dump (xhr.statusText);
          return;
        }
        // 写真
        var photo = (/<img\sSRC="(.+?)"\sALT=写真\sVSPACE=2>/(xhr.responseText))[1];
        // 名前と性別
        var re = /<td\sWIDTH=345>(.+?)<\/td><\/tr>/g;
        var re2 = /<td\sWIDTH=345>(.+?)<\/td><\/tr>/;

        var lines = xhr.responseText.match(re);
        var name = re2.exec(lines[0])[1];
        var sex = re2.exec(lines[1])[1];
        mixiBar.show(aTarget, photo, name, sex);
      }
    }
    xhr.send (null);
  },
  
  maybeShow: function(event) {
    var target = event.originalTarget;
    if (target.nodeName != 'A')
      return;
    if (target.getAttribute('href').match('show_friend')) {
      mixiBar.fetchAndShow(target, target.getAttribute('href'));
    }
  },

  /////////////////////////////
  // 日記に書く

  blogThis: function () {
    var title = gBrowser.contentTitle;
    var url = gBrowser.currentURI.spec;
  
    // 現在のユーザーのIDが必要 - トップページで見てみよう
    var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance (Ci.nsIXMLHttpRequest);
    xhr.open ('GET', 'http://mixi.jp/', true);

    xhr.onreadystatechange = function (aEvent) {
      if (xhr.readyState == 4) {
        if (xhr.status != 200) {
          dump (xhr.statusText);
          return;
        }
        var re = /"add_diary\.pl\?id=(\d+?)"/;
        dump(xhr.responseText);
        dump(re.exec(xhr.responseText));
        var myId = re.exec(xhr.responseText)[1];
        var tab = gBrowser.addTab('http://mixi.jp/add_diary.pl?id='+myId+'&diary_body='+title+'%0A'+url);
      }
    }
    xhr.send (null); 
  }

}

window.addEventListener("load", function() { mixiBar.init(); }, false);
