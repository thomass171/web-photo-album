# web-photo-album
A simple photo album based on simple HTML/JS/CSS intended for use with Nextcloud via webdav.
No build is needed.

See https://thomass171.github.io/web-photo-album/web-photo-album.html for an working example. 
This example uses a free Nextcloud instance at hosting.de and a narrow bandwidth example of
a webdav gateway.

Since webdav server commonly do not set CORS header unfortunately,
a gateway server like https://github.com/thomass171/webdav-gateway is required.

# Usage

Three query parameter are needed:

* host: The Nextcloud webdav URL
* user: A (read only) link/share of a directory in that Nextcloud instance
* gateway: A webdav gateway. Heads up: The gateway can read all data transmitted! Be sure you can trust it.

On startup, the directory is checked for an album definition file ...If it exists, the album is displayed.

If it doesn't exist,
'scan mode' is entered which lists a thumbnail list of all images and provides a button for building an album.

The album definition file can be copied to the clipboard via ... and uploaded to Nextcloud as usual.

# Implementation details

# Full Screen

Full screen display of an image is implemented by means of HTML/CSS without special JS tricks. For really achieving full screen, the browsers additionally needs to be switched to full screen.
