/**
 * JS related to photo-album.html
 */

var host = "http://localhost:8009";

// imagename (incl suffix) is key, value is AlbumElement
var allImagesMap = new Map();
var scanResult = {};

var THUMBNAIL = 0;
var ALBUM = 1;
var FULLSCREEN = 2;

var ALBUM_IMAGE_STYLE = "";

var fullscreenImageId;

// order of dimensions is 4:3, 3:4
var dimensions = [
    // thumbnail
    [{ width: 100, height: 75 },
    { width: 75, height: 100 }],
    // album
    [{ width: 300, height: 225 },
    { width: 225, height: 300 }],
    // fullscreen
    [{ width: 1024, height: 768 },
    { width: 768, height: 1024 }]
];

class AlbumElement {
    constructor(fileName, detailImageId) {
        this.detailImageId = detailImageId;
        this.fileName = fileName;
        this.date = null;
        this.time = null;
        this.width = null;
        this.height = null;
        this.dimension = null;
        this.localDateTime = null;
    }

    getHtmlImage() {
        return document.getElementById(this.detailImageId);
    }

    getDayGroup() {
        if (isUndefined(this.localDateTime)) {
            return "etc";
        } else {
            return this.localDateTime.getDateString();
        }
    }

    isPortrait() {
        return this.height > this.width;
    }
}

function getDimension(realDimension, usecase) {
    if (isUndefined(realDimension)) {
        console.log("no dimension");
        return { width: 5, height: 5 };
    }
    switch (realDimension) {
        // 4:3
        case "4032x3024":
        case "1024x768":
            return dimensions[usecase][0];
        // 3:4
        case "3024x4032":
        case "768x1024":
            return dimensions[usecase][1];
    }
    var parts = realDimension.split("x");
    if (parts[0] / parts[1] - 1.3333 < 0.0001) {
        return dimensions[usecase][0];
    }
    if (parts[1] / parts[0] - 1.3333 < 0.0001) {
        return dimensions[usecase][1];
    }
    console.log("unknown dimension ", realDimension);
    return { width: 100, height: 75 };

}

/**
 * Build appropriate number of "w3-row"
 */
function buildW3Grid(elementCount, cols, rowClasses, colClasses, cellIdPrefix) {

    var rows = ((elementCount - 1) / cols)
    rows = Math.trunc(rows + 1);
    //console.log("Building " + rows + " grid rows for " + elementCount + " elements ");

    var id = "w3_row_grid" + getUniqueId();
    var idx = 0;
    var html = "<div class='w3-container' id='" + id + "'>";
    for (var row = 0; row < rows; row++) {
        html += "<div class='" + rowClasses + "'>";
        for (var col = 0; col < cols; col++) {
            var cellid = cellIdPrefix + idx;
            html += "<div class='" + colClasses + "' id='" + cellid + "'>";
            //html += "aa"
            html += "</div>";
            idx++;
        }
        html += "</div>";
    }
    html += "</div>";
    return {html: html, id: id};
}

function createDataUrlFromCanvas(width, height, handler) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    // canvas (in Chrome?) has default size 300x150
    canvas.width = width;
    canvas.height = height;

    handler(ctx);
    // https://developer.mozilla.org/de/docs/Web/API/HTMLCanvasElement/toDataURL
    return canvas.toDataURL("image/jpeg", 1.0);
}

function isImage(filename) {
    return filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg");
}

