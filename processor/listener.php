<!DOCTYPE html>
<html>
	<head>
		<title>Logger Listener</title>
		<script>
			
			// TODO: validate domain
		
			//listen for messages comming from parent frame
			window.addEventListener('message', listen, false);

			//main function for listening and sending to processor
			function listen(event) {
				var data = JSON.parse(event.data);
				
				/* TODO: report errors if requests fail */
				sendToProcessor(data.processorUrl, data);
			}

			function appendToBody(text) {
				var div = document.createElement('div');
				div.innerHTML = text;
				document.body.appendChild(div);
			}

			function sendToProcessor(processorUrl, data) {
				var xhr;
				if(XMLHttpRequest in window){
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
				
				if (!xhr) {
					return false;
				};
				try {
					xhr.open("POST", processorUrl, true);
					xhr.setRequestHeader("Method", "POST " + processorUrl + " HTTP/1.1");
					xhr.setRequestHeader("Content-Type", "application/json");
					xhr.send(JSON.stringify(data));
				} catch(er) {
					return false;
				}
				return true;
			}
		</script>
	</head>
</html>