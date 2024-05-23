var http = require('http');
var socketio = require('socket.io');

var server = http.createServer(function(req, res) {
    res.write("Hello World!!");
    res.end();
});
var io = socketio(server);

var devices = ["","","","","","",""];



io.on('connection', function(socket) {

  console.log("client connected")
  var room = '';
  var name = '';
  var id = socket.id;

  // roomへの入室
  socket.on('client_to_server_join', function(data, from) {
    room = data;
    name = from;
    // console.log('RoomName:',room,' DeviceName:',name);
    if(name == 'entrance'){
      if(devices[0] == "") {
        socket.join(room);
        io.to(id).emit('server_to_client', "Joined", name);
        devices[0] = id;
        console.log(name,'が',room,'に入室しました。socketid:',id);
      }
      else {
        io.to(id).emit('server_to_client', "Error", "Entrance already exists.");
        console.log('Error:エントランスは既に入室済みです。');
      }
    }
    else if(name == 'reciever') {
      for(var i=1;i<7;i++){
        if(devices[i]==id){
          io.to(id).emit('server_to_client', "Error", "Reciever already exists.");
          console.log('Error:このレシーバーは既に入室済みです。');
          return
        }
      }
      
      if      (devices[1] == "") { name = name + '1'; devices[1] = id; }
      else if (devices[2] == "") { name = name + '2'; devices[2] = id; }
      else if (devices[3] == "") { name = name + '3'; devices[3] = id; }
      else if (devices[4] == "") { name = name + '4'; devices[4] = id; }
      else if (devices[5] == "") { name = name + '5'; devices[5] = id; }
      else if (devices[6] == "") { name = name + '6'; devices[6] = id; }
      else {
        io.to(id).emit('server_to_client', "Error", "Recievers are already full.");
        console.log('Error:デバイスが既に6台使われています。これ以上入室できません。');
        return
      }
      socket.join(room);
      io.to(id).emit('server_to_client', "Joined", name);
      console.log(name,'が',room,'に入室しました。socketid:',id);    
    }
    else {
      io.to(id).emit('server_to_client', "Error", "Device name is invalid.");
      console.log('Error:送られたデバイスネームが間違っています。');
    }
  });
  
  /// イベント・データを受信し全送信する
  socket.on('client_to_server', function(data, from) {
    io.to(room).emit('server_to_client', data, from);
    console.log('Data:',data,' from ',name);
  });
  // イベント・データを受信し、送信元以外に送信する
  socket.on('client_to_server_broadcast', function(data, from) {
    socket.broadcast.to(room).emit('server_to_client', data, from);
    console.log('Data:',data,' from ',name);
  });
  
  socket.on('client_to_server_showmember', function(data, from) {
    var value = "";
    for(var i=0;i<7;i++){
      if(devices[i]!=""){ value += "1,"; }
      else{ value += "0,"; }
    }
    value.slice(0, -1);
    io.to(room).emit('server_to_client_showmember', value, "server");
  });
  
  // 退出
  socket.on('disconnect', function() {
    var id = socket.id;
    for(var i=0;i<7;i++){
      if(devices[i]==id){ devices[i] = ""; }
    }
    io.to(room).emit('server_to_client', "Leaved", name);
    console.log(name,'が',room,'から退出しました。socketid:',id); 
    
    //最新のメンバーリストを送信
    var value = "";
    for(var i=0;i<7;i++){
      if(devices[i]!=""){ value += "1,"; }
      else{ value += "0,"; }
    }
    value.slice(0, -1);
    io.to(room).emit('server_to_client_showmember', value, "server");
  });

  socket.on('disconnect', function() {
    console.log("client disconnected")
  });
  
  // socket.on("from_client", function(msg){
  //   console.log("receive: " + msg);
  //   // socket.emit("from_server", msg);
  //   io.emit("from_server", msg);
  // });

});

server.listen(8080);

