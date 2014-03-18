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
  
  // Allow the score table to be edited
  $scoreTable.attr("contenteditable","true");

  // On edit, throw an event
  $scoreTable.blur(function() {
    teamTableTouched(true);
  });
  
  function pushSocketUpdate() {
    if(_SOCKET) {
      _SOCKET.push({ event: pushType.UPDATE, content: $scoreTable.html() }, function(data) {
        logToStatus(data.success); 
      });
    } 
  }
  
  var $subCreate = $("#subscribeCreate");
  
  $form = $subCreate.find("form");
  
  $statusArea = $subCreate.find("#status");
  
  $addressField = $form.find("#serverAddress");
  $channelName = $form.find("#channelName");
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
  });
  
  $('#roundScoreBoard').click(function() {
    var popup = open("popup.html", "Popup", "width=960,height=600,resizeable");
  })
  
  ////////////// Event Handlers ////////////
  function resetScoreTable() {
    $('#scoreTable').html($('#emptyScoreTable').html());
    $('#scoreTable').show();
    $('#scoretable').delete('teams');
    teamTableTouched(true);
  }
   
  // The team table has probably been modified
  function teamTableTouched(needSocketUpdate) {
    if(typeof needSocketUpdate === 'undefined') needSocketUpdate = false;
    
    $('#scoreTable').save('teams');
    updateScoreTableIfTableChanged(needSocketUpdate);
  }
  
  // Only update if the data has changed  
  function updateScoreTableIfTableChanged(needSocketUpdate) {
    $table = $('#scoreTable');
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
    
  function logToStatus(message) {
    console.log(message);
    var now = new Date();
    $statusArea.append(now.getHours()+":"+now.getMinutes() +":" +now.getSeconds() +"\t"+ message + "<br />")
               .scrollTop($statusArea[0].scrollHeight);
  }
  
  function prepareSocket() {
    var address = $addressField.val();
    var channelID = $channelName.val();
    
    _SOCKET = new PushSocket(address);
    _SOCKET.connect(function() {
      _SOCKET.subscribe(channelID, function(data) {
        logToStatus("Successfully connected to "+channelID);
        console.log(data);
        
        if(!_HOST) {
          logToStatus("We're a subscriber, so requesting an update from the host.");
          _SOCKET.push({event: pushType.SENDUPDATE}, function(data) {
            logToStatus("Request sent to server, waiting for reply.");  
          });
        }
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
        } else {
          logToStatus('Received unknown event type from the server.') 
        }
      });
    });
  }
  
});