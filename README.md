Logger
======

A centralized logging processor for js

But why?
--------

Let's say you are testing on many different devices and the only way to get some logs from it is to plug it into your computer and run the web app. Wash and repeat for every device that you are needed to test with. A good example is when you start using location api, what are your devices actually doing and are they providing the same kind of information? This is the type of situation that could be made better by being able to throw Logger.js on your site, specify the listener and processor files, and run the site on any device. Your logs will be in the location you specified on your Processor.php file.

It's safe to say this is geared towards the testing / development part of the software lifecycle.


A little setup needed..
--------

We need to do a little set up first, add the processor.php file and listener.php files onto your web server. Then, the Logger.js file will need to go on any page you wish to use these features with but it doesn't have to be the same domain as your server.

In the processor.php file you will need identify the file location and turn the $loggingTurnedOn flag on when you are ready to accept logs. 

If you are logging from a domain that is different than the domain that the processor.php file resides, you will need to set up your listener.php by popluating the allowedDomains array with the complete domain (with ports if they are different than the default).


How does it work?
--------

The idea is to override the console.log method to post the logs back to the processor.php. Which, in turn, will post to the specified log file. To help with perfomance, we send the buffered array of logs in groups at different points of the page cycle: the first group goes on window.load and the proceding logs will be set 1 second after a log was made and that pattern repeats each time a log is made.


If you have any ideas for making this better please let me know or fork it and show me. Thanks guys!
