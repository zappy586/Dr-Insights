// var outputDiv = document.getElementById("output");
// var inputDiv = document.getElementById("input");
var parentDiv = document.getElementById("epik")
var memory
var gpt_mem = []
const switchElement = document.getElementById('flexSwitchCheckDefault');
var endpoint_chat = "http://localhost:5000"
var endpoint_img = "http://localhost:5000/gpt_img"
switchElement.addEventListener('change', function() {
	const isSwitchOn = this.checked;
	console.log(`Toggle switch is ${isSwitchOn ? 'on' : 'off'}`);
	endpoint_chat = isSwitchOn ? 'http://localhost:5000/gpt' : "http://localhost:5000"
	// endpoint_img = isSwitchOn ? 'http://localhost:5000/gpt_img' : "http://localhost:5000/img"
});
function scrollDown() {
	window.scrollTo(0, 9999999999999);
  }
  document.getElementById('myForm').addEventListener('submit', function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Your custom logic or AJAX request can go here
    // For example, you can access form data using:
    var formData = new FormData(event.target);
    var query = formData.get('name');

    // Add your logic here
    console.log('Query submitted:', query);

    // Optionally, you can clear the input field after submission
    document.getElementById('nme').value = '';
});
function submitForm() {

	scrollDown()
	var outChars = ''
    var formData = new FormData(document.getElementById("myForm"));
    var fileInput = document.getElementById("fileInput");
    var file = fileInput.files[0];
    console.log(file)
    var inputDataValue = formData.get("name"); 
	memory += "{user: "+inputDataValue+"}"
	formData.append("memory" , memory)
    // if (file) {
    //     // Check the file type
    //     if (file.type.includes("image")) {
    //         // If it's an image, send to /image endpoint
    //         fetch('http://localhost:5000/img', {
    //             method: 'POST',
    //             body: formData
    //         })
    //         .then(handleResponse)
    //         .catch(handleError);
    //     } else if (file.type === "application/pdf") {
    //         // If it's a PDF, send to /pdf endpoint
    //         fetch('http://localhost:5000/pdf', {
    //             method: 'POST',
    //             body: formData
    //         })
    //         .then(handleResponse)
    //         .catch(handleError);
    //     } else {
    //         console.error('Unsupported file type');
    //     }
    // } else {
        var newInputDiv = document.createElement("div")
		var newOutputDiv = document.createElement("div")
		var spinner = document.createElement("img")
		var spinnerText = document.createElement("h1")
		var aiLogo = document.createElement("img")
		var userLogo = document.createElement("img")
		var outputText = document.createElement("div")
		var inputText = document.createElement("div")

		//input divs
		
		inputText.innerHTML=inputDataValue
		inputText.style.marginTop = "15px"
        newInputDiv.className = 'in'
        newInputDiv.style.display = 'flex';
		parentDiv.appendChild(newInputDiv)
		userLogo.src="user.svg"
		userLogo.className = "aiLogo"
		newInputDiv.appendChild(userLogo)
		newInputDiv.appendChild(inputText)

		//output divs

        newOutputDiv.className = "op"
		spinner.className = "spinner align-content-center"
        spinner.src = "loading3.gif"
		spinnerText.innerHTML = "Thinking..."
		spinnerText.className = "spinnerText"
		newOutputDiv.style.display = "grid"
		newOutputDiv.style.justifyContent = "center"
		newOutputDiv.style.alignContent = "center"
        newOutputDiv.appendChild(spinner)
		newOutputDiv.appendChild(spinnerText)
        parentDiv.appendChild(newOutputDiv)
		scrollDown()
        // If no file is selected, send to a generic endpoint
        fetch(endpoint_chat, {
            method: 'POST',
            body: formData
        })
        .then(
			(response) => {
				// var newOutputDiv = document.createElement("div")
				// newOutputDiv.className = "op"
				const reader = response.body.getReader();
				return new ReadableStream({
					start(controller) {
						function push() {
							reader.read().then(({ done, value }) => {
								if (done) {
									controller.close();
									
									return;
								}
								// newOutputDiv.style.display = 'block';
								const chars = new TextDecoder().decode(value);
								outChars += String(chars);
								outputText.innerHTML += chars;
								scrollDown()
								setTimeout(push, 0);
							});
						}
						push();
						memory+="{assistant: "+outChars+"}"
					}
				});
			
			}
		)
		.then(()=>{
			newOutputDiv.removeChild(spinner)
			newOutputDiv.removeChild(spinnerText)
			newOutputDiv.style.display = "flex"
			newOutputDiv.style.justifyContent = null
			newOutputDiv.style.alignContent = null
			parentDiv.appendChild(newOutputDiv)
			aiLogo.src = "ai-logo.svg"
			aiLogo.className = "aiLogo"
			outputText.className = "outputText"
			outputText.style.marginTop = "15px"
			newOutputDiv.appendChild(aiLogo)
			newOutputDiv.appendChild(outputText)
		}
			
		)
		.then(response => {
			// Extract the Matplotlib plot data from the response headers
			const imgBase64 = response.headers.get('Matplotlib-Plot');
			var plot = document.createElement("img")
			plot.id('plotContainer')
			newOutputDiv.appendChild(plot)
			// Update the HTML content to display the Matplotlib plot
			if (imgBase64) {
				plot.innerHTML = `<img src="data:image/png;base64,${imgBase64}" alt="Matplotlib Plot">`;
			}
			
			// Continue with your existing code for handling the GPT-3.5 Turbo model response
			return response.json();
		})
        .catch(handleError);
		document.getElementById("myForm").reset();
    
}



