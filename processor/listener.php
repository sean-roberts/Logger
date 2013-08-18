<!DOCTYPE html>
<html>
	<head>
		<title>Logger Listener</title>
		<script>
			//listen for messages comming from parent frame
			window.addEventListener('message', listen, false);
			
			//main function for listening and sending to processor
			function listen(event){
				
				//append data recieved to the body to see it
				appendToBody(event.data);
			}
			
			function appendToBody(text){
				var div = document.createElement('div');
				div.innerHTML = text;
				document.body.appendChild(div);
			}
		</script>
	</head>
</html>