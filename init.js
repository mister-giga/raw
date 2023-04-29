window.getVideos = function (jtoken, itemsKey){
    return jtoken[itemsKey]
        .filter(x => x.continuationItemRenderer === undefined)
        .map(x => ({
            id: x.playlistVideoRenderer.videoId,
            thumbnail: x.playlistVideoRenderer.thumbnail.thumbnails.pop().url,
            title: x.playlistVideoRenderer.title.runs[0].text,
            length: parseInt(x.playlistVideoRenderer.lengthSeconds)
        }));
}

window.getContinuationToken = function (jtoken, itemsKey){
    return jtoken[itemsKey]?.pop()?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ?? null;
}

window.getPlaylistFromId = async function(id) {
    const playListUrl = `https://www.youtube.com/playlist?list=${id}`;
    const resp = await fetch(playListUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'PostmanRuntime/7.32.2'
        }
    });
    const html = await resp.text();

    const playlistVideoListRendererKeyName = "\"playlistVideoListRenderer\":";
    const startIndex = html.indexOf(playlistVideoListRendererKeyName);

    let level = 1;
    let isInString = false;
    let i = startIndex + playlistVideoListRendererKeyName.length + 1;
    
    for (; i < html.length && level > 0; i++)
    {
        const ch = html[i];
        if(i < 1){console.log(ch)}

        if (ch == '"' && html[i - 1] != '\\')
            isInString = !isInString;
        else if (isInString)
            continue;
        else if (ch == '{' || ch == '[')
            level++;
        else if (ch == '}' || ch == ']')
            level--;
    }
    const jsonText = html.substr(startIndex + playlistVideoListRendererKeyName.length, i - startIndex - playlistVideoListRendererKeyName.length);
    const jsonObj = JSON.parse(jsonText);

    const playlist = {
        id: jsonObj.playlistId,
        videos: window.getVideos(jsonObj, 'contents'),
        continuationToken: window.getContinuationToken(jsonObj,'contents')
    };

    return playlist;
    
}

window.getPlaylistMoreVideos = async function(continuationToken){
    const playListLoadMoreUrl = "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false";
            

    const requestObj = {
        context: {
            client: {
                clientName: "WEB",
                clientVersion: "2.20230414.01.00"
            }
        },
        continuation: continuationToken
    };

    const resp = await fetch(playListLoadMoreUrl, {
        method: 'POST',
        headers: {
            'User-Agent': 'PostmanRuntime/7.32.2'
        },
        body: JSON.stringify(requestObj)
    });
    let jsonObj = await resp.json();
    jsonObj = jsonObj.onResponseReceivedActions[0].appendContinuationItemsAction;
    return {
        id: jsonObj.targetId,
        videos: window.getVideos(jsonObj, 'continuationItems'),
        continuationToken: window.getContinuationToken(jsonObj,'continuationItems')
    };
    
}

// const f = (async () => {
//     const initialPlayList = await window.getPlaylistFromId("PLLGmt3bXA_93pvHgKm7dbEvW410pDFKKl");
//     const more = await window.getPlaylistMoreVideos(initialPlayList.continuationToken);
//     console.log(more);
// });
// f();
