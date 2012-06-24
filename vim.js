function Mode() {
}
Mode.NORMAL = new Mode();
Mode.INSERT = new Mode();
function Vim() {
  this.mode = Mode.NORMAL;
  this.buffer = '\n';
  this.cursor = 0;
}
Vim.prototype.changeText = function (i, j, s) {
  this.buffer = this.buffer.substring(0, i) + s + this.buffer.substring(j, this.buffer.length);
};
// Given an absolute cursor position, find the cursor position of the first
// character in the same line.
Vim.prototype.lineBegin = function (cursorPos) {
  if ('undefined' == typeof cursorPos)
    cursorPos = this.cursor;
  while (cursorPos && this.buffer.charAt(cursorPos-1) != '\n')
    --cursorPos;
  return cursorPos;
};
// Given an absolute cursor position, find the cursor position of the newline
// character terminating the same line.
Vim.prototype.lineEnd = function (cursorPos) {
  if ('undefined' == typeof cursorPos)
    cursorPos = this.cursor;
  while (cursorPos < this.buffer.length && this.buffer.charAt(cursorPos) != '\n')
    ++cursorPos;
  return cursorPos;
};
// Given an absolute cursor position, find the number of characters until the
// first character in the same line.
Vim.prototype.lineOffset = function (cursorPos) {
  if ('undefined' == typeof cursorPos)
    cursorPos = this.cursor;
  return cursorPos-this.lineBegin();
};
Vim.prototype.moveLines = function (lines) {
  while (lines > 0) {
    if (this.cursor > this.buffer.length)
      break;
    if (this.buffer.charAt(this.cursor++) == '\n') --lines;
  }
  while (lines < 0) {
    if (!this.cursor)
      break;
    if (this.buffer.charAt(--this.cursor) == '\n') --lines;
  }
};
Vim.prototype.addText = function (c) {
  this.changeText(this.cursor, this.cursor, c);
  this.cursor += c.length;
};
Vim.prototype.getMotion = function (c, nextc) {
  return c;
};

/*
							*word*
A word consists of a sequence of letters, digits and underscores, or a
sequence of other non-blank characters, separated with white space (spaces,
tabs, <EOL>).  This can be changed with the 'iskeyword' option.  An empty line
is also considered to be a word.
							*WORD*
A WORD consists of a sequence of non-blank characters, separated with white
space.  An empty line is also considered to be a WORD.
*/
Vim.prototype.isKeyword = function (c) {
  if (c == ' ' || c == '\t' || c == '\n') {
    return 0;
  }
  if ((c >= 'a' && c <= 'z')
    || (c >= 'A' && c <= 'Z')
    || (c >= '0' && c <= '9')
    || (c == '_')) {

    return 1;
  }
  return 2;
};
Vim.prototype.parseMotion = function (motion) {
  function exclusive_motion(from, to) {
    return {from: from, to: to, lastIncluded: to-1, dest: to};
  }
  function inclusive_motion(from, to) {
    return {from: from, to: to, lastIncluded: to, dest: to};
  }
  function backwards_exclusive_motion(from, to) {
    return {from: from, to: to, lastIncluded: to-1, dest: from};
  }
  function backwards_inclusive_motion(from, to) {
    return {from: from, to: to, lastIncluded: to, dest: from};
  }
  switch (motion) {
    case 'l':
      return exclusive_motion(this.cursor, this.cursor+1);

    case 'h':
      if (this.cursor && this.buffer.charAt(this.cursor-1) == '\n')
        return backwards_exclusive_motion(this.cursor, this.cursor);
      else
        return backwards_exclusive_motion(this.cursor-1, this.cursor);

    case 'w':
    case 'e':
    case 'W':
    case 'E':
      var WORD = (motion == 'W' || motion == 'E');
      var end = (motino == 'e' || motion == 'E');
      var i = this.cursor;
      var j = i;
      // isKeyword returns either
      // 0: space
      // 1: alnum word
      // 2: non-alnum word
      var state = this.isKeyword(this.buffer.charAt(i));

      // if WORD, collapse state 1 and 2
      if (WORD && state == 2) state = 1;

      // if e or E and we start on a space, handle with care
      if (end && !state) state = 3;

      while (j < this.buffer.length) {
        var c = this.buffer.charAt(j);
        if (c == '\n')
          break;
        var isk = this.isKeyword(c);
        // if WORD, collapse state 1 and 2
        if (WORD && isk == 2) isk = 1;
        switch (state) {
          case 3:
            // initial space
            if (isk) state = isk;
            break;
          case 0:
            // final space
            if (isk)
              return exclusive_motion(i, j);
            break;
          default: // 1: alnum-word, 2: non-alnum-word
            if (end && isk != state) {
              return inclusive_motion(i, j-1);
            }
            if (!isk) {
              state = 0;
            } else if (isk != state) {
              return exclusive_motion(i, j);
            }
            break;
        }
      }
      return exclusive_motion(i, j);
    case '0':
      var j = this.cursor;
      var i = this.lineBegin();
      return backwards_exclusive_motion(i, j);
    default:
      return null;
  }
};
Vim.prototype.input = function (str) {
  for (var inputOffset = 0, l = str.length; inputOffset < l;) {
    function nextc() {
      return str.charAt(inputOffset++);
    }
    var c = nextc();
    switch (this.mode) {
      case Mode.NORMAL:
        switch (c) {
          case 'i':
          case 'A':
          case 'C':
          case 'S':
            this.mode = Mode.INSERT;
            break;
          case 'D':
            this.changeText(this.cursor, this.lineEnd(), '');
            break;
          case 'o':
            this.cursor = this.lineEnd();
            this.addText('\n');
            this.mode = Mode.INSERT;
            break;
          case 'O':
            this.cursor = this.lineBegin();
            this.addText('\n');
            --this.cursor;
            this.mode = Mode.INSERT;
            break;
          case 'j':
            var lineOffset = this.lineOffset();
            this.moveLines(1);
            this.cursor = this.lineBegin() + lineOffset;
            break;
          case 'k':
            var lineOffset = this.lineOffset();
            this.moveLines(-1);
            this.cursor = this.lineBegin() + lineOffset;
            break;
          default:
            var motion = this.getMotion(c, nextc);
            if (motion) {
              var movement = this.parseMotion(motion);
              if (movement) {
                this.cursor = movement.dest;
              } else {
                console.log("Couldn't parse ",motion);
              }
            }
        }
        break;
      case Mode.INSERT:
        if (c == '\x1b') {
          this.mode = Mode.NORMAL;
          if (this.cursor && this.buffer.charAt(this.cursor-1) != '\n')
            --this.cursor;
          break;
        }
        this.addText(c);
        break;
    }
  }
};
Vim.prototype.getBuffer = function () {
  return this.buffer;
};
// vim:set sw=2 sts=2 et:
