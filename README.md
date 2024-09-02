# web-photo-album
August 2024: This project is deprecated meanwhile because the latest nextcloud
photo app releases added features like a map. The show case server is no longer
running.

A simple photo album based on simple HTML/JS/CSS intended for use with Nextcloud via webdav.
No build is needed.

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

# Testing

There are no auto/unit tests, so manual testing is needed.

Prepare a directory containing images with and without thumbnails and without
an album definition file.

- Launch the app. "Scan" view should be opened and a preview for all images displayed.
- Check the subtitle for correct number of "albumelements/filesfound". 
- The number of album elements should match the number of preview images.
- Check tooltip on each image. Should show real filename and effective preview dimension.
- Press 'Build album'
- Check the grouping of images by date. Title will be "unknown".
- Check all images are shown
- Check tooltip on images. Should show real filename and effective preview dimension.
- Click an preview without thumbnail. Full view should show it immediatly
- Click an preview with thumbnail. Full view should show it after some loading time. Click again full view should show it immediatly
- Start slide show
- Copy album definition file to directory. Relaunch app.
