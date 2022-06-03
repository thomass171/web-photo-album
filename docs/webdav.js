/**
 *
 */

/**
   	var request = this._getRequest('PROPFIND', path, handler, context);
    	depth = depth || 0;
    	request.setRequestHeader('Depth', depth);
    	request.setRequestHeader('Content-type', 'text/xml; charset=UTF-8');

    	var xml =
    	request.send(xml);
 */
function webdavContent(url) {

    var propfind = '<?xml version="1.0" encoding="UTF-8" ?>' +
                       	'<D:propfind xmlns:D="DAV:">' +
                       	'<D:allprop />' +
                       	'</D:propfind>';
    var username = "xxx";
    var password = "";

    console.log("webdavContent from " + url)
    fetch(url, {
        method: 'PROPFIND',
        headers: new Headers({
            'Content-Type': 'text/xml; charset=utf-8',
            'Authorization': 'Basic ' + btoa(username + ":" + password)
        }),
          body: propfind
         })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      });
}

