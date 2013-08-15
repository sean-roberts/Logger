Logger
======

A centralized logging processor for js 



The idea is to have a processor (listener.php) accept a post of log files and write them to log files (logs/). 

The post will come from a Logger.js file that takes over the console.log method.

The listener is really just an api endpoint for accepting the logs.
