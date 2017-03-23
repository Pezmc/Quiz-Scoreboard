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

(function($){

    var getStoreName = function(name) {
      return "table" + name;
    },

    isSaved = function(name) {
      return localStorage.getItem(getStoreName(name)) != null
    },

    isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },

    // Compare two tables cells for order
    compareCells = function(a, b) {
        var b = $.text([b]);
        var a = $.text([a]);

        if (isNumber(a) && isNumber(b)) {
            return parseFloat(b) - parseFloat(a);
        } else {
            return a.localeCompare(b);
        }
    };

    // Extend the jquery object
    $.extend($.fn, {

      // Save object to local storage
      save: function(name){
        var table = $(this);
        if(table.prop("tagName") != 'TABLE') return console.log("You can only save tables");

        if (typeof(localStorage) == 'undefined' ) {
          alert('Your browser does not support HTML5 localStorage. Please upgrade');
        } else {
          try {
            localStorage.setItem(getStoreName(name), table.html()); //saves to the database, "key", "value"
            console.log('Saved '+name+' to storage');
          } catch (e) {
             if (e instanceof DOMException) {//QUOTA_EXCEEDED_ERR) {
               alert('Quota exceeded, failed to save table, data will be lost on page reload!');
             }
          }
        }
      },

      load: function(name) {
        if(isSaved(name))
          $(this).html(localStorage.getItem(getStoreName(name)));
        else
          alert("Error: No table named "+name+", has been saved!");
      },

      delete: function(name) {
        localStorage.removeItem(getStoreName(name));
      },

      isSaved: function(name) {
        return isSaved(name);
      },

      // Take a table and order it by the column with anim:sort
      animatedSort: function() {
        var table = $(this);

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
      },

      // Update the ranks (number) of the table
      updateRank: function() {
        var table = $(this);

        var index = table.find(".anim\\:position").index();
        if(index < 0) index = 1;
        else index++;

        var scoreIndex = table.find(".anim\\:sort").index();
        if(scoreIndex < 0) scoreIndex = 3;
        else scoreIndex++;

        var position = 0;

        var previousTotalScore = null;
        var skippedRows = 0;

        $("tbody tr", table).each(function() {
          var cell = $("td:nth-child(" + index + ")", this);
          var totalScore = parseFloat($("td:nth-child(" + scoreIndex + ")", this).text());

          // ensure teams with matching scores get the same position
          if(totalScore != previousTotalScore) {
            position += 1 + skippedRows;
            previousTotalScore = totalScore;
            skippedRows = 0;
          } else {
            skippedRows++;
          }

          // only change if needed
          if (parseInt(cell.text()) != position) cell.text(position);
        });
      }
    });
})(jQuery);
