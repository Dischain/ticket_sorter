/*----------------------Input data format--------------------*/
// [
// 	{
// 		transport: {
// 			type: <transportType>
// 			routeNumber: <transportNumber>,
// 			seat: <seatNumber>,
// 			gate: <gateNumber>,
//			baggage: <baggageNumber>
// 		},
// 		departure: {
// 			name: <departureName>
// 		},
// 		destination: {
// 			name: <destinationName>
// 		}
// 	}
// ]
//
// Here described minimalistic ticket data format. 
// Each transport type can be decorated with additional data
// field with corresponding representation rule.
// The only field strongly required are <departureName>
// and <destinationName>.
//
// Also you may to specify phrases, which should be outputted 
// as the result of buildPath() or sort() functions:
//  
// {
// 	<transportType>: {
// 		action: <actionType>
// 	},
//  common: {
// 		defaultAction: <defaultAction>,
//
//		seatPhrase: <seatPhrase>,
// 		defaultSeatPhrase: <defaultSeatPhrase>,
//
//		baggagePhrase: <baggagePhrase>,
// 		defaultBaggagePhrase: <defaultBaggagePhrase>,
//
// 		gatePhrase: <gatePhrase>,
// 		defaultGatePhrase: <defaultGatePhrase>
// 	}
// }
//
// Common representation rule for all transport types can be
// described with kind of production:
// 
// <rule> = <actionType> <transportType> <transportNumber>
// 				'from' <departureName> 'to' <destinationName>. 
// 				<gatePhrase> <gateNumber> | <defaultGatePhrase>.
// 				<seatPhrase> <seatNumber> | <defaultSeatPhrase>.
// 				<baggagePhrase> <baggageNumber> | <defaultBaggagePhrase>.
//
//
// For the sake of simplicity in this solution it`s intentionally
// ommited individual error checking at the fields, which potentionally
// may contain some typos etc (for example, validating the route number
// with regexes).

(function (window) {
	'use strict'    

	let forwardOrderedHT;
	let backOrderedHT;

	let tickets;
	let sorted;

	let outputPhrasesConfig;

	//TODO: write default config...
	let defaultPhrasesConfig = {}

	function buildHashTables() {
		forwardOrderedHT = tickets.reduce(function(init, ticket, index) {
	    	init[ticket.departure.name] = index;
	    	return init;
	    }, {} );

		backOrderedHT = tickets.reduce(function(init, ticket, index) {
			init[ticket.destination.name] = index;
			return init;
		}, {} );
	}
	   
	function traverse(from, to, ordered, callback) {
	    let hashTable;

	    if (ordered) {
	    	hashTable = forwardOrderedHT;
	    } else {
	    	hashTable = backOrderedHT;
	    }

		let currentIndex = hashTable[from];
		let currentTicket;
		let path = [];

		while (currentIndex >= 0) {
			path.push(currentIndex);
			currentTicket = tickets[currentIndex];

			if (ordered) {
				if (to && currentTicket.departure.name === to) break;
				currentIndex = hashTable[currentTicket.destination.name];
			} else {
				if (to && currrentTicket.from === to) break;
				currentIndex = hashTable[currentTicket.departure.name];
			}
		}

		if (callback) {
			callback(path);
		} else
		  return path;    
	}

	/*-----Error handling---------*/
	const POINT_NOT_EXISTS = 1;
	const EMPTY_TICKET_FIELD = 2;

	function validateEndPoints(from, to, callback) {
		let error = {
			code: POINT_NOT_EXISTS,
			message: 'Destination point do not exists',
			invalidPoint: ''
		};

		let invalidPoint;

		if (hashTable[from] === undefined) {
			invalidPoint = from;
		} else if (dest && hashTable[dest] === undefined) {
		    invalidPoint = dest;
		}

		if (invalidPoint) {
			error.invalidPoint = invalidPoint;
			callback(null, error);
		}
	}

	// Check whether required fieilds are specified.
	// If not, should pass an error with array of indexes of
	// empty field tickets into a callback.
	function validateData(data, callback) {
		let error = {
			code: EMPTY_TICKET_FIELD,
			message: 'Required fields are empty',
			invalidTicketsIndexes: []
		};

		data.forEach(function(ticket, index) {
			if (ticket.departure.name === '' 
				|| ticket.destination.name === '')
				error.invalidTicketsIndexes.push(index);
		});

		if (error.invalidTicketsIndexes.length > 0) {
			callback(error);
		} else {
			tickets = data;
			buildHashTables();
		}
	}

	/*---Public Section ---*/
	let ts = {};

	ts.initialize = function(data, config, callback) {
		let cb;
		
		if (arguments.length == 2) {
			cb = config;
			outputPhrasesConfig = defaultPhrasesConfig;
		} else {
			cb = callback;
			outputPhrasesConfig = config;
		}

		validateData(data, cb);

		//buildHashTables();

		return ts;
	}

	ts.sort = function(callback) {
		
		let middleIndex = Math.floor(tickets.length / 2);
		let firstTicketIndex = 
			traverse(tickets[middleIndex].destination.name, null, false).pop();
		let firstTicketOrigin = tickets[firstTicketIndex].departure.name;
		
		sorted = traverse(firstTicketOrigin, null, true);

		if (callback)
			callback(sorted);

		return ts;    
	}

	ts.prettyPrint = function(callback) {
		let output = '';
		sorted.forEach((index) => {
			output += 'from ' + tickets[index].departure.name +
					  ' to ' + tickets[index].destination.name +
					  '.\n';
		});
		callback(output);
	}

	window.ts = ts;
}(window));

//to use this api, you should minify js code with one of the available task runner