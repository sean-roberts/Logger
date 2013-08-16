(function(){
    
    /* is the logging setup ready */
    var _ready = false,
    
    /* settings for posting logs to listeners */
    _settings = {
        listener : 'http://sean-roberts.com/'
    },
    
    /* get a console object to work with */
    _console = console || {},
    
    /* will hold the console.log function */
    _log,
    
    _time = function showDate(){
      var date = new Date(),
          str = date.toUTCString();
      return str;
    },
    
    _sendToLog = function(toSend){
        var l = toSend.length;
        
        for(var i = 0; i < l; i++){
            alert(toSend[i]);
        }
    },
    
    /* override the console functions with the posting to listener logic */
    _setupConsole = function(){
            
        /* I am assuming if there is a console there is a console.log */
        _log = _console.log;
        
        console.log = function(){
            var toLog = [],
                toPost = [],
                msg;
            while(arguments.length) {
                msg = [].shift.call(arguments);
                toLog.push(msg);
                toPost.push( '(' + _time() + ') ' + msg);
            }
            if(_log){
                _log.apply(console, toLog);
            }
            
            /* send the message to the log for posting */
            _sendToLog(toPost);
        }
        
        /* setup debug, asset, etc. other console functions */
    },
    
    _init = function(){
        if(!_ready){
            
            /* override console functions */
            _setupConsole();
            
            _ready = true;
        }
    };
    
    
   /* setup the global object for a way to change the settings */
   window.Logger = {
        
        /**
         * config is not how you change the settings but how you 
         * view what is in the settings
         */
        settings : {
            listener : _settings.listener
        },
        
        /** init is for manually calling the init with options
         * note: calling init is not needed but makes it possible to customize
         * the settings as well as change the settings at any point of Logger's use
         */
        init : function(options){
            
            if(options){
                _settings.listener = options.listener || _settings.listener;
            }
            
            /* init sets up the environment and overrides the needed funtions */
            _init();
        }
        
    };
    
    /* set up the environment for the first time */
    window.Logger.init();
    
})();
