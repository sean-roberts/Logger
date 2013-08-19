<!DOCTYPE html>

<!-- 
	@Author: Sean Roberts (sean-roberts.com | @DevelopSean)
	@Date: 8/19/2013
	@Summary: Listener.php is really for the script to listen for the postMessage sent by the Logger.js
			  Once we get the message we post it to the Processor.php file. This method is only used if 
			  the Processor.php url given to Logger.js is different than the url that Logger.js is on.
			  Effectively allowing the centralized logging accross domains.
	-->


<html>
	<head>
		<title>Logger Listener</title>
		<script>
		
			/* these are the domains allowed to talk to the processor*/
			var allowedDomains = [
				''
			];
			
			
			//listen for messages comming from parent frame
			window.addEventListener('message', listen, false);

			//main function for listening and sending to processor
			function listen(event) {
				var allowedOrigin = false;
				for(i = 0; i < allowedDomains.length; i++){
					if(event.origin === allowedDomains[i]){
						allowedOrigin = true;
					}
				}
				
				if(allowedOrigin){
					var data = JSON.parse(event.data);
				
					/* TODO: report errors if requests fail */
					sendToProcessor(data.processorUrl, data);
				}
			}

			function sendToProcessor(processorUrl, data) {
				var xhr;
				if(XMLHttpRequest){
					xhr = new XMLHttpRequest();
				}else{
					try {
						xhr = new ActiveXObject('Msxml2.XMLHTTP');
					} catch (e) {
						try {
							xhr = new ActiveXObject('Microsoft.XMLHTTP');
						} catch (e) {
							xhr = false;
						}
					}
				}
				
				if (!xhr) {
					return false;
				};
				try {
					xhr.open('POST', processorUrl, true);
					xhr.setRequestHeader('Method', 'POST ' + processorUrl + ' HTTP/1.1');
					xhr.setRequestHeader('Content-Type', 'application/json');
					xhr.send(JSON.stringify(data));
				} catch(er) {
					return false;
				}
				return true;
			}
		</script>
	</head>
</html>