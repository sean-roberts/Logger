<?php
    
    /*
     * @Author: Sean Roberts (sean-roberts.com | @DevelopSean)
     * @Date: 8/27/2013
     * @Summary : Processor.php is meant to be an endpoint for the Logger.js centralized console.log framework.
     *              It's role is to take in json post requests and send the to the log file specified below unless
     *              your current session is passed. Then we create a file based on that session name in the logs folder
     * /
    
    
    /* 
     * NOTE: security measures for insurring the origin of the post have not been implemented.
     * This is so because of two reasons:
     * 1. I wanted to keep this relatively easy to setup
     * 2. I did not want to make assumptions about the environment and start creating sessions and cookies all willy-nilly
     */
    
    
    // this is for easier toggling if the endpoint can be used
    // by default this is turned off until the developer is ready
    $loggingTurnedOn = false;
    
    
    //the destination for your logs to go
    define('LOGS_DIR', 'logs/');
    define('LOG_FILE', 'console.log');
    
    //check to see if a session is defined and make a file of it
    $session = '';
    
    // Processing the input
    
    
    if($loggingTurnedOn){
        
        //get the json input application/json style
        $input = file_get_contents('php://input');
        $logs = json_decode($input);
        $length = count($logs->logs);
        $toAppend = array($length);
        
        for($i = 0; $i < $length; $i++){
            $item = $logs->logs[$i];
            //echo print_r($item->me);
            $toAppend[$i] = $item->time . "\t" . $item->type . "\t" . $item->data;
        }
        
        //see if we need to update the session
        $session = $logs->session | '';
        
        //build the sting to append to the log
        //add a newline because implode only adds \n as glue which is bad if we append more than once 
        $writeToLog = implode("\n", $toAppend) . "\n";
    }
    
    function write_log($message, $logfile)
    {
        // Determine log file
        if ($logfile == '') {
            
            // checking if the constant for the log file is defined
            if (defined(DEFAULT_LOG) == TRUE) {
                $logfile = DEFAULT_LOG;
            } else {
                // the constant is not defined and there is no log file given as input
                error_log('No log file defined!', 0);
                return array(
                    status => false,
                    message => 'No log file defined!'
                );
            }
        }
        
        if (!is_dir(LOGS_DIR))
        {
            mkdir(LOGS_DIR, 0755, true);
        }
        
        // Append to the log file
        if ($fd = @fopen($logfile, "a")) {
            
            $result = fputs($fd, $message);
            
            fclose($fd);
            
            if ($result > 0){
                return array(
                    status => true
                );
            }
                
        } else {
            return array(
                status => false,
                message => 'Unable to open log ' . $logfile . '!'
            );
        }
    }
    
    //for easier toggling of whether or not the logging endpoint can be used
    if($loggingTurnedOn === true){
        //create session file and save to it if need be
        if(!empty($session)){
            //only allow alphanumeric_- characters
            write_log($writeToLog, LOGS_DIR . preg_replace("/[^A-Za-z0-9_\-]/", '', $session) . '.log');
        }else{
            write_log($writeToLog, LOGS_DIR . LOG_FILE);
        }
    }
    
    
