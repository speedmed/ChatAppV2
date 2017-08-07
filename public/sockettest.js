$(document).ready(function(){  
        var socket = io.connect("1.2.3.4:1223");
        $("#chat").hide();
        $("#name").focus();
        $("form").submit(function(event){
            event.preventDefault();
        });

        $("#join").click(function(){
            var name = $("#name").val();
            if (name != "") {
                socket.emit("join", name);
                $("#login").detach();
                $("#chat").show();
                $("#msg").focus();
                ready = true;
            }
        });

        $("#name").keypress(function(e){
            if(e.which == 13) {
                var name = $("#name").val();
                if (name != "") {
                    socket.emit("join", name);
                    ready = true;
                    $("#login").detach();
                    $("#chat").show();
                    $("#msg").focus();
                }
            }
        });

        socket.on("update", function(msg) {
            if(ready)
                $("#msgs").append("" + msg + "");
        })

        socket.on("update-people", function(people){
            if(ready) {
                $("#people").empty();
                $.each(people, function(clientid, name) {
                    $('#people').append("" + name + "");
                });
            }
        });

        socket.on("chat", function(who, msg){
            if(ready) {
                $("#msgs").append("" + who + " says: " + msg + "");
            }
        });

        socket.on("disconnect", function(){
            $("#msgs").append("The server is not available");
            $("#msg").attr("disabled", "disabled");
            $("#send").attr("disabled", "disabled");
        });


        $("#send").click(function(){
            var msg = $("#msg").val();
            socket.emit("send", msg);
            $("#msg").val("");
        });

        $("#msg").keypress(function(e){
            if(e.which == 13) {
                var msg = $("#msg").val();
                socket.emit("send", msg);
                $("#msg").val("");
            }
        });

    });