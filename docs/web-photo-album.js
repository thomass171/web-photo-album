/**
 * JS related to web-photo-album.html
 */

// default values for development only
var host = "http://localhost:8009";
var user = "";
var gateway = "";

// imagename (incl suffix) is key, value is AlbumElement
// better without suffix?, because it might be other case and
// makes thumbnail matching hard. The AlbumElement contains the exact name.
// No, with suffix. Without suffix moves the case problem to a chapter definition.
// Not containing thumbnails. Also for thumbnail images contains real file name
var allImagesMap = new Map();
var loadResult = {};

var THUMBNAIL = 0;
var ALBUM = 1;
var FULLSCREEN = 2;

var ALBUM_IMAGE_STYLE = "";
var THUMBNAIL_SUFFIX = "_small";

var fullscreenImageId;
var latestAlbumViewScrollPos = 0;
var currentAlbum = null;

var albumDefinition = null;

var ALBUM_DEFINITION_FILE = "AlbumDefinition.json";

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

var map;

class AlbumElement {
    /**
     * fileName is always the 'real' name, even if a thumbnail exists.
     */
    constructor(fileName, thumbnailName) {
        console.log("Building AlbumElement with fileName '" + fileName + "' and thumbnailName '" + thumbnailName + "'");
        this.detailImageId = -1;
        this.thumbnailImageId = -1;
        this.fileName = fileName;
        this.thumbnailName = thumbnailName;
        this.date = null;
        this.time = null;
        this.width = null;
        this.height = null;
        this.dimension = null;
        this.localDateTime = null;
    }

    getHtmlFullImage() {
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

    getImageIdOfInitialLoad() {
        if (this.detailImageId != -1) {
            return this.detailImageId;
        }
        return this.thumbnailImageId;
    }

    /**
     * Heads up. Property dimension is a "WxH" string, not a dimension object
     */
    getThumbnailDimension() {
        if (this.detailImageId != -1) {
            // Calc thumbnail size
            return getDimension(this.dimension, THUMBNAIL);
        }
        // just use thumbnails original size. Hmm. Really?
        //console.log("using thumnail dimension ",this.dimension)
        //return {this.dimension;
        return getDimension(this.dimension, THUMBNAIL);
    }

    /**
     * Show preview into a 'scan' or 'album' destination (delegate to callback).
     * Loads a preview image if no image has been loaded before.
     * if the element has a thumbnail, prefer this. Otherwise load the full image.
     */
    showPreview(callback, callbackParameter) {
        var currentAE = this;
        console.log("showPreview thumbnailName=",this.thumbnailName);
        var imageId;
        var fileName;
        // Check, if an image has already been loaded
        if (this.thumbnailImageId != -1) {
            callback(this, this.thumbnailImageId, callbackParameter);
        }
        if (this.detailImageId != -1) {
            callback(this, this.detailImageId, callbackParameter);
        }
        if (this.thumbnailName != null) {
            this.thumbnailImageId = addImageSlot();
            imageId = this.thumbnailImageId ;
            fileName = this.thumbnailName;
        } else {
            this.detailImageId = addImageSlot();
            imageId = this.detailImageId ;
            fileName = this.fileName;
        }
        loader.loadImage(fileName, imageId, function(metadata) {
            // Assume that thumnail and real image have same meta data
            //console.log("metadata for " + currentAE.thumbnailName + "=", metadata,Object.keys(metadata));
            currentAE.localDateTime = metadata.localDateTime;
            currentAE.height = metadata.height;
            currentAE.width = metadata.width;
            currentAE.dimension = metadata.dimension;
            currentAE.latlng = metadata.latlng;
            callback(currentAE, imageId, callbackParameter);
            loadResult.loaded++;
            updateScanStatus();
        });
    }

    /**
     * Show image in full view. If only thumbnail exists, image needs to be loaded first.
     */
    fullView() {
        if (this.detailImageId == -1) {
            var currentAE = this;
            console.log("Loading full image",this.fileName);
            this.detailImageId = addImageSlot();
            loader.loadImage(this.fileName, this.detailImageId, function(metadata) {
                console.log("Loading full image callback");
                var dataurl = currentAE.getHtmlFullImage().src;
                fillFullView(dataurl, currentAE.isPortrait());
            });
        } else {
            var dataurl = this.getHtmlFullImage().src;
            fillFullView(dataurl, this.isPortrait());
        }
    }

    /**
     * Redundant to "fullView()"?
     */
    updateFullView() {
        // not sure about the best solution for having image completey on screen
        var fixSize = false;
        var dataurl = null;
        if (fixSize) {
            // currently not used
            var fullscreenDimension = getDimension(this.dimension, FULLSCREEN);

            dataurl = createDataUrlFromCanvas(fullscreenDimension.width, fullscreenDimension.height, ctx => {
                ctx.drawImage(this.getHtmlFullImage(), 0, 0, fullscreenDimension.width, fullscreenDimension.height);
            });
        } else {
            //console.log("albumElement.getHtmlFullImage()",albumElement.getHtmlFullImage())
            //dataurl = albumElement.getHtmlFullImage().src;
            this.fullView();
        }
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
    var base = dimensions[usecase][0].width;
    console.log("unknown dimension ", realDimension, ". Using base ", base);

    return { width: base, height: base * parts[1] / parts[0]};

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
    //console.log("Creating canvas", width, height)
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    // canvas (in Chrome?) has default size 300x150
    canvas.width = width;
    canvas.height = height;

    handler(ctx);
    // https://developer.mozilla.org/de/docs/Web/API/HTMLCanvasElement/toDataURL
    // If the height or width of the canvas is 0 or larger than the maximum canvas size, the string "data:," is returned.
    return canvas.toDataURL("image/jpeg", 1.0);
}

function isImage(filename) {
    return filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg");
}

/**
 * Add load preview image to the prepared load grid at the well defined
 * position(index;order of loading) for this album element.
 * Might be a thumbnail or full image.
 */
function scanPreviewLoaded(albumElement, destinationCellId, imageId/*index*/) {

    //var previewDimension = getDimension(albumElement.dimension, THUMBNAIL);
    var previewDimension = albumElement.getThumbnailDimension();
    //console.log("previewDimension for " + albumElement.thumbnailName + "=",previewDimension)
    // Show possibly resized image in preview element
    var dataurl = createDataUrlFromCanvas(previewDimension.width, previewDimension.height, ctx => {
        ctx.drawImage(document.getElementById(imageId)/*albumElement.getHtmlPreviewImage()*/, 0, 0, previewDimension.width, previewDimension.height);
        if (isUndefined(albumElement.localDateTime)) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(previewDimension.width-1, previewDimension.height-1);
            ctx.stroke();
        }
    });
    var htmlImage = createImage("");
    //$("#previewcell" + index).append(htmlImage.html);
    $(destinationCellId).append(htmlImage.html);
    $("#" + htmlImage.id).attr("src", dataurl);

    var tooltip = "" + albumElement.fileName + ": "+ albumElement.dimension;
    $("#" + htmlImage.id).attr('title', tooltip);
}

/**
 * Add an image to an album chapter.
 */
function addAlbumImage(albumElement, targetCell) {

    var htmlImage = createImage("max-width: 100%; height: auto");
    $("#" + targetCell).append(htmlImage.html);

    var callbackParameter = {};
    albumElement.showPreview(function(lae, imageId, para) {

        var albumDimension = getDimension(albumElement.dimension, ALBUM);
        //console.log("dimension=",dimension)
        // Show resized image in preview element
        var dataurl = createDataUrlFromCanvas(albumDimension.width, albumDimension.height, ctx => {
            ctx.drawImage(document.getElementById(imageId)/*albumElement.getHtmlPreviewImage()*/, 0, 0, albumDimension.width, albumDimension.height);
        });
        $("#" + htmlImage.id).attr("src", dataurl);
        $("#" + htmlImage.id).click(function() {
            switchView("fullview");
            albumElement.updateFullView();
        });

        var tooltip = "" + albumElement.fileName + ": "+ albumElement.dimension;
        $("#" + htmlImage.id).attr('title', tooltip);
    }, callbackParameter);
}

/**
 *
 */
function addScanFailure(image, index) {

    var content = "<div class=''>";
    content += "" + image.error;
    content += "</div>";

    //$("#loadpreview").append(content);
    $("#previewcell" + index).append(content);

    var tooltip = "" + image.fileName + ": "+ image.dimension;
    $("#previewcell" + index).attr('title', tooltip);

}

/**
 * Add a chapter of an album.
 */
function addChapter(chapter/*, imageObjectURL*/) {

    var chapterid = "chapter_" + getUniqueId() + "_i";
    //console.log("Adding chapter element " + chapter.label + " with id " + chapterid);
    var chapterGrid = buildW3Grid(chapter.elements.length, 3, "w3-row-padding w3-margin-top", "w3-col m4", chapterid);

    //var imageid = "image_" + getUniqueId();
    var content = "<div class='w3-bar-item'>";
    content += "<span class='w3-large'>" + chapter.label + "</span><br>" +
        "<span>";
    content += chapterGrid.html;
    content += "</span><br>" + "</div>";
    addListItem("chapterlist", content, "w3-bar");

    var idx = 0;
    chapter.elements.forEach(element => {
        var albumElement = allImagesMap.get(element.photo);
        // reset latlng might be needed for prepared album definition
        if (!isUndefined(element.lat)) {
            albumElement.latlng = new L.latLng(element.lat, element.lng);
        }
        addAlbumImage(albumElement, chapterid + idx);
        if (map != null && !isUndefined(albumElement.latlng)) {
            var marker = L.marker(albumElement.latlng).addTo(map);
        }
        idx++;
    });
}

/**
 *
 */

/**
 *
 */
function copyAlbumDefinition() {
    var text = JSON.stringify(albumDefinition);
    // Avoid 'DOMException: Document is not focused.' by waiting for clipboard write to finish
    navigator.clipboard.writeText(text).then(function(x) {
        alert("Copied album definition to clipboard");
    });
}

function switchView(view) {

    if (view == "fullview") {
        // comes from album view. Save current scroll position. Difficult to find
        // the scrolled element. Probably its the window.
        // latestAlbumViewScrollPos = $('#main').scrollTop();
        // latestAlbumViewScrollPos = document.body.scrollTop;
        // var p = $('body');
        // latestAlbumViewScrollPos = p.scrollTop();
        latestAlbumViewScrollPos = window.pageYOffset;
        console.log("latestAlbumViewScrollPos ",latestAlbumViewScrollPos);
    }

    //disable all views
    ['scanview', 'loadview', 'listview', 'albumview', 'fullview'].forEach(v => {
        $('#'+v).removeClass('w3-show');
        $('#'+v).addClass('w3-hide');
    });
    if (view == "albumview") {
         $('#albumview').removeClass('w3-hide');
         $('#albumview').addClass('w3-show');
         // return to previous scroll position
         window.scrollBy(0, latestAlbumViewScrollPos);
    }
    if (view == "loadview") {
         $('#loadview').removeClass('w3-hide');
         $('#loadview').addClass('w3-show');
    }
    if (view == "fullview") {
        $('#fullview').removeClass('w3-hide');
        $('#fullview').addClass('w3-show');
    }
    if (view == "scanview") {
        $('#scanview').removeClass('w3-hide');
        $('#scanview').addClass('w3-show');
    }
}

function fillFullView(dataurl, isPortrait) {
    $("#" + fullscreenImageId).remove();
    //<img id="img_full" style="max-width: 100%; height: auto"/>
    //var htmlImage = createImage("max-width: 100%; height: auto");
    var style = "max-width: 100%; height: auto";
    //if (albumElement.isPortrait()) {
    if (isPortrait) {
        style = "max-width: 50%; height: auto";
    }
    var htmlImage = createImage(style, "w3-image");
    fullscreenImageId = htmlImage.id;
    $("#fullscreenContainer").append(htmlImage.html);
    $("#" + fullscreenImageId).attr("src", dataurl);
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
    var options = {};
    options.map = $("#optMap").is(":checked");
    console.log("options", options);
    albumDefinition = buildAlbumDefinitionFromScanResult(options);
    showAlbumByDefinition(albumDefinition);
}

function buildAlbumDefinitionFromScanResult(options) {
    var albumDefinition = {};
    albumDefinition.title = loader.subdir;
    albumDefinition.chapter = [];

    console.log("Building album for " + allImagesMap.size + " images.")

    switchView("albumview");
    // key is date of photo, value is list of image names
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
        chapter.elements = [];
        imagesPerDayMap.get(key).forEach(v => {
            var element = {photo:v};
            var ae = allImagesMap.get(v);
            if (!isUndefined(ae.latlng)) {
                element.lat = ae.latlng.lat;
                element.lng = ae.latlng.lng;
            }
            chapter.elements.push(element);
        });
        //console.log("chapter imgages of "+key+":",chapter.images);
        albumDefinition.chapter.push(chapter);
    });

    if (options.map) {
        albumDefinition.map = {};
        var area = { north : -90, east : -90, south : 90, west : 90};
        allImagesMap.forEach((value, key) => {
            if (!isUndefined(value.latlng)) {
                var latlng = value.latlng;
                if (latlng.lat > area.north) area.north = latlng.lat;
                if (latlng.lat < area.south) area.south = latlng.lat;
                if (latlng.lng > area.east) area.east = latlng.lng;
                if (latlng.lng < area.west) area.west = latlng.lng;
            }
        });
        console.log("area",area);
        // TODO center calc is too simple
        area.center = new L.latLng((area.north + area.south) / 2, (area.east + area.west) / 2);
        console.log("center",area.center);
        albumDefinition.map.area = area;
        albumDefinition.map.height = "280px";
    }
    return albumDefinition;
}

function showAlbumByDefinition(albumDefinition) {
    $("#album_title").html(albumDefinition.title);

    if (!isUndefined(albumDefinition.map)) {
        setCss("map", "height", albumDefinition.map.height);
        var zoom = 13;
        map = L.map('map').setView(albumDefinition.map.area.center, zoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
    }

    albumDefinition.chapter.forEach(chapter => {
        addChapter(chapter);
    });
    currentAlbum = albumDefinition;
}

function updateScanStatus() {
    $("#scanstatus").html("(" + loadResult.loaded +  "/" + loadResult.totalToScan + ", " + loadResult.failed + " failed)");
}

function findThumbnailByBasename(thumbnails, basename) {
    var found = null;
    thumbnails.forEach(value => {
        //console.log(basename," ",value," ")
        if (StringUtils.substringBeforeLast(value, ".") == basename + THUMBNAIL_SUFFIX) {
            found = value;
        }
    });
    return found;
}

/**
 * init for web-photo-album.html
 */
function init() {
    var url = new URL(window.location.href);
    console.log("url=" + url);
    var hostparam = url.searchParams.get("host");
    if (hostparam != null) {
        host = hostparam;
        console.log("host="+host);
    }
    var userparam = url.searchParams.get("user");
    if (userparam != null) {
        user = userparam;
        console.log("user="+user);
    }
    var gatewayparam = url.searchParams.get("gateway");
    if (gatewayparam != null) {
        gateway = gatewayparam;
        console.log("gateway="+gateway);
    }

    initLoader(host, gateway);

    //webdavContent(host)

    loader.loadDir(function (arrayOfFileNames) {
        //console.log(data);
        console.log("" + arrayOfFileNames.length + " files found");

        // totalToScan is the total number of files found, not only images
        loadResult.totalToScan = arrayOfFileNames.length;
        loadResult.loaded = 0;
        loadResult.failed = 0;

        // optionally limit the number of files for better performance during development
        // arrayOfFileNames = arrayOfFileNames.slice(0,12)

        // step1: collect thumbnails
        var thumbnails = [];
        console.log("step 1");
        arrayOfFileNames.forEach(element => {
            if (isImage(element)) {
                //console.log("element ", element)
                var imageName = element;
                if (FilenameUtils.isThumbnail(imageName)) {
                    thumbnails.push(imageName);
                    //imageName = imageName.replace("_small", "");
                    //console.log("thumbnailName ", thumbnailName)
                }
            }
        });
        // step 2: build album elements by image names
        console.log("step 2");
        arrayOfFileNames.forEach(element => {
            if (isImage(element)) {
                //console.log("element ", element)
                var imageName = element;
                if (!FilenameUtils.isThumbnail(imageName)) {
                    var basename = StringUtils.substringBeforeLast(imageName, ".");
                    var thumbnailName = findThumbnailByBasename(thumbnails, basename);
                    console.log("Found thumbnail " + thumbnailName + " for " + imageName)
                    albumElement = new AlbumElement(imageName, thumbnailName);
                    allImagesMap.set(imageName, albumElement);
                }
            } else {
                console.log("Scan skipped file '"+ element + "' because its no image");
            }
        });
        // step 3: load previews and enter either scan view or album view
        // build grid like https://www.w3schools.com/w3css/w3css_grid.asp
        console.log("step3");
        if (arrayOfFileNames.includes(ALBUM_DEFINITION_FILE) && true) {
            switchView('albumview');
            console.log("album definition file found");
            // Load definition and prepare album before loading previews
            loader.loadText(ALBUM_DEFINITION_FILE, function(content) {
                console.log("Found",content);
                showAlbumByDefinition(JSON.parse(content));
            });
        } else {
            switchView('scanview');
            var scanGrid = buildW3Grid(allImagesMap.size, 6, "w3-row-padding w3-margin-top", "w3-col m2", "previewcell");
            $("#scanpreview").append(scanGrid.html);
            var index = 0;
            // make index reliable by using callbackParameter to avoid random order of images.
            allImagesMap.forEach((ae, key) => {
                 ae.showPreview(function(lae, imageId, para) {
                    scanPreviewLoaded(lae, "#previewcell" + para.idx, imageId);
                 },{idx:index++});
            });
        }
    });

    document.addEventListener('fullscreenchange', exitHandlerFullscreen);
    document.addEventListener('webkitfullscreenchange', exitHandlerFullscreen);
    document.addEventListener('mozfullscreenchange', exitHandlerFullscreen);
    document.addEventListener('MSFullscreenChange', exitHandlerFullscreen);
}

