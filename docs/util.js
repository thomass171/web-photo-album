
var uniqueid = 1;

function getUniqueId() {
    return uniqueid++;
}

var StringUtils = {
    substringAfterLast : function(str, sub) {
        var n = str.lastIndexOf(sub);
        if (n == -1) {
            return "";
        }
        str = str.substring(n + sub.length);
        return str;
    },
    substringBeforeLast : function(str, sub) {
        var n = str.lastIndexOf(sub);
        if (n == -1) {
            return "";
        }
        str = str.substring(0, n);
        return str;
    },
    contains : function(str, sub) {
        return str.indexOf( sub ) !== -1;
    }
}

var FilenameUtils = {
    basename : function(fname) {
        return StringUtils.substringBeforeLast(fname, ".");
    },
    isThumbnail : function(fname) {
        var basename = FilenameUtils.basename(fname);
        return basename.endsWith(THUMBNAIL_SUFFIX);
    }
}

class LocalDateTime {
    constructor(d) {
        if (d == null) {
            d = new Date();
            // date uses UTC
            //d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        }

        this.date = d;
    }

    plusMinutes(minutes) {
        return new LocalDateTime(new Date(this.date.getTime() + minutes * 60000));
    }

    plusHours(hours) {
        return new LocalDateTime(new Date(this.date.getTime() + hours * 60 * 60000));
    }

    plusDays(days) {
        return new LocalDateTime(new Date(this.date.getTime() + days * 24 * 60 * 60000));
    }

    //with or without 'T'? currently with. toISOString() always returns UTC.
    toString() {
        return this.toISOLocal();
        var s = this.date.toISOString();
        //console.log("toString:", s);
        s = StringUtils.substringBeforeLast(s, ".");
        //console.log("toString:", s);
        return s;
    }

    toISOLocal() {
        var d = this.date;
        var z = n => ('0' + n).slice(-2);

        return d.getFullYear() + '-'
            + z(d.getMonth() + 1) + '-' +
            z(d.getDate()) + 'T' +
            z(d.getHours()) + ':' +
            z(d.getMinutes()) + ':' +
            z(d.getSeconds());
    }

    //eg. "15.08.2020"
    getUserDate() {
        var d = this.date;
        var z = n => ('0' + n).slice(-2);

        return z(d.getDate()) + '.' +
            z(d.getMonth() + 1) + '.' +
            d.getFullYear();
    }

    // return format YYYY-MM-DD
    getDateString() {
        return this.toString().substring(0, 10);
    }

    getTimeString() {
        return this.toString().substring(11);
    }

    isBefore(otherLocalDateTime) {
        return this.date.getTime() < otherLocalDateTime.date.getTime();
    }

    isAfter(otherLocalDateTime) {
        return this.date.getTime() > otherLocalDateTime.date.getTime();
    }

    getMinute() {
        return this.date.getMinutes();
    }

    getHour() {
        return this.date.getHours();
    }

    //time is HH:MM, no seconds
    atTime(time) {
        var day = this.toString().substr(0, 10);
        return LocalDateTime.parse(day + "T" + time + ":00");
    }

    /**
     * From https://stackoverflow.com/questions/24998624/day-name-from-date-in-js
     */
    getWeekday() {
        var locale = "de-DE";
        //var baseDate = new Date(Date.UTC(2017, 0, 2)); // just a Monday
        //var weekDays = [];
        //for(i = 0; i < 7; i++)
        //{
            return this.date.toLocaleDateString(locale, { weekday: 'long' });
            //baseDate.setDate(baseDate.getDate() + 1);
        //}
        //return weekDays;
    }

    static now() {
        return new LocalDateTime();
    }

    // parses with or without 'T'?
    // see https://stackoverflow.com/questions/33908299/javascript-parse-a-string-to-date-as-local-time-zone
    static parse(s) {
        //console.log("parsing >" + s + "<");
        var b = s.split(/\D/);
        if (b.length == 3) {
            b[3] = 0;
            b[4] = 0;
            b[5] = 0;
        }
        var d = new Date(b[0], b[1] - 1, b[2], b[3], b[4], b[5]);
        /*var d = new Date(Number(s.substring(0, 4)), Number(s.substring(5, 7))-1,
            Number(s.substring(8, 10)), Number(s.substring(11, 13)),
            Number(s.substring(14, 16)), Number(s.substring(17, 19)));*/
        //var d = new Date(Date.parse(s));
        //d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        //console.log("parsed " + s + " to ", d.toISOString());
        return new LocalDateTime(d);
    }

    // time is HH:MM, no seconds
    static todayAt(time) {
        return LocalDateTime.now().atTime(time);
    }

    // time is HH:MM, no seconds
    static tomorrowAt(time) {
        var date = LocalDateTime.now().plusDays(1);
        var day = date.toString().substr(0, 10);
        return LocalDateTime.parse(day + "T" + time + ":00");
    }
}

function createDiv(content, optclass = "") {
    var id = "div_" + getUniqueId();
    var html = '<div class=" ' + optclass + '" ';
    html += 'id="' + id + '" ';
    html += ">";
    html += content;
    html += '</div>';

    return {html: html, id: id};
}

function createClickableDiv(content, onclickCode, optclass = "") {
    var id = "div_" + getUniqueId();
    var html = '<div class=" ' + optclass + '" ';
    html += 'id="' + id + '" ';
    html += 'onclick="' + onclickCode + '" ';
    html += ">";
    html += content;
    html += '</div>';

    return {html: html, id: id};
}

function createTable(header, optclass = "") {
    var id = "table_" + getUniqueId();
    var bodyid = "body_" + getUniqueId();
    var html = '<table class=" ' + optclass + '" ';
    html += 'id="' + id + '" ';
    html += "><thead>";
    if (header != null) {
    }
    html += "</thead>";
    html += '<tbody id="' + bodyid + '">';
    html += '</tbody></table>';
    html += '</table>';

    return {html: html, id: id, bodyid: bodyid};
}

function addTableRow(bodyid, optclass) {
    //console.log("Adding row to body", bodyid);
    var row_id = "table_row_" + getUniqueId();
    var row = "<tr id='" + row_id + "' class=' " + optclass + " '>"
    row += "</tr>";
    $("#" + bodyid).append(row);
    return row_id;
}

function addTableCol(content,rowid, optclass) {

    var col_id = "table_col_" + getUniqueId();
    var col = "<td id='" + col_id + "' class=' " + optclass + " '>"
    col += content;
    col += "</td>";
    $("#" + rowid).append(col);
    return col_id;
}

function createSelectBoxForMapOrArray(mapOrArray, addEmpty, optclass = "") {
    var id = "sb_" + getUniqueId();
    var html = '<select class="' + optclass + '  "';
    html += 'id="' + id + '">';
    if (addEmpty) {
        html += '<option value=""></option>\n';
    }
    if (Array.isArray(mapOrArray)) {
        mapOrArray.forEach(value => {
            //console.log(`${key}: ${value}`);
            html += '<option value="' + value + '">' + value + '</option>\n';
        });
    } else {
        mapOrArray.forEach(function (value, key) {
            //console.log(`${key}: ${value}`);
            html += '<option value="' + key + '">' + value + '</option>\n';
        });
    }
    html += '</select>';
    return {html: html, id: id};
}

function createInput(optclass = "") {
    var id = "input_" + getUniqueId();
    var html = '<input class=" ' + optclass + '" ';
    html += 'id="' + id + '" ';
    html += ">";
    html += '</input>';

    //console.log(html);
    return {html: html, id: id};
}

function createCheckbox(optclass = "") {
    var id = "checkbox_" + getUniqueId();
    var html = '<input type="checkbox" class=" ' + optclass + '" ';
    html += 'id="' + id + '" ';
    html += ">";
    html += '</input>';
    return {html: html, id: id};
}

function createButton(content, optclass = "") {
    var id = "btn_" + getUniqueId();
    var html = '<button class=" ' + optclass + '" ';

    html += 'id="' + id + '" ';
    html += ">" + content;
    html += '</button>';

    // console.log(html);
    return {html: html, id: id};
}

function createImage(style, optclass = "") {
    var id = "image_" + getUniqueId();
    var html = '<img class=" ' + optclass + '" style=" ' + style + '"';
    html += 'id="' + id + '" ';
    html += ">";
    html += '</img>';
    // console.log(html);
    return {html: html, id: id};
}

function addImageSlot() {
    var imageid = "image_" + getUniqueId();
    var content = "<div class=''>";
    content += "<img id='" + imageid + "'/>";
    content += "</div>";
    $("#imagelist").append(content);
    return imageid;
}

function addListItem(listid, content, optclass) {
    var item_id = "list_item_" + getUniqueId();
    var item = "<li id='" + item_id + "' class=' " + optclass + " '>"
    item += content;
    item += "</li>";
    $("#" + listid).append(item);
    return item_id;
}

function isUndefined(o) {
    if (o === undefined) {
        return true;
    }
    if (o === null) {
        return true;
    }
    return false;
}

/**
 * Format is YYYY-MM-DD
 */
function date2JsDate(dateString) {
    var jsDate = new Date(dateString.substring(0,4),dateString.substring(5,7)-1,dateString.substring(8,10));
    console.log("jsDate=", key.substring(8,10));
    return jsDate;
}

/*function isImageWithThumbnail(fileName, arrayOfFileNames, thumbnail_suffix) {

    var basename = FilenameUtils.basename(fileName);
    var result = false;
    ['jpg', 'JPG'].forEach(v => {
        if (arrayOfFileNames.includes(basename + thumbnail_suffix + "." + v)) {
            result = true;
        }
    });
    return result;
}*/

function buildLatLngFromExif(GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef) {

    console.log("GPSLatitude",GPSLatitude)
    if (isUndefined(GPSLatitude)) {
        return null;
    }

    var latDegree = GPSLatitude[0].numerator;
    var latMinute = GPSLatitude[1].numerator;
    var latSecond = GPSLatitude[2].numerator;
    var latDirection = GPSLatitudeRef;
    var latFinal = convertDMSToDD(latDegree, latMinute, latSecond, latDirection);

    var lonDegree = GPSLongitude[0].numerator;
    var lonMinute = GPSLongitude[1].numerator;
    var lonSecond = GPSLongitude[2].numerator;
    var lonDirection = GPSLongitudeRef;
    var lonFinal = convertDMSToDD(lonDegree, lonMinute, lonSecond, lonDirection);
    var latlng = new L.latLng(latFinal, lonFinal);
    console.log("latlng",latlng)
    return latlng;
}

/**
 * From https://stackoverflow.com/questions/62380759/trying-to-use-exif-js-to-return-gps-coords-when-a-jpg-image-is-clicked
 */
function convertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = degrees + (minutes/60) + (seconds/360000);
    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    }
    return dd;
}

function setCss(id, property, value) {
    $("#"+id).css(property, value);
}