/**
 * Main screen for Pub Quiz Scoreboard
 * Allows entering of teams/rounds and displays a live scoreboard
 * © Pez Cuckow 2013+
 * email@pezcuckow.com
 * Please keep attribution, including use of modified or selected code.
 * Twitter: @Pezmc
 */

$(function() {

  // If we have a saved table load it
  if(tableSaved('teams')) {
    tableLoad('teams', $('#scoreTable'));
  } else {
    resetScoreTable();
  }
  
  // Force a touch (to update the live scoreboard)
  teamTableTouched();
  
  // Allow the score table to be edited
  var $scoreTable = $('#scoreTable');
  $scoreTable.attr("contenteditable","true");
  
  // On edit, throw an event
  $scoreTable.blur(function() {
    teamTableTouched($(this));
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
    teamTableTouched();
  });
  
  // Adding a round, just adds another column
  $('#addNewRound').click(function() {
    var roundName=prompt("Please enter the round's name");
    
    if(roundName == null) return;
    
    $scoreTable.find('thead tr').append('<th>'+roundName+'</th>');
    
    $scoreTable.find('tbody tr').each(function () {
      $(this).append('<td>0</td>');
    });

    teamTableTouched();
  });
  
  $('#roundScoreBoard').click(function() {
    var popup = open("popup.html", "Popup", "width=960,height=600,resizeable");
  })
  
  ////////////// Event Handlers ////////////
  function resetScoreTable() {
    $('#scoreTable').html($('#emptyScoreTable').html());
    $('#scoreTable').show();
    tableDelete('teams');
    teamTableTouched();
  }
   
  // The team table has probably been modified
  function teamTableTouched() {
    tableSave('teams', $('#scoreTable'));
    updateScoreTableIfTableChanged();
  }
  
  // Only update if the data has changed  
  function updateScoreTableIfTableChanged() {
    $table = $('#scoreTable');
    if($table.data('oldVal') != $table.text()) {
        $table.data('oldVal', $table.text());

        // Update the score table
        updateLiveScores();
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
    sortTable($newTable);
    updateRank($newTable, 1, 3);
    $currentTable.rankingTableUpdate($newTable, {
      onComplete: function(){
        console.log("Complete");
        updating = false;
        if(updateNeeded) {
          updateNeeded = false;
          updateLiveScores();
        }
      }
    });
  }
  
});
