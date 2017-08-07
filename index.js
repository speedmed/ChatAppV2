var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Room = require('./room.js');  
var uuid = require('node-uuid');

var people = {};  
var rooms = {};  
var clients = [];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){

	socket.on("join", function(name){
		roomID = null;
		owns = null
        people[socket.id] = {"name" : name, "room" : roomID, "owns" : owns};
        socket.emit("update", "You are connected to the server.");
        io.emit("update", name + " has joined the server.")
        io.emit("update-people", people);
        //show all rooms to the connected user
        socket.emit("roomList", {rooms : rooms});
        clients.push(socket);
    });

    socket.on("createRoom", function(name) {  
	  if (people[socket.id].room === null) {
	    var id = uuid.v4();
	    var room = new Room(name, id, socket.id);
	    rooms[id] = room;
	    io.emit("roomList", {rooms: rooms}); //update the list of rooms on the frontend
	    socket.room = name; //name the room
	    socket.join(socket.room); //auto-join the creator to the room
	    room.addPerson(socket.id); //also add the person to the room object
	    people[socket.id].room = id; //update the room key with the ID of the created room
	    people[socket.id].owns = id;
	  } else {
	    io.emit("update", "You have already created a room.");
	  }
	});

	socket.on("joinRoom", function(id) {  
	    var room = rooms[id];
	    if (socket.id === room.owner) {
	      socket.emit("update", "You are the owner of this room and you have already been joined.");
	    } else {
	      room.people.contains(socket.id, function(found) {
		          if (found) {
		              socket.emit("update", "You have already joined this room.");
		          } else {
		            if (people[socket.id].room !== null) { //make sure that one person joins one room at a time
		              	  socket.emit("update", "You are already in a room ("+rooms[people[socket.id].room].name+"), please leave it first to join another room.");
		            } else {
				          room.addPerson(socket.id);
				          people[socket.id].room = id;
				          socket.room = room.name;
				          socket.join(socket.room); //add person to the room
				          user = people[socket.id];
				          io.in(socket.room).emit("update", user.name + " has connected to " + room.name + " room.");
				          socket.emit("update", "Welcome to " + room.name + ".");
				          socket.emit("sendRoomID", {id: id});
		            }
		          }
	      });
	    }
	});

	// console.log(io.sockets.adapter.sids[socket.id][socket.id]); //should return { '': true } default room 
	// socket.room = 'myroom';  
	// socket.join('myroom');  
	// console.log(io.sockets.adapter.sids[socket.id][socket.room]); //should return { '': true, '/myroom': true } 
	//socket.broadcast.emit('userLoggedIn');
	
	socket.on('send', function(msg){
		if(io.sockets.adapter.sids[socket.id][socket.room] !== undefined){

			io.in(socket.room).emit("chat", people[socket.id], msg);
		}else{
			socket.emit("update", "Please connect to a room.");
		}
		

	});

	socket.on("leaveRoom", function(id) {  
	  	var room = rooms[id];
	  	if (socket.id === room.owner) {
    		var i = 0;
    		while(i < clients.length) {
      			if(clients[i].id == room.people[i]) {
        			people[clients[i].id].room = null;
        			clients[i].leave(room.name);
      			}
      			++i;
    		}
    		delete rooms[id];
    		people[room.owner].owns = null; //reset the owns object to null so new room can be added
		    io.emit("roomList", {rooms: rooms});
		    io.in(socket.room).emit("update", "The owner (" +user.name + ") is leaving the room. The room is removed.");
 		} else {
      		room.people.contains(socket.id, function(found) {
        		if (found) { //make sure that the socket is in fact part of this room
	          		var personIndex = room.people.indexOf(socket.id);
	          		room.people.splice(personIndex, 1);
	          		io.sockets.emit("update", people[socket.id].name + " has left the room.");
	          		socket.leave(room.name);
        		}
     		});
   		}
	});

	socket.on('disconnect', function(){
    	io.emit("update", people[socket.id] + " has left the server.");
        delete people[socket.id];
        io.emit("update-people", people);

  	});
});

http.listen(3000, function(){
	console.log('listening on port:3000');
});

