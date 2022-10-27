
var loader = {};

function initLoader(host, gateway) {

    console.log("initLoader host=" + host);

    var isWebDav = StringUtils.contains(host, "webdav");

    if (isWebDav) {
        // needs a gateway
        loader.contentUrl = gateway + "/api/webdav/content?host=" + encodeURIComponent(host) + "&user=" + user;
        loader.imageUrl = gateway + "/api/webdav/image?host=" + encodeURIComponent(host) + "&user=" + user + "&name=";
        loader.textUrl = gateway + "/api/webdav/text?host=" + encodeURIComponent(host) + "&user=" + user + "&name=";
        console.log("webdav via proxy from " + loader.contentUrl );
        loader.subdir = "unknown";
    } else {
        loader.contentUrl = host;
        loader.imageUrl = host;
        loader.subdir = StringUtils.substringAfterLast(host, "/");
    }

    // Note: A typical web server will never return a file list like this
    loader.loadDir = function(directoryHandler) {
        console.log("scanContent from " + loader.contentUrl);

        fetch(loader.contentUrl, {
            method: 'GET'
            })
          .then(response => response.text())
          .then(text => {
            var data = text.split("\n");
            directoryHandler(data);
        });
    }

    loader.loadImage = function(imageName, imageId, imageLoadedHandler) {
       //console.log("loadImage ", imageName);

       fetch(loader.imageUrl + "/" + imageName, {
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
           // from https://stackoverflow.com/questions/27619555/image-onload-not-working-with-img-and-blob
           // same as 'img.onload()'?
           var img = document.getElementById(imageId);
           img.addEventListener('load', function () {
               console.log("image " + imageName + " loaded");
               var metadata = {};
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
                       metadata.localDateTime = LocalDateTime.parse(DateTimeOriginal);
                       //console.log("localDateTime=", albumElement.localDateTime);
                   }
                   //image.width = EXIF.getTag(this, "PixelXDimension");
                   //image.height = EXIF.getTag(this, "PixelYDimension");
                   metadata.height = img.height;
                   metadata.width = img.width;
                   metadata.dimension = "" + img.width + "x" + img.height;
                   //console.log("GPSLatitude:", GPSLatitude)
                   imageLoadedHandler(metadata, imageName, imageObjectURL);
               });
           });
           // actually load after registration of 'onload' listener
           //$("#" + albumElement.getImageIdOfInitialLoad()).attr("src", imageObjectURL);
           $("#" + imageId).attr("src", imageObjectURL);
       })
       .catch(error => {
           console.error('There has been a problem with your fetch operation:', error);
           //TODO replace registerImage
           var image = registerImage(imageName, false);
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

    // For text files, but no images etc.
    loader.loadText = function(fileName, fileLoadedHandler) {
        //console.log("loadFile ", fileName);

        fetch(loader.textUrl + "/" + fileName, {
            method: 'GET'
            })
        .then(response => {
            if (!response.ok) {
                var error = new Error('fetch failed:' + response.status);
                error.status = response.status;
                throw error;
            }
            return response.text();
        })
        .then(text => {
            fileLoadedHandler(text);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
    }
}