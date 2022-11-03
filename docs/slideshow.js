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
        return currentAlbum.chapter[0].elements[0].photo;
    }
    for (var cidx = 0; cidx < currentAlbum.chapter.length; cidx++) {
        var chapter = currentAlbum.chapter[cidx];
        let index = getIndexOfImage(lastImageName, chapter.elements);
        if (index >= 0) {
            // last image found
            if (index < chapter.elements.length - 1) {
                return chapter.elements[index+1].photo;
            }
            // step to next chapter
            if (cidx < currentAlbum.chapter.length - 1) {
                return currentAlbum.chapter[cidx+1].elements[0].photo;
            }
            // back to beginning
            return currentAlbum.chapter[0].elements[0].photo;
        }
    }
    console.log("next image not found for ", lastImageName);
}

function getIndexOfImage(imageName, elements) {
    for (var index = 0; index < elements.length; index++) {
        if (elements[index].photo == imageName) {
            return index;
        }
    }
    return -1;
}
