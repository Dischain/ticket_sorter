'use strict'

let data = [
	{
		transport: {
			type: 'flight',
			routeNumber: 'Z33',					
			gate: 'B7',
			baggage: 22
		},
		departure: {
			name: 'Madrid'
		},
		destination: {
			name: 'Barcelona'
		}
	},
	{
		transport: {
			
		},
		departure: {
			name: 'Barcelona'
		},
		destination: {
			name: 'Tokyo'
		}
	},
	{
		transport: {
			type: 'train',
			routeNumber: 'A1',
			seat: '22',
		},
		departure: {
			name: 'Tokyo'
		},
		destination: {
			name: 'Moscow'
		}
	},
	{
		transport: {
			type: 'flight',
			routeNumber: 'CX50',
			seat: '22',
			gate: 'A7'
		},
		departure: {
			name: 'Moscow'
		},
		destination: {
			name: 'Simferopol'
		}
	},
	{
		transport: {
			type: 'train',
			routeNumber: 'A1'
		},
		departure: {
			name: 'Simferopol'
		},
		destination: {
			name: 'Krasnodar'
		}
	},
	{
		transport: {
			type: 'bus',
			routeNumber: 'HT21',
			seat: '21'
		},
		departure: {
			name: 'Kiev'
		},
		destination: {
			name: 'Madrid'
		}
	},
	{
		transport: {
			type: 'flight',
			routeNumber: 'HF23',
			seat: '22'
		},
		departure: {
			name: 'Fastiv'
		},
		destination: {
			name: 'Kiev'
		}
	},
	{
		transport: {
		
		},
		departure: {
			name: 'Lviv'
		},
		destination: {
			name: 'Fastiv'
		}
	}
];    

ts.initialize(data, function(error) {
	// Debug mode
	// console.log(error.message);
	// console.log(error.invalidTicketsIndexes);
	// ... or specify your fancy error handler			
})
.sort()
.prettyPrint(function(data) {
	let main = document.getElementById('sorted');
	data.forEach((item) => {		
		let node = document.createElement('li');
		node.className += ' ticket-list__ticket';
		let textNode = document.createTextNode(item);
		node.appendChild(textNode);
		main.appendChild(node);
	});
});


ts.initialize(data, function(error) {
	// Debug mode
	// console.log(error.message);
	// console.log(error.invalidTicketsIndexes);
	// Or specify error handler
})
.buildPath('Madrid', 'Simferopol', function(path, error) {
	// Debug mode
	// if (error) console.log(error);
	// else console.log(path);
	// ... or specify your fancy error handler
})
.prettyPrint(function(data) {
	let main = document.getElementById('path');
	data.forEach((item) => {		
		let node = document.createElement('li');
		node.className += ' ticket-list__ticket';
		let textNode = document.createTextNode(item);
		node.appendChild(textNode);
		main.appendChild(node);
	});
});