;(function() {
    'use strict';

    /* is the logging setup ready */
    var _setupComplete = false, 

    /* has the type of communication been set 
     * set to false  whenever the urls in settings are changed
     */
    _comTypeSet = true, 
    
    _buffer,
    
    _console = console || {}, 
    
    _log, 

    /* settings for posting logs to listeners */
    _settings = {
        /* user given */
        processorUrl: '',
        listenerUrl: '',
        
        /* buffer limit needs to be greater than 0 */
        bufferLimit: 5
    }, 
    
    /* set the environment up, override the console methods, etc. */
    _init = function() {
        if (!_setupComplete) {
            _setupConsole();
            _setupComplete = true;
        }
        
        _buffer = new Buffer();
    },
    
    
    /* ajax request directly to the processor api */
    XHRComm = function(){
    	
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
    	
    	return {
    		
    		send : function(data){
                /* if we can't make a request lets just take our ball and go home */
                if (!xhr) {
                    return false;
                };
                try {
                    xhr.open("POST", _settings.processorUrl, true);
                    xhr.setRequestHeader("Method", "POST " + _settings.processorUrl + " HTTP/1.1");
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(data);
                } catch(er) {
                    return false;
                }
                return true;
    		}
    	}
    },
    
    /* contentWindow.postMessage api to communicate with a listner who then communicates with the processor*/
    PostMessageComm = function(){
        
    	var iframe = document.createElement('iframe');
			iframe.src = _settings.listenerUrl;
			/* we will have the contentWindow after load happens so make it go back through the cycle onload triggered */
			iframe.onload = _buffer.flush;
			iframe.style.height = '100px';
			document.body.appendChild(iframe);
			listener = iframe.contentWindow;
		
    	return {
    		send : function(buffer){
    		    /* nothing gets removed from the buffer or sent if the contentWindow is available */
    		   debugger;
    		    if(listener){
    		        while(buffer.length > 0){
    		            listener.postMessage(JSON.stringify({ "logs" : buffer.shift()}), listenerOrigin);
    		        }
    		    }
    		}
		};
    },
    
    /* compare the domains and give a Comm object that is best suited */
    CommFactory = function(){
        
        var location = window.location,
            loggerHost = location.host,
            processorHost = _settings.processorUrl.split('/')[2],
            listenerOriginPaths = _settings.listenerUrl.split('/'),
            listenerOrigin = listenerOriginPaths[0] + '://' + listenerOriginPaths[2],
            listener;
        
        return {
            create : function(){
                
                /* check to see if this host is the same as the processor host */
                if(loggerHost !== processorHost){
                    /* communicate with processor via postMessage if the two domains are different */
                    return new PostMessageComm();
                }else{
                    /* since domains are the same we can assume that ajax posts are allowed*/
                    return new XHRComm();
                }
            }
        };
    },
    
    
    /* logging the time the log was made - as opposed to logging when the server got it */
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
    
    /* set up processor communications */
    Communications = function() {
    	
        var comm;
        
        /* we need to reevaluate the communications if the settings change */
        if (!_comTypeSet) {
			var factory = new CommFactory();
			comm = factory.create();
            _comTypeSet = true;
        }
        return {
            send: function(buffer) {
                comm.send(buffer);
            }
        };
    
    },
    
    /* buffer the transmissions as to keep the network traffic cleared and performance up */
    Buffer = function() {
        
        var buffs = [[]];
        
        return {
            
            add: function(item) {
                var lastIndex = buffs.length - 1;
                
                /* send flush the buffer if we reach the limit */
                if (buffs[lastIndex].length < _settings.bufferLimit - 1) {
                    buffs[lastIndex].push(item);
                } else {
                    buffs[lastIndex].push(item);
                    
                    _buffer.flush();
                    
                    /* add an empty array to keep buffer going */
                    buffs.push([]);
                }
            },

            /* flush will send the data to the processor */
            flush: function() {
                debugger;
                var Comms = new Communications();
                Coms.send(buffs);
            }
        }
    };


    /**
    * Set up the environment for logger
    */
    _init();
    
    
    window.Logger = {
        
        settings: function(options) {
            
            if (options) {
                
                /* we need to reevaluate the comms if urls change */
                if(options.processorUrl || options.listenerUrl){
                    _settings.processorUrl = options.processorUrl || _settings.processorUrl;
                    _settings.listenerUrl = options.listenerUrl || _settings.listenerUrl;
                        
                    _comTypeSet = false;
                }
                
                /* make sure we have at least a buffer limit of one */
                var bufferLimit = options.bufferLimit || _settings.bufferLimit;
                _settings.bufferLimit = bufferLimit <= 0 ? 1 : bufferLimit;
            }
            
            return _settings;
        }
    
    };

})();
