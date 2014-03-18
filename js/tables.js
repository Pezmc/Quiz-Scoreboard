/**
 * Table management with jQuery
 * Provides a wrap on sorting, saving and loading tables
 * and making comparisons between table cells
 * © Pez Cuckow 2013+
 * email@pezcuckow.com
 * Please keep attribution, including use of modified or selected code.
 * Twitter: @Pezmc
 */

/////// Local Storage //////

// Save a table to html storage
function tableSave(name, $tableToSave) {
  if (typeof(localStorage) == 'undefined' ) {
  	alert('Your browser does not support HTML5 localStorage. Please upgrade');
  } else {
  	try {
  		localStorage.setItem(tableGetStorageName(name), $tableToSave.html()); //saves to the database, "key", "value"
  		console.log('Saved '+name+' to storage');
  	} catch (e) {
  	 	 if (e == QUOTA_EXCEEDED_ERR) {
  	 	 	 alert('Quota exceeded, failed to save table, data will be lost on page reload!');
  	 	 }
  	}
  }
}
  
// Convert the id to a unique table id for storage
function tableGetStorageName(name) {
  return "table" + name;
}

// Have we saved this table?
function tableSaved(name) {
  return localStorage.getItem(tableGetStorageName(name)) != null;
}

// Load a table from local storage
function tableLoad(name, $tableToLoadInto) {
    if(tableSaved(name))
      $tableToLoadInto.html(localStorage.getItem(tableGetStorageName(name)));
    else
      alert("Error: No table named "+name+", has been saved!");
}

// Forget about the table ID passed
function tableDelete(name) {
  localStorage.removeItem(tableGetStorageName(name));
}

/////// Sorting ////////
// Is this string/int a number?
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// Compare two tables cells for order
function compareCells(a, b) {
    var b = $.text([b]);
    var a = $.text([a]);

    if (isNumber(a) && isNumber(b)) {
        return parseFloat(b) - parseFloat(a);
    } else {
        return a.localeCompare(b);
    }
}

// Number each row, defaulting to the 1st column for position and 3rd for score
// Assumes the rows are in order already
function updateRank(table, index, scoreIndex) {
    var position = 1;
    if(!index) index = 1;
    if(!scoreIndex) scoreIndex = 3; 

    var previousTotalScore = null;
    var skipCount = 0;
    $("tbody tr", table).each(function() {
        var cell = $("td:nth-child(" + index + ")", this);
      
        var totalScore = parseFloat($("td:nth-child(" + scoreIndex + ")", this).text());
      
        if(previousTotalScore == null) {
          previousTotalScore = totalScore;
        }
      
        // ensure teams with matching scores get the same position
        if(totalScore != previousTotalScore) {
          position += skipCount > 0 ? skipCount : 1;
          previousTotalScore = totalScore;
        } else {
          skipCount++; 
        }
      
        // only change if needed 
        if (parseInt(cell.text()) != position) cell.text(position); 
    });
}

// Take a table and order it by the column with anim:sort
function sortTable(table) {

  //What column are we ordering on?
  var sortIndex = table.find(".anim\\:sort").index();
  
  //Old table order
  var idIndex = table.find(".anim\\:id").index();
  var startList = table.find('td').filter(function() {
    return $(this).index() === idIndex;
  });
  
  //Sort the list
  table.find('td').filter(function() {
      return $(this).index() === sortIndex;
  }).sortElements(compareCells, function() { // parentNode is the row we want to move
      return this.parentNode;
  });

  //New table order
  var idIndex = table.find(".anim\\:id").index();
  var endList = table.find('td').filter(function() {
      return $(this).index() === idIndex;
  });
}
