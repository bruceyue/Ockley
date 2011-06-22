
window.log = function(){
  log.history = log.history || [];  
  log.history.push(arguments);
  arguments.callee = arguments.callee.caller;  
  if(this.console) console.log( Array.prototype.slice.call(arguments) );
};

(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a]||c})(window.console=window.console||{});

/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

function sfDateToJsDate(sfDateString) {

    log('sfDateToJsDate: got ' + sfDateString);

    if(!this.isoRegExp){
        var regex = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
        this.isoRegExp = new RegExp(regex);
    }

    var result = null;
    var match = this.isoRegExp.exec(sfDateString);
    if (match == null){
        log('sfDateToJsDate: no match');
    }
    else{

        //from MDC exec docs:
        //The returned array has the matched text as the first item,
        //and then one item for each capturing parenthesis that matched containing the text that was captured.

        //we only want the captured text so we don't need the first item
        match.shift();

        var year = 1970, month = 0, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0, offset = 0;

        if (match[0] != null){
            year = match[0];
            if (year < 100){
                year = 1970;
            }
            log('sfDateToJsDate: year=' + year);
        }

        if (match[2] != null){
            //months are 0 based
            month = match[2] - 1;
            log('sfDateToJsDate: month=' + month);
        }

        if (match[4] != null){
            day = match[4];
            log('sfDateToJsDate: day=' + day);
        }


        if (match[6] != null){
            hour = match[6];
            log('sfDateToJsDate: hour=' + hour);
        }

        if (match[7] != null){
            minute = match[7];
            log('sfDateToJsDate: min=' + minute);
        }

        if (match[9] != null){
            second = match[9];
            log('sfDateToJsDate: sec=' + second);
        }

        if(match[11] != null){
            millisecond = (match[11] * 1000);
            log('sfDateToJsDate: milli=' + millisecond);
        }

        //https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date
        result = new Date(year, month, day, hour, minute, second, millisecond);

        if (match[13] != null) {
            offset = (Number(match[15]) * 60) + Number(match[16]);
            offset *= ((match[14] == '-') ? 1 : -1);
        }
        offset -= result.getTimezoneOffset();
        result.setTime((result.getTime() + (offset * 60000)));

    }
    return result;
}
