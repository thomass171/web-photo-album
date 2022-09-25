
var loader = {};

function initLoader(host, gateway) {

    console.log("initLoader host=" + host);

    var isWebDav = StringUtils.contains(host, "webdav");

    if (isWebDav) {
        // needs a gateway
        loader.contentUrl = gateway + "/api/webdav/content?host=" + encodeURIComponent(host) + "&user=" + user;
        loader.imageUrl = gateway + "/api/webdav/image?host=" + encodeURIComponent(host) + "&user=" + user + "&name=";
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
    loader.loadImage = function(imageName, imageHandler) {
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
}