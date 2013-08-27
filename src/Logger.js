
/**
 * @Author: Sean Roberts (sean-roberts.com | @DevelopSean)
 * @Date: 8/19/2013
 * @Summary: Logger.js is a centralized framework to override the default console.log method 
 * 			(soon to be all console methods) to not only write to the web console, but to then send 
 * 			the logs to the Processor.php endpoint which will then parse and write the log to the specified 
 * 			log file location.
 */

;(function() {
    'use strict';
    
    var _docReady = false,
    
    /* id for the setTimeout to flush the buffer */
    _flushTimer,
    
    /* is the logging setup ready */
    _setupComplete = false, 

    /* has the type of communication been set 
     * set to false  whenever the urls in settings are changed */
    _comTypeSet = true, 
    
    /* is the iframe ready to communicate via postMessage comm */
    _listenerReady = false,
    
    /* the session name as defined by user but used by server to 
     * allow logging for multiple users to a single listener */
    _sessions = [],
    
    /* the logs buffer */
    _buffer,
    
    /* the set communications, this is reevaluated after changing any urls */
    _comms,
    
    _console = console || {}, 
    
    _log, 

    /* settings for posting logs to listeners */
    _settings = {
        /* user given */
        processorUrl: '',
        listenerUrl: '',
        
        /* buffer limit needs to be greater than 0 */
        bufferLimit: 50
    }, 
    
    /* set the environment up, override the console methods, etc. */
    _init = function() {
    	
    	/* set up initial event to flush the buffer */
	    if (document.readyState === "complete") { 
	        /* signify the window has been loaded even though we can't capture preceding logs */
	        _windowLoaded(); 
	    }else{
	        /* add event listener to flush buffer when the document loads */
	        
	        if (window.addEventListener) {
	            window.addEventListener("load", _windowLoaded, false);
	        } else if (window.attachEvent) {
	            window.attachEvent("onload", _windowLoaded);
	        } else {
	            document.addEventListener("load",  _windowLoaded, false);
	        }
	    }
    	
        if (!_setupComplete) {
            _setupConsole();
            _setupComplete = true;
        }
        
        _buffer = new Buffer();
    },
    
    
    /* ajax request directly to the processor api */
    XHRComm = function(){
        
        var xhr;
        if(XMLHttpRequest){
            xhr = new XMLHttpRequest();
        }else{
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {
                    xhr = false;
                }
            }
        }
        
        return {
            
            send : function(buffer){
                /* if we can't make a request lets just take our ball and go home */
                if (!xhr) {
                    return false;
                };
                var data;
                while(buffer.length > 0){
                    
                    data = buffer.shift();
                    
                    if(data.length > 0){
                        try {
                            xhr.open("POST", _settings.processorUrl, true);
                            xhr.setRequestHeader("Method", "POST " + _settings.processorUrl + " HTTP/1.1");
                            xhr.setRequestHeader("Content-Type", "application/json");
                            xhr.send(JSON.stringify({ 
                                                        "logs" : data, 
                                                        "session" : Logger.session.currentContext()  
                                                    }));
                        } catch(er) {
                            return false;
                        }
                    }
                }
                return true;
            }
        }
    },
    
    /* contentWindow.postMessage api to communicate with a listner who then communicates with the processor*/
    PostMessageComm = function(listenerOrigin){
        
        var iframe = document.createElement('iframe');
        iframe.src = _settings.listenerUrl;
        /* we will have the contentWindow after load happens so make it go back through the cycle onload triggered */
        iframe.onload = _listenerLoaded;
        iframe.style.height = '0';
        iframe.style.width = '0';
        iframe.style.display = 'none';
        
        document.body.appendChild(iframe);
            
        var listener = iframe.contentWindow;
        
        return {
            send : function(buffer){
            	
                /* nothing gets removed from the buffer or sent if the contentWindow is available */
                var data;
                if(listener && _listenerReady){
                    while(buffer.length > 0){
                        data = buffer.shift();
                        if(data.length > 0){
                            /* if the Logger and processor are on 2 different domains, the domains should be absolute, 
                             * making it safe to assume we can pass that to the listener */
                            listener.postMessage(JSON.stringify({ 
                                                                    "logs" : data, 
                                                                    "processorUrl" : _settings.processorUrl,
                                                                    "session" : Logger.session.currentContext() 
                                                                }), listenerOrigin);
                        }
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
            listenerOrigin = listenerOriginPaths[0] + '//' + listenerOriginPaths[2];
        
        return {
            create : function(){
                /* check to see if this host is the same as the processor host */
                if(loggerHost !== processorHost){
                    /* communicate with processor via postMessage if the two domains are different */
                    return new PostMessageComm(listenerOrigin);
                }else{
                    /* since domains are the same we can assume that ajax posts are allowed*/
                    return new XHRComm();
                }
            }
        };
    },
    
    _listenerLoaded = function(){
        _listenerReady = true;
        _buffer.flush();
    },
    
    _windowLoaded = function(){
        _docReady = true;
    	_buffer.flush();
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
        };

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
            	
                /* make sure we have a buffer array after the flush happens*/
                if(buffs.length === 0){
                    buffs.push([]);
                }
                
                var lastIndex = buffs.length - 1;
                
                /* send flush the buffer if we reach the limit */
                if (buffs[lastIndex].length < _settings.bufferLimit - 1) {
                    buffs[lastIndex].push(item);
                } else {
                    buffs[lastIndex].push(item);
                    
                    /* add an empty array to keep buffer going */
                    buffs.push([]);
                }
                
                /* timing for post backs 
                 * we have an event handler for when the dom content loads, we will flush the buffer
                 * after that, we will set a second interval if something is added to the buffer before we flush*/
                if(_docReady && typeof _flushTimer !== "number"){
                    _flushTimer = window.setTimeout(_buffer.flush, 1000);
                }
                
            },

            /* flush will send the data to the processor */
            flush: function() {
                
        		/* especially for postMessage comm, dont start sending data unless you need to*/
                if(buffs.length > 0 && buffs[0].length === 0){
                	return;
                }
                
                /* we shouldnt need to set up comms until we start logging */
                if(!_comms || !_comTypeSet){
                    _comms = new Communications();  
                }
                _comms.send(buffs);
                
                /* reset the timer */
                if(_flushTimer){
                    window.clearTimeout(_flushTimer);
                    _flushTimer = null;
                }
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
            
            /* return an immutable set of setting values 
             * so the only way to change settings is through the constructor
             * this will allow us to keep track of the changes taking place */
            return {
                processorUrl : _settings.processorUrl.toString(),
                listenerUrl : _settings.listenerUrl.toString(),
                bufferLimit : _settings.bufferLimit.toString()
            };
        },
        
        session : {
            
            open : function(sessionName){
                if(typeof sessionName === 'string'){
                    var l = _sessions.length,
                        isUnique = true;
                    for(var i = 0; i < l; i++){
                        if(_sessions[i] === sessionName){
                            isUnique = false;
                            break;
                        }
                    }
                    if(isUnique){
                        _sessions.push(sessionName);
                    }
                }
            },
            
            end : function(){
                /* remove the current session */
                _sessions.pop();
                /* todo: allow removal of specific sessions */
            },
            
            currentContext : function(){
                return _sessions[_sessions.length - 1];
            },
            
            currentOpenSessions : function (){
                return _sessions.join(', ').toString();
            }
                
        }
    
    };

})();
