;(function() {
    'use strict';

    /* is the logging setup ready */
    var _setupComplete = false, 

    /* has the type of communication been set */
    _comTypeSet = false, 
    
    _console = console || {}, 
    
    _log, 

    /* settings for posting logs to listeners */
    _settings = {
        processorUrl: '',
        proxyUrl: '',
        bufferLimit: 5
    }, 
    
    _init = function() {
        if (!_setupComplete) {
            
            _setupConsole();
            
            _setupComplete = true;
        }
    }, 
    _postUrl = function(){
        return _settings.processorUrl;
    },
    _time = function() {
        var date = new Date();
        return date.toUTCString();
    },

    /* override the console functions with the posting to listener logic */
    _setupConsole = function() {
        
        var LogItem = function(type, time, data){
            this.type = type;
            this.time = time;
            this.data = data;
        };
        
        /* we will try to console.log if we can */
        _log = _console.log;
        
        console.log = function() {
            var toLog = [],
            msg;
            
            while (arguments.length) {
                msg = [].shift.call(arguments);
                toLog.push(msg);
            }
            
            if (_log) {
                _log.apply(console, toLog);
            }
            
            _buffer.add(new LogItem('log', _time(), toLog.join(', ')));
        }

    /* TODO: setup debug, asset, etc. other console functions */
    }, 
    
    _buffer = (function() {
        
        var buffs = [[]];
        
        return {
            
            add: function(item) {
                var lastIndex = buffs.length - 1;
                
                if (buffs[lastIndex].length < _settings.bufferLimit) {
                    buffs[lastIndex].push(item);
                } else {
                    buffs.push([item]);
                    _buffer.flush();
                }
            },

            /* flush will send the data to the processor */
            flush: function() {
                var data = buffs.shift();
                _coms.send(data);
            }
        
        }
    
    }()), 
    
    _coms = (function() {

        /* TODO: it may be beneficial to use a Factory here  */
        var _send;
        
        if (!_comTypeSet) {

            /* TODO: handle allowing cross site logging with postMessage api */
           
            var xhr;
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {
                    try {
                        xhr = new XMLHttpRequest();
                    } catch (e) {
                        xhr = false;
                    }
                }
            }
            
            /* this function accesses the processor api directly */
                           
            _send = function(data) {

                /* if we can't make a request lets just take our ball and go home */
                if (!xhr) {
                    return false;
                };

                try {
                    
                    xhr.open("POST", _postUrl(), true);
                    xhr.setRequestHeader("Method", "POST " + _postUrl() + " HTTP/1.1");
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(data);
                    
                } catch(er) {
                    return false;
                }

                return true;
            };
            
            _comTypeSet = true;
        }
        
        
        return {
            send: function(data) {
                _send(JSON.stringify({ "logs" : data}));
            }
        };
    
    }());


    /**
    * Set up the environment for logger
    */
    _init();
    
    
    window.Logger = {
        
        settings: function(options) {
            
            if (options) {
                _settings.processorUrl = options.processorUrl || _settings.processorUrl;
                _settings.proxyUrl = options.proxyUrl || _settings.proxyUrl;
                
                /* since the options have changed we need to flag that our communication method needs to be rechecked */
                _comTypeSet = false;
            }
            
            return _settings;
        }
    
    };

})();
