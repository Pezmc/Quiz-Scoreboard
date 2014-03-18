///////////////////SORTTABLES.JS//////////////////////////////////////
/* Add stable merge sort to Array and jQuery prototypes */
(function() {
    // expose to Array and jQuery
    Array.prototype.msort = jQuery.fn.msort = msort;

    // the actual compare
    function msort(compare) {
        var length = this.length,
            middle = Math.floor(length / 2);
        if (!compare) {
            compare = function(left, right) {
                if (left < right) return -1;
                if (left == right) return 0;
                else return 1;
            };
        }
        if (length < 2) return this;
        return merge(this.slice(0, middle).msort(compare), this.slice(middle, length).msort(compare), compare);
    }

    //merge two lists
    function merge(left, right, compare) {
        var result = [];
        while (left.length > 0 || right.length > 0) {
            if (left.length > 0 && right.length > 0) {
                if (compare(left[0], right[0]) <= 0) {
                    result.push(left[0]);
                    left = left.slice(1);
                } else {
                    result.push(right[0]);
                    right = right.slice(1);
                }
            } else if (left.length > 0) {
                result.push(left[0]);
                left = left.slice(1);
            } else if (right.length > 0) {
                result.push(right[0]);
                right = right.slice(1);
            }
        }
        return result;
    }
})();

/* jQuery sort elements in a list */
jQuery.fn.sortElements = (function() {
    var sort = [].msort;
    return function(comparator, getSortable) {
        getSortable = getSortable ||
        function() {
            return this;
        };
        var placements = this.map(function() {
            var sortElement = getSortable.call(this),
                parentNode = sortElement.parentNode,
                // Since the element itself will change position, we have
                // to have some way of storing its original position in
                // the DOM. The easiest way is to have a 'flag' node:
                nextSibling = parentNode.insertBefore(document.createTextNode(''), sortElement.nextSibling);

            return function() {
                if (parentNode === this) {
                    throw new Error("You can't sort elements if any one is a descendant of another.");
                }

                // Insert before flag:
                parentNode.insertBefore(this, nextSibling);

                // Remove flag:
                parentNode.removeChild(nextSibling);
            };
        });
        return $(sort.call(this, comparator)).each(function(i) {
            placements[i].call(getSortable.call(this));
        });
    };
})();