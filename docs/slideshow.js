var lastSlideImage = null;
var terminateSlideShow = false;

function startSlideShow() {
    switchView('fullview');
    terminateSlideShow = false;
    updateSlideShow();
}

function updateSlideShow() {
    if (!terminateSlideShow) {
        lastSlideImage = getNextImage(lastSlideImage);
        allImagesMap.get(lastSlideImage).updateFullView();
        setTimeout(updateSlideShow, 5000);
    }
}

function getNextImage(lastImageName) {
    if (lastImageName == null) {
        return currentAlbum.chapter[0].images[0];
    }
    for (var cidx = 0; cidx < currentAlbum.chapter.length; cidx++) {
        var chapter = currentAlbum.chapter[cidx];
        let index = chapter.images.indexOf(lastImageName);
        if (index >= 0) {
            // last image found
            if (index < chapter.images.length - 1) {
                return chapter.images[index+1];
            }
            // step to next chapter
            if (cidx < currentAlbum.chapter.length - 1) {
                return currentAlbum.chapter[cidx+1].images[0];
            }
            // back to beginning
            return currentAlbum.chapter[0].images[0];
        }
    }
    console.log("next image not found for ", lastImageName);
}