function processLoadingImage(imageName, imageObjectURL) {
    //console.log("processLoadingImage ", imageName, imageObjectURL);

    var albumElement = registerImage(imageName);
    //var imageid = image.detailImageId;
    var img = albumElement.getHtmlImage();
    //image.img=img;

    // from https://stackoverflow.com/questions/27619555/image-onload-not-working-with-img-and-blob
    // same as 'img.onload()'?
    img.addEventListener('load', function () {
        console.log("image loaded");
        EXIF.getData(img, function() {
            var GPSLatitude = EXIF.getTag(this, "GPSLatitude");
            var DateTimeOriginal = EXIF.getTag(this, "DateTimeOriginal");
            //console.log("DateTimeOriginal:", DateTimeOriginal)
            if (DateTimeOriginal != null) {
                // According to the EXIF standard, the property is in ISO 8601 format but does not include
                // the timezone suffix and should be rendered in local time - that is, in the time zone in
                // which the photo was taken.
                //var parts = DateTimeOriginal.split(" ");
                //albumElement.date = parts[0].replace(/:/g, "-");
                //albumElement.time = parts[1];
                albumElement.localDateTime = LocalDateTime.parse(DateTimeOriginal);
                //console.log("localDateTime=", albumElement.localDateTime);
            }
            //image.width = EXIF.getTag(this, "PixelXDimension");
            //image.height = EXIF.getTag(this, "PixelYDimension");
            albumElement.height = img.height;
            albumElement.width = img.width;
            albumElement.dimension = "" + img.width + "x" + img.height;
            //console.log("GPSLatitude:", GPSLatitude)
            //console.log("dimension:", albumElement.dimension)

            addScanPreview(albumElement, scanResult.scanned);
            scanResult.scanned++;
            updateScanStatus();
        });
    });
    // actually load after registration of 'onload' listener
    $("#" + albumElement.detailImageId).attr("src", imageObjectURL);
}

/**
 *
 */
function addScanPreview(albumElement, index) {

    var previewDimension = getDimension(albumElement.dimension, THUMBNAIL);
    //console.log("dimension=",dimension)
    // Show resized image in preview element
    var dataurl = createDataUrlFromCanvas(previewDimension.width, previewDimension.height, ctx => {
        ctx.drawImage(albumElement.getHtmlImage(), 0, 0, previewDimension.width, previewDimension.height);
        if (isUndefined(albumElement.localDateTime)) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(previewDimension.width-1, previewDimension.height-1);
            ctx.stroke();
        }
    });
    var htmlImage = createImage("");
    $("#previewcell" + index).append(htmlImage.html);
    $("#" + htmlImage.id).attr("src", dataurl);

    var tooltip = "" + albumElement.fileName + ": "+ albumElement.dimension;
    $("#" + htmlImage.id).attr('title', tooltip);
}

/**
 * Add an image to an album chapter.
 */
function addAlbumImage(albumElement, targetCell) {

    var albumDimension = getDimension(albumElement.dimension, ALBUM);
    //console.log("dimension=",dimension)
    // Show resized image in preview element
    var dataurl = createDataUrlFromCanvas(albumDimension.width, albumDimension.height, ctx => {
        ctx.drawImage(albumElement.getHtmlImage(), 0, 0, albumDimension.width, albumDimension.height);
    });
    var htmlImage = createImage("max-width: 100%; height: auto");
    $("#" + targetCell).append(htmlImage.html);
    $("#" + htmlImage.id).attr("src", dataurl);
    $("#" + htmlImage.id).click(function() {
        switchView("fullview", albumElement.fileName);
    });

    var tooltip = "" + albumElement.fileName + ": "+ albumElement.dimension;
    $("#" + htmlImage.id).attr('title', tooltip);
}

/**
 *
 */
function addScanFailure(image, index) {

    var content = "<div class=''>";
    content += "" + image.error;
    content += "</div>";

    //$("#scanpreview").append(content);
    $("#previewcell" + index).append(content);

    var tooltip = "" + image.fileName + ": "+ image.dimension;
    $("#previewcell" + index).attr('title', tooltip);

}

/**
 * Also for failed images.
 * 1) Adds full image to detaillist
 * 2) adds image to global list
 */
function registerImage(imageName) {

    var imageid = "image_" + getUniqueId();
    var content = "<div class=''>";
    content += "<img id='" + imageid + "'/>";
    content += "</div>";
    $("#detaillist").append(content);
    var albumElement = new AlbumElement(imageName, imageid);
    allImagesMap.set(imageName, albumElement);
    return albumElement;
}

/**
 * Add a chapter of an album.
 */
function addChapter(chapter, imageObjectURL) {

    var chapterid = "chapter_" + getUniqueId() + "_i";
    //console.log("Adding chapter element " + chapter.label + " with id " + chapterid);
    var chapterGrid = buildW3Grid(chapter.images.length, 3, "w3-row-padding w3-margin-top", "w3-col m4", chapterid);

    //var imageid = "image_" + getUniqueId();
    var content = "<div class='w3-bar-item'>";
    content += "<span class='w3-large'>" + chapter.label + "</span><br>" +
        "<span>";
    content += chapterGrid.html;
    content += "</span><br>" + "</div>";
    addListItem("chapterlist", content, "w3-bar");

    var idx = 0;
    chapter.images.forEach(imageName => {
        var albumElement = allImagesMap.get(imageName);
        addAlbumImage(albumElement, chapterid + idx);
        idx++;
    });
}