function handleError(error) {
    console.error('Error:', error);
    // Handle errors here
}

function uploadFile(){
	scrollDown()
    var newInputDiv = document.createElement("div")
	var newOutputDiv = document.createElement("div")
	var spinner = document.createElement("img")
	var spinnerText = document.createElement("h1")
	var aiLogo = document.createElement("img")
	var userLogo = document.createElement("img")
	var outputText = document.createElement("div")
	userLogo.src = "user.svg"
	userLogo.className = "aiLogo"
    newInputDiv.className = 'in'
    newInputDiv.style.display = 'flex';
    parentDiv.appendChild(newInputDiv)
	newInputDiv.appendChild(userLogo)
    var fileInputValue = document.getElementById('fileInput').files[0];
    var imgDiv = document.createElement("img")
	imgDiv.style.marginTop = "15px"
    imgDiv.className = 'img'
    imgDiv.src = URL.createObjectURL(fileInputValue)
    console.log(URL.createObjectURL(fileInputValue))
    newInputDiv.appendChild(imgDiv)
	newOutputDiv.className = "op"
	spinner.className = "spinner align-content-center"
	spinner.src = "loading3.gif"
	spinnerText.innerHTML = "Analyzing..."
	spinnerText.className = "spinnerText"
	newOutputDiv.style.display = "grid"
	newOutputDiv.style.justifyContent = "center"
	newOutputDiv.style.alignContent = "center"
	newOutputDiv.appendChild(spinner)
	newOutputDiv.appendChild(spinnerText)
	parentDiv.appendChild(newOutputDiv)
	scrollDown()
    var formData = new FormData();
    formData.append('fileInput', fileInputValue);
    fetch(endpoint_img, {
        method: 'POST',
        body: formData
    })
	.then(
		(response) => {
			// var newOutputDiv = document.createElement("div")
			// newOutputDiv.className = "op"
			const reader = response.body.getReader();
			return new ReadableStream({
				start(controller) {
					function push() {
						reader.read().then(({ done, value }) => {
							if (done) {
								controller.close();
								
								return;
							}
							// newOutputDiv.style.display = 'block';
							const chars = new TextDecoder().decode(value);
							outputText.innerHTML += chars;
							scrollDown()
							setTimeout(push, 0);
						});
					}
					push();
				}
			});
		}
	)
	.then(()=>{
		newOutputDiv.removeChild(spinner)
		newOutputDiv.removeChild(spinnerText)
		newOutputDiv.style.display = "flex"
		newOutputDiv.style.justifyContent = null
		newOutputDiv.style.alignContent = null
		parentDiv.appendChild(newOutputDiv)
		aiLogo.src = "ai-logo.svg"
		aiLogo.className = "aiLogo"
		outputText.className = "outputText"
		outputText.style.marginTop = "15px"
		newOutputDiv.appendChild(aiLogo)
		newOutputDiv.appendChild(outputText)
	}
		
	)
	.catch(handleError);
	document.getElementById("myForm2").reset();
}

