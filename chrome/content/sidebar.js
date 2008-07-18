const Cc = Components.classes;
const Ci = Components.interfaces;

function $(aId) {
  return document.getElementById(aId);
}

function loadMixbar() {
  loadTop();
  loadFriends();
}

function openMixiUrl(aEvent, aUrl) {
  if (aEvent.button == 2)
    return
  openUILinkIn(aUrl, (aEvent.ctrlKey || aEvent.metaKey || (aEvent.button == 1))?'tab':'current', false);
}


////////////////////////////////////////
// トップ

function loadTop() {
  loadMe();
  // loadDiary();
  // loadCommunities();
}

function parseMe(aText) {
  dump (aText);
  var re =/<div\sclass="contents01">\s+<img\ssrc="(.+?)"\salt="(.+?)"\s\/>/;

  var nameline = aText.match(re);
  var name = nameline[2];
  $("welcome").setAttribute("value", "ようこそ、" + name);
}

function loadMe() {
  while($('events').childNodes.length > 0)
    $('events').removeChild($('events').lastChild);

  var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance (Ci.nsIXMLHttpRequest);
  xhr.open ('GET', 'http://mixi.jp/', true);

  xhr.onreadystatechange = function (aEvent) {
    if (xhr.readyState == 4) {
      if (xhr.status != 200) {
        dump (xhr.statusText);
        return;
      }
      parseMe (xhr.responseText);
    }
  }
  xhr.send (null);
}

////////////////////////////////////////
// 友達のリストをアップデートする

function addFriend(aFriendId, aName, aPhoto) {
  item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "mixifriend");
  item.setAttribute("name", aName);
  item.setAttribute("avatar", aPhoto);
  item.setAttribute("ontoppageclick", "openMixiUrl(event, 'http://mixi.jp/show_friend.pl?id="+aFriendId+"');");
  item.setAttribute("onmessageclick", "openMixiUrl(event, 'http://mixi.jp/send_message.pl?id="+aFriendId+"');");
  item.setAttribute("ondiaryclick", "openMixiUrl(event, 'http://mixi.jp/list_diary.pl?id="+aFriendId+"');");

  $('friendList').appendChild(item);
}

function parseFriends(aText) {
  var re = /<span>(.+?)<\/span>\s+<div\sid="[0-9]+"\sclass="memo_pop">/;
  var re2 = /<a\shref="show_friend.pl\?id=[0-9]+"\sstyle="background:\surl((.+?));/;
  names = aText.match(re);
  photos = aText.match(re2);
  while (names.length > 0) {
    var nameline = names.shift();
    var photoline = photos.shift();
    var name = re.exec(nameline)[1];
    var _photo = re2.exec(photoline);
    var friendid = _photo[1];
    var photo = _photo[2];
    addFriend(friendid, name, photo);
  }
}

function loadFriends() {
  while($('friendList').childNodes.length > 0)
    $('friendList').removeChild($('friendList').lastChild);

  var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance (Ci.nsIXMLHttpRequest);
  xhr.open ('GET', 'http://mixi.jp/list_friend.pl', true);

  xhr.onreadystatechange = function (aEvent) {
    if (xhr.readyState == 4) {
      if (xhr.status != 200) {
        // dump (xhr.statusText);
        return;
      }
      parseFriends (xhr.responseText);
    }
  }
  xhr.send (null);
}

////////////////////////////////////////
// 友達の日記をアップデートする

function addDiary(aUrl, aTitle, aName) {
  var item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "listitem");
  item.setAttribute("label", aTitle+" ("+aName+")");
  item.setAttribute("value", aUrl);
  item.setAttribute("onclick", "openMixiUrl(event, '"+aUrl+"')");
  $('diaryList').appendChild(item);
}

function parseDiary(aText) {
  var re = /<a\sclass="new_link"\shref=(.+?)>(.+?)<\/a>\s\((.+?)\)/g;
  var re2 = /<a\sclass="new_link"\shref=(.+?)>(.+?)<\/a>\s\((.+?)\)/;
  var diaries = aText.match(re);
  while (diaries.length > 0) {
    var diaryline = diaries.shift();
    // dump(diaryline+"\n");
    var diary = re2.exec(diaryline);
    var url;
    if (diary[1].match("http"))
      url = unescape(diary[1].replace("view_diary.pl?url=", ""));
    else
      url = "http://mixi.jp/"+diary[1];
    var title = diary[2];
    var name = diary[3];
    addDiary(url, title, name);
  }
}

function loadDiary() {
  while($('diaryList').childNodes.length > 0)
    $('diaryList').removeChild($('diaryList').lastChild);

  var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance (Ci.nsIXMLHttpRequest);
  xhr.open ('GET', 'http://mixi.jp/new_friend_diary.pl', true);

  xhr.onreadystatechange = function (aEvent) {
    if (xhr.readyState == 4) {
      if (xhr.status != 200) {
        // dump (xhr.statusText);
        return;
      }
      parseDiary (xhr.responseText);
    }
  }
  xhr.send (null);
}

////////////////////////////////////////
// コミュニティーのトピックをアップデートする

function addTopic(aUrl, aTitle, aName, aEvent) {
  var item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "listitem");
  item.setAttribute("label", aTitle+" ("+aName+")");
  item.setAttribute("value", aUrl);
  if (aEvent)
    item.setAttribute("style", "color: #00A;");
  item.setAttribute("onclick", "openMixiUrl(event, '"+aUrl+"');");
  $('communityList').appendChild(item);
}

function parseCommunities(aText) {
  // dump (aText);
  var re = /<a\shref="view_(.+?)\.pl\?(.+?)"\sclass="new_link">(.+?)<\/a>\s\((.+?)\)/g;
  var re2 = /<a\shref="view_(.+?)\.pl\?(.+?)"\sclass="new_link">(.+?)<\/a>\s\((.+?)\)/;
  var topics = aText.match(re);
  while (topics.length > 0) {
    var topicline = topics.shift();
    // dump(topicline+"\n");
    var topic = re2.exec(topicline);
    var url = "http://mixi.jp/view_"+topic[1]+".pl?"+topic[2];
    var title = topic[3];
    var name = topic[4];
    addTopic(url, title, name, (topic[1] == "event"));
  }
}

function loadCommunities() {
  while($('communityList').childNodes.length > 0)
    $('communityList').removeChild($('communityList').lastChild);

  var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance (Ci.nsIXMLHttpRequest);
  xhr.open ('GET', 'http://mixi.jp/new_bbs.pl', true);

  xhr.onreadystatechange = function (aEvent) {
    if (xhr.readyState == 4) {
      if (xhr.status != 200) {
        // dump (xhr.statusText);
        return;
      }
      parseCommunities (xhr.responseText);
    }
  }
  xhr.send (null);
}