/**
 *
 */
function loadImage(url, imageName, imageHandler) {
    //console.log("loadImage ", imageName);

    fetch(url + "/" + imageName, {
        method: 'GET'
        })
    .then(response => {
        if (!response.ok) {
            var error = new Error('fetch failed:' + response.status);
            error.status = response.status;
            throw error;
        }
        return response.blob();
      })
    .then(imageBlob => {
        // Then create a local URL for that image and print it
        const imageObjectURL = URL.createObjectURL(imageBlob);
        //console.log(imageObjectURL);
        processLoadingImage(imageName, imageObjectURL, imageHandler);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        var image = registerImage(imageName);
        image.error = error.status;
        var dataUrl = createDataUrlFromCanvas(100,100, ctx => {
            //console.log("Painting ",image.detailImageId, imageName)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(30-1, 20-1);
            ctx.stroke();
        });
        //$("#" + image.detailImageId).attr("src", dataUrl);
        addScanFailure(image, scanResult.scanned);
        scanResult.scanned++;
        scanResult.failed++;
        updateScanStatus();
    });
}

/**
 *
 */
function scanContent(url) {

    console.log("scanContent from " + url)
    switchView('scanview');
    fetch(url, {
        method: 'GET'
        })
      .then(response => response.text())
      .then(text => {
        data = text.split("\n");
        //console.log(data);
        //console.log(data[1]);
        scanResult.totalToScan = data.length;
        scanResult.scanned = 0;
        scanResult.failed = 0;
        scanResult.subdir = substringAfterLast(url, "/");
        // build grid like https://www.w3schools.com/w3css/w3css_grid.asp
        var scanGrid = buildW3Grid(data.length, 6, "w3-row-padding w3-margin-top", "w3-col m2", "previewcell");
        $("#scanpreview").append(scanGrid.html);
        // optionally limit the number of files for better performance during development
        //data = data.slice(0,72)
        data.forEach(element => { if (isImage(element)) {
            //loadImage(url, element, addScanPreview);
            loadImage(url, element);
            }
        });
      });
}


function switchView(view, imageName) {
    //console.log("switchView to ", view);
    ['scanview', 'detailview', 'listview', 'albumview', 'fullview'].forEach(v => {
        $('#'+v).removeClass('w3-show');
        $('#'+v).addClass('w3-hide');
    });
    if (view == "detailview") {
         $('#listview').removeClass('w3-show');
         $('#listview').addClass('w3-hide');
         $('#detailview').addClass('w3-show');
         $('#detailview').removeClass('w3-hide');

    }
    if (view == "albumview") {
         $('#albumview').removeClass('w3-hide');
         $('#albumview').addClass('w3-show');
    }
    if (view == "scanview") {
         $('#scanview').removeClass('w3-hide');
         $('#scanview').addClass('w3-show');
    }
    if (view == "fullview") {

        console.log("fullscreen for ", imageName)
        var albumElement = allImagesMap.get(imageName);

        // not sure about the best solution for having image completey on screen
        var fixSize = false;
        var dataurl = null;
        if (fixSize) {
            var fullscreenDimension = getDimension(albumElement.dimension, FULLSCREEN);

            dataurl = createDataUrlFromCanvas(fullscreenDimension.width, fullscreenDimension.height, ctx => {
                ctx.drawImage(albumElement.getHtmlImage(), 0, 0, fullscreenDimension.width, fullscreenDimension.height);
            });
        } else {
            console.log("albumElement.getHtmlImage()",albumElement.getHtmlImage())
            dataurl = albumElement.getHtmlImage().src;
        }
        //console.log("dataurl",dataurl);

        $("#" + fullscreenImageId).remove();
        //<img id="img_full" style="max-width: 100%; height: auto"/>
        //var htmlImage = createImage("max-width: 100%; height: auto");
        var style = "max-width: 100%; height: auto";
        if (albumElement.isPortrait()) {
            style = "max-width: 50%; height: auto";
        }
        var htmlImage = createImage(style, "w3-image");
        fullscreenImageId = htmlImage.id;
        $("#fullscreenContainer").append(htmlImage.html);
        $("#" + fullscreenImageId).attr("src", dataurl);

        $('#fullview').removeClass('w3-hide');
        $('#fullview').addClass('w3-show');
    }
}


