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

window.getPlaylistFromId = async function(id) {
    const playListUrl = `https://www.youtube.com/playlist?list=${id}`;
    const resp = await fetch(playListUrl);
    const html = await resp.text();

    const playlistVideoListRendererKeyName = "\"playlistVideoListRenderer\":";
    const startIndex = html.indexOf(playlistVideoListRendererKeyName);

    let level = 1;
    let isInString = false;
    let i = startIndex + playlistVideoListRendererKeyName.length + 1;
    
    console.log(playlistVideoListRendererKeyName, html.length, startIndex, i);
    
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
        videos: window.getVideos(jsonObj, 'contents')
    };

    return playlist;
    
}
// window.getPlaylistFromId("PLLGmt3bXA_93pvHgKm7dbEvW410pDFKKl");