(function($){
	var canvas = $('#bg').children('canvas'),
		background = canvas[0],
		foreground1 = canvas[1],
		foreground2 = canvas[2],
		config = {
			circle: {
				amount: 18,
				layer: 3,
				color: [157, 97, 207],
				alpha: 0.3
			},
			line: {
				amount: 12,
				layer: 3,
				color: [255, 255, 255],
				alpha: 0.3
			},
			speed: 0.5,
			angle: 20
		};

	if (background.getContext){
		var bctx = background.getContext('2d'),
			fctx1 = foreground1.getContext('2d'),
			fctx2 = foreground2.getContext('2d'),
			M = window.Math, // Cached Math
			degree = config.angle/360*M.PI*2,
			circles = [],
			lines = [],
			wWidth, wHeight, timer;
		
		requestAnimationFrame = window.requestAnimationFrame || 
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			function(callback, element) { setTimeout(callback, 1000 / 60); };

		cancelAnimationFrame = window.cancelAnimationFrame ||
			window.mozCancelAnimationFrame ||
			window.webkitCancelAnimationFrame ||
			window.msCancelAnimationFrame ||
			window.oCancelAnimationFrame ||
			clearTimeout;

		var setCanvasHeight = function(){
			wWidth = $(window).width();
			wHeight = $(window).height(),

			canvas.each(function(){
				this.width = wWidth;
				this.height = wHeight;
			});
		};

		var drawCircle = function(x, y, radius, color, alpha){
			var gradient = fctx1.createRadialGradient(x, y, radius, x, y, 0);
			gradient.addColorStop(0, 'rgba('+color[0]+','+color[1]+','+color[2]+','+alpha+')');
			gradient.addColorStop(1, 'rgba('+color[0]+','+color[1]+','+color[2]+','+(alpha-0.1)+')');

			fctx1.beginPath();
			fctx1.arc(x, y, radius, 0, M.PI*2, true);
			fctx1.fillStyle = gradient;
			fctx1.fill();
		};

		var drawLine = function(x, y, width, color, alpha){
			var endX = x+M.sin(degree)*width,
				endY = y-M.cos(degree)*width,
				gradient = fctx2.createLinearGradient(x, y, endX, endY);
			gradient.addColorStop(0, 'rgba('+color[0]+','+color[1]+','+color[2]+','+alpha+')');
			gradient.addColorStop(1, 'rgba('+color[0]+','+color[1]+','+color[2]+','+(alpha-0.1)+')');

			fctx2.beginPath();
			fctx2.moveTo(x, y);
			fctx2.lineTo(endX, endY);
			fctx2.lineWidth = 3;
			fctx2.lineCap = 'round';
			fctx2.strokeStyle = gradient;
			fctx2.stroke();
		};

		var drawBack = function(){
			bctx.clearRect(0, 0, wWidth, wHeight);

			var gradient = [];
			
			gradient[0] = bctx.createRadialGradient(wWidth*0.3, wHeight*0.1, 0, wWidth*0.3, wHeight*0.1, wWidth*0.9);
			gradient[0].addColorStop(0, 'rgb(0, 26, 77)');
			gradient[0].addColorStop(1, 'transparent');

			bctx.translate(wWidth, 0);
			bctx.scale(-1,1);
			bctx.beginPath();
			bctx.fillStyle = gradient[0];
			bctx.fillRect(0, 0, wWidth, wHeight);

			gradient[1] = bctx.createRadialGradient(wWidth*0.1, wHeight*0.1, 0, wWidth*0.3, wHeight*0.1, wWidth);
			gradient[1].addColorStop(0, 'rgb(0, 150, 240)');
			gradient[1].addColorStop(0.8, 'transparent');

			bctx.translate(wWidth, 0);
			bctx.scale(-1,1);
			bctx.beginPath();
			bctx.fillStyle = gradient[1];
			bctx.fillRect(0, 0, wWidth, wHeight);

			gradient[2] = bctx.createRadialGradient(wWidth*0.1, wHeight*0.5, 0, wWidth*0.1, wHeight*0.5, wWidth*0.5);
			gradient[2].addColorStop(0, 'rgb(40, 20, 105)');
			gradient[2].addColorStop(1, 'transparent');

			bctx.beginPath();
			bctx.fillStyle = gradient[2];
			bctx.fillRect(0, 0, wWidth, wHeight);
		};

		var animate = function(){
			var sin = M.sin(degree),
				cos = M.cos(degree);

			if (config.circle.amount > 0 && config.circle.layer > 0){
				fctx1.clearRect(0, 0, wWidth, wHeight);
				for (var i=0, len = circles.length; i<len; i++){
					var item = circles[i],
						x = item.x,
						y = item.y,
						radius = item.radius,
						speed = item.speed;

					if (x > wWidth + radius){
						x = -radius;
					} else if (x < -radius){
						x = wWidth + radius
					} else {
						x += sin*speed;
					}

					if (y > wHeight + radius){
						y = -radius;
					} else if (y < -radius){
						y = wHeight + radius;
					} else {
						y -= cos*speed;
					}

					item.x = x;
					item.y = y;
					drawCircle(x, y, radius, item.color, item.alpha);
				}
			}

			if (config.line.amount > 0 && config.line.layer > 0){
				fctx2.clearRect(0, 0, wWidth, wHeight);
				for (var j=0, len = lines.length; j<len; j++){
					var item = lines[j],
						x = item.x,
						y = item.y,
						width = item.width,
						speed = item.speed;

					if (x > wWidth + width * sin){
						x = -width * sin;
					} else if (x < -width * sin){
						x = wWidth + width * sin;
					} else {
						x += sin*speed;
					}

					if (y > wHeight + width * cos){
						y = -width * cos;
					} else if (y < -width * cos){
						y = wHeight + width * cos;
					} else {
						y -= cos*speed;
					}
					
					item.x = x;
					item.y = y;
					drawLine(x, y, width, item.color, item.alpha);
				}
			}

			timer = requestAnimationFrame(animate);
		};

		var createItem = function(){
			circles = [];
			lines = [];

			if (config.circle.amount > 0 && config.circle.layer > 0){
				for (var i=0; i<config.circle.amount/config.circle.layer; i++){
					for (var j=0; j<config.circle.layer; j++){
						circles.push({
							x: M.random() * wWidth,
							y: M.random() * wHeight,
							radius: M.random()*(20+j*5)+(20+j*5),
							color: config.circle.color,
							alpha: M.random()*0.2+(config.circle.alpha-j*0.1),
							speed: config.speed*(1+j*0.5)
						});
					}
				}
			}

			if (config.line.amount > 0 && config.line.layer > 0){
				for (var m=0; m<config.line.amount/config.line.layer; m++){
					for (var n=0; n<config.line.layer; n++){
						lines.push({
							x: M.random() * wWidth,
							y: M.random() * wHeight,
							width: M.random()*(20+n*5)+(20+n*5),
							color: config.line.color,
							alpha: M.random()*0.2+(config.line.alpha-n*0.1),
							speed: config.speed*(1+n*0.5)
						});
					}
				}
			}

			cancelAnimationFrame(timer);
			timer = requestAnimationFrame(animate);
			drawBack();
		};

		$(document).ready(function(){
			setCanvasHeight();
			createItem();
		});
		$(window).resize(function(){
			setCanvasHeight();
			createItem();
		});
	}
})(jQuery);