/**
 * Not used currently because not sure about the effects. Not possible to modifiy DOM by jquery in fullscreen?
 * Let the user switch to full screen.
 * From https://www.w3schools.com/howto/howto_js_fullscreen.asp
 */
function openFullscreen() {
    $('#fullview').addClass('w3-show');
    $('#fullview').removeClass('w3-hide');
    var elem = document.getElementById("fullscreen");
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

/**
 * Not used as long as full screen is a user decision.
 */
function exitHandlerFullscreen() {
    console.log("Exiting fullscreen");
    //$("#" + fullscreenImageId).remove();
}  

function buildAlbum() {
    var albumDefinition = buildAlbumDefinitionFromScanResult();
    showAlbumByDefinition(albumDefinition);
}

function buildAlbumDefinitionFromScanResult() {
    var albumDefinition = {};
    albumDefinition.chapter = [];
    albumDefinition.title = scanResult.subdir;

    console.log("Building album for " + allImagesMap.size + " images.")

    switchView("albumview");
    var imagesPerDayMap = new Map();
    allImagesMap.forEach((value, key) => {
        var date = value.getDayGroup();
        //console.log("date=", date);
        if (imagesPerDayMap.get(date) == null) {
            imagesPerDayMap.set(date, [])
        }
        imagesPerDayMap.get(date).push(key);
    });
    //console.log("imagesPerDayMap=",imagesPerDayMap);

    var keys = Array.from(imagesPerDayMap.keys());
    keys.sort();
    //console.log("chapter keys=",keys);

    keys.forEach(key => {
        var chapter = {};
        if (key == "etc") {
            chapter.label = key;
        } else {
            //var jsDate = new Date(key.substring(0,4),key.substring(5,7)-1,key.substring(8,10));
            //console.log("jsDate=", key.substring(8,10));
            //chapter.label = jsDate.toLocaleDateString("de-DE", { weekday: 'long' });
            var ldt = LocalDateTime.parse(key);
            chapter.label = ldt.getWeekday();
            chapter.label += ", " + ldt.getUserDate();
        }
        // sort images in chapter by timestamp
        imagesPerDayMap.get(key).sort(function(a, b) {
            var at, bt;
            if ((at = allImagesMap.get(a).localDateTime) == null) {
                return -1;
            }
            if ((bt = allImagesMap.get(b).localDateTime) == null) {
                return 1;
            }
            return at.isBefore(bt) ? -1 : 1;
        });
        chapter.images = imagesPerDayMap.get(key);
        //console.log("chapter imgages of "+key+":",chapter.images);
        albumDefinition.chapter.push(chapter);
    });
    return albumDefinition;
}

function showAlbumByDefinition(albumDefinition) {
    $("#album_title").html(albumDefinition.title);
    albumDefinition.chapter.forEach(chapter => {
        addChapter(chapter);
    });
}

function updateScanStatus() {
    $("#scanstatus").html("(" + scanResult.scanned +  "/" + scanResult.totalToScan + ", " + scanResult.failed + " failed)");
}


/**
 * init for photo-album.html
 */
function init() {
    var url = new URL(window.location.href);
    console.log("url=" + url);
    var hostparam = url.searchParams.get("host");
    if (hostparam != null) {
        host = hostparam;
        $("#debuginfo").html("(host="+hostparam+")");
    }
    //$("#btn_save").prop("disabled", !mazeInEdit.dirty);
    //webdavContent(host)
    scanContent(host)

    switchView("scanview");

    document.addEventListener('fullscreenchange', exitHandlerFullscreen);
    document.addEventListener('webkitfullscreenchange', exitHandlerFullscreen);
    document.addEventListener('mozfullscreenchange', exitHandlerFullscreen);
    document.addEventListener('MSFullscreenChange', exitHandlerFullscreen);
}

