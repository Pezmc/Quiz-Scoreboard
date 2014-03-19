/**
 * Main screen for Pub Quiz Scoreboard
 * Allows entering of teams/rounds and displays a live scoreboard
 * © Pez Cuckow 2013+
 * email@pezcuckow.com
 * Please keep attribution, including use of modified or selected code.
 * Twitter: @Pezmc
 */

/* Plan for pub/sub
 * - Register to channel
 * - On item event, update the score table and fire teamTableTouched()
 * - On subscribe, send a push with all the data
 */

$(function() {

  var pushType = {
      UPDATE: 0,
      SENDUPDATE: 1
  };
  
  // If we have a saved table load it
  var $scoreTable = $('#scoreTable');
  if($scoreTable.isSaved('teams')) {
    $scoreTable.load('teams');
  } else {
    resetScoreTable();
  }
  
  // Force a touch (to update the live scoreboard)
  teamTableTouched();

  // On edit, throw an event
  bindEditEvents($scoreTable);
  
  $("#forceUpdateArea").hide();
  $("#statusArea").hide();
  $("#forceUpdate").click(requestOrPushUpdate);
  
  var $subCreate = $("#subscribeCreate");
  $form = $subCreate.find("form");
  $subscribe = $form.find("#subscribe");
  $create = $form.find("#create");
  
  var _SOCKET = null;
  var _HOST = false;
  $subscribe.click(prepareSocket);
  $create.click(function() {
    logToStatus("We're the host, registering with server.");
    _HOST = true;
    prepareSocket();
  });
  
  // If we try to leave the page, throw a warning!
  window.onbeforeunload = function() {
    return "If you leave you may lose all the scores!";
  }
  
  // Bind our three menu buttons
  $('#resetTable').click(function () {
    var reset = confirm("Are you sure you want to do this?");
    if (reset) {
      reset = confirm("This will DELETE all the data! Are you double sure?");
      if (reset) {
        resetScoreTable();
      }
    }    
  });
  
  // Clicking new team => add that team to the rounds table
  $('#addNewTeam').click(function() {
    var teamName=prompt("Please enter the team's name");
    
    if(teamName == null) return;

    // Check the name doesn't already exists
    var alreadyExists = false;
    $scoreTable.find('tbody tr td:first-child').each(function () {
      if($(this).text().toLowerCase() == teamName.toLowerCase()) {
        alreadyExists = true;
        return;
      }
    })
    if(alreadyExists) {
      alert("That name already exists, please try another!");
      return;
    }

    var colCount = 0;    
    $scoreTable.find('thead th').each(function () {
      colCount++;
    });
    
    var scoreTDs = "";
    for (var i = 1; i < colCount; i++) {
      scoreTDs += '<td>0</td>';
    }
        
    $scoreTable.find('tr:last').after('<tr><td>'+teamName+'</td>'+scoreTDs+'</tr>');
    teamTableTouched(true);
    bindEditEvents($scoreTable);
  });
  
  // Adding a round, just adds another column
  $('#addNewRound').click(function() {
    var roundName=prompt("Please enter the round's name");
    
    if(roundName == null) return;
    
    $scoreTable.find('thead tr').append('<th>'+roundName+'</th>');
    
    $scoreTable.find('tbody tr').each(function () {
      $(this).append('<td>0</td>');
    });

    teamTableTouched(true);
    bindEditEvents($scoreTable);
  });
  
  $('#roundScoreBoard').click(function() {
    var popup = open("popup.html", "Popup", "width=960,height=600,resizeable");
  })
  
  ////////////// Event Handlers ////////////
  function resetScoreTable() {
    $scoreTable.html($('#emptyScoreTable').html());
    $scoreTable.show();
    $scoreTable.delete('teams');
    teamTableTouched(true);
    bindEditEvents($scoreTable);
  }
   
  // The team table has probably been modified
  function teamTableTouched(needSocketUpdate) {
    if(typeof needSocketUpdate === 'undefined') needSocketUpdate = false;
    
    $scoreTable.save('teams');
    updateScoreTableIfTableChanged(needSocketUpdate);
  }
  
  // Only update if the data has changed  
  function updateScoreTableIfTableChanged(needSocketUpdate) {
    $table = $scoreTable;
    if($table.data('oldVal') != $table.text()) {
      $table.data('oldVal', $table.text());

      // Update the score table
      updateLiveScores();

      // Push the update to any clients
      if(needSocketUpdate)
        pushSocketUpdate();
    }
  }
   
  // Update the live scoreboard 
  var updating = false;
  var updateNeeded = false;
  function updateLiveScores() {
  
    // If we're already updating mark that an update is needed
    if(updating) {
      updateNeeded = true;
      console.log("We're already updating, doing nothing");
      return;
    } else {
      console.log('Updating the live scores');
      updating = true;
    }
    
    // Clone the table and empty the clone
    var $currentTable = $('#liveScores');
    var $newTable = $currentTable.clone();
    $newTable.hide();
    $('#demo').append($newTable);
    $tbody = $newTable.find('tbody');
    $tbody.empty();
    
    // Create our new table
    $('#scoreTable tbody tr').each(function() {
      $row = $(this);
      
      var teamName = null;
      var totalScore = 0;
      $row.find('td').each(function () {
        if(teamName == null) teamName = $(this).text();
        else totalScore += parseFloat($(this).text());
      });
      
      $tbody.append('<tr><td>?</td><td>'+teamName+'</td><td>'+totalScore+'</td></tr>');
    })
    
    // Sort and order the table
    $newTable.animatedSort();
    $newTable.updateRank();
    $currentTable.rankingTableUpdate($newTable, {
      onComplete: function(){
        updating = false;
        if(updateNeeded) {
          updateNeeded = false;
          updateLiveScores();
        }
      }
    });
  }
  
  function bindEditEvents($table) {
    $table.find("td, th").each(function(){
      $(this).attr("contenteditable","true");
      $(this).off('blur').blur(function() {
        teamTableTouched(true);
      });
    });
  }
  
  function pushSocketUpdate() {
    if(_SOCKET) {
      _SOCKET.push({ event: pushType.UPDATE, content: $scoreTable.html() }, function(data) {
        logToStatus(data.success); 
      });
    } 
  }
    
  var $statusArea = null;
  function logToStatus(message) {
    if(!$statusArea) {
      var $subCreate = $("#subscribeCreate");   
      $statusArea = $subCreate.find("#status");
    }
   
    console.log(message);
    var now = new Date();
    $statusArea.append(pad(now.getHours())+":"+pad(now.getMinutes()) +":" +pad(now.getSeconds()) +"\t"+ message + "<br />")
               .scrollTop($statusArea[0].scrollHeight);
  }
  
  function prepareSocket() {
    $addressField = $form.find("#serverAddress");
    $channelName = $form.find("#channelName");
    
    var address = $addressField.val();
    var channelID = $channelName.val();
    
    hideSubscribeForm();
    
    _SOCKET = new PushSocket(address);
    _SOCKET.connect(function() {
      _SOCKET.subscribe(channelID, function(data) {
        logToStatus('Successfully connected to "'+channelID+'" on "'+address+'".');
        if(_HOST) logToStatus('Share the channel and server address with any subscribers');
        console.log(data);
        
        if(!_HOST)
          requestSocketUpdate();
        
        $("#statusMessage").html('We\'re <b>'+(_HOST ? 'the host' : 'a subscriber')
                                  +'</b> connected to <b>'+channelID+'</b> on <b>'+address+'</b>.<br />');
        
        $("#forceUpdateMessage").text(_HOST ? 'Send update to all clients.' : 'Request update from host, if one\'s connected.');
        
        
      });
      
      _SOCKET.bindPush(function(data) {
        
        // If we're the HOST reply to the send update request
        if(data.event == pushType.SENDUPDATE && _HOST) {       
          // Reply with an update
          logToStatus('Server requested an update from us.');
          pushSocketUpdate();
        }
        else if(data.event == pushType.UPDATE) {
          logToStatus('Received an update from the server');
          $scoreTable.html(data.content);
          teamTableTouched(false);
          bindEditEvents($scoreTable);
        } else {
          logToStatus('Received unknown event type from the server.') 
        }
      });
      
      _SOCKET.bindEvent('connect', function() {
        logToStatus('Connected to the server '+address+'.');  
      });

      _SOCKET.bindEvent('disconnect', function() {
        logToStatus('Disconnected from the server, check your internet.');  
      });
      
      _SOCKET.bindEvent('connect_failed', function() {
        logToStatus('Failed to connect to '+address+'.');
      });
      
      _SOCKET.bindEvent('reconnecting', function() {
        logToStatus('Attempting to reconnect to '+address+'.');
      });
      
      _SOCKET.bindEvent('reconnecting', function() {
        logToStatus('Attempting to reconnect to '+address+', check your internet connection.')
      });
       
    });
  }
  
  function requestSocketUpdate() {
    logToStatus("We're a subscriber, so requesting an update from the host.");
    _SOCKET.push({event: pushType.SENDUPDATE}, function(data) {
      logToStatus("Request sent to server, waiting for reply.");  
    });
  }
  
  function requestOrPushUpdate() {
    if(_HOST)
      pushSocketUpdate();
    else
      requestSocketUpdate();
  }
  
  function hideSubscribeForm() {
    $form.slideUp();
    $("#forceUpdateArea").slideDown(); 
    $("#statusArea").slideDown();
  }
  
  function pad(n){
    return n<10? '0'+n:''+n;
  }
  
});
