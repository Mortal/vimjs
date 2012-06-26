function Mode() {
}
Mode.NORMAL = new Mode();
Mode.INSERT = new Mode();
function Registers() {
  this.contents = {};
  this.nextreg = '"';
}
Registers.prototype.setnext = function (name) {
  this.nextreg = name;
};
Registers.prototype.getnamed = function (name) {
  return this.contents[name];
};
Registers.prototype.setnamed = function (str, name) {
  this.contents[name] = str;
};
Registers.prototype.setnext = function (name) {
  this.nextreg = name;
};
Registers.prototype.get = function () {
  var v = this.getnamed(this.nextreg);
  this.nextreg = '"';
  return v;
};
Registers.prototype.set = function (str) {
  this.setnamed(str, this.nextreg);
  this.nextreg = '"';
};
function Vim() {
  this.mode = Mode.NORMAL;
  this.buffer = '\n';
  this.cursor = 0;
  this.operatorpending = null;
  this.registers = new Registers();

  this.changeList = [''];
  this.changeListLength = 1;
  this.changeListPosition = 0;
}
Vim.prototype.changeText = function (i, j, s, opt) {
  if (j == this.buffer.length
      && (s.length == 0 || s.charAt(s.length-1) != '\n')
      && (i == 0 || this.buffer.charAt(i-1) != '\n')) {
    s += '\n'; // don't eat the last endline
  }
  if (i < this.cursor) {
    this.cursor -= Math.min(j-i, this.cursor-i);
  }
  var removed = this.buffer.substring(i, j);
  if (!(opt || {}).noyank) this.registers.set(removed);
  this.buffer = this.buffer.substring(0, i) + s + this.buffer.substring(j, this.buffer.length);
  if (this.cursor > 0 && this.cursor > this.buffer.length-1)
    this.cursor = this.buffer.length-2;
  this.changeList[++this.changeListPosition] = [this.cursor, this.buffer];
  this.changeListLength = this.changeListPosition+1;
  return removed;
};
Vim.prototype.changeListJump = function (offset) {
  var index = this.changeListPosition + offset;
  if (index >= this.changeListLength) index = this.changeListLength-1;
  if (index < 0) index = 0;
  this.cursor = this.changeList[index][0];
  this.buffer = this.changeList[index][1];
  this.changeListPosition = index;
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
    if (this.buffer.charAt(this.cursor--) == '\n') ++lines;
  }
};
Vim.prototype.setLineOffset = function (offs) {
  this.cursor = this.lineBegin();
  if (this.buffer[this.cursor] == '\n') return;
  for (var i = 0; i < offs; ++i) {
    ++this.cursor;
    if (this.buffer[this.cursor] == '\n') {
      --this.cursor;
      return;
    }
  }
};
Vim.prototype.addText = function (c) {
  this.changeText(this.cursor, this.cursor, c, true);
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
  function exclusive_motion(from, to, last, dest) {
    return {from: from, to: to, lastIncluded: last || to-1, dest: dest || to};
  }
  function inclusive_motion(from, to) {
    return {from: from, to: to, lastIncluded: to, dest: to};
  }
  function backwards_exclusive_motion(from, to, last) {
    return {from: from, to: to, lastIncluded: last || to-1, dest: from};
  }
  function backwards_inclusive_motion(from, to) {
    return {from: from, to: to, lastIncluded: to, dest: from};
  }
  switch (motion) {
    case 'l':
      if (this.buffer[this.cursor] == '\n' || this.buffer[this.cursor+1] == '\n')
        return exclusive_motion(this.cursor, this.cursor+1, this.cursor, this.cursor);
      else
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
      var end = (motion == 'e' || motion == 'E');
      var i = this.cursor;
      var j = i;
      var end_of_word;
      // isKeyword returns either
      // 0: space
      // 1: alnum word
      // 2: non-alnum word
      var state = this.isKeyword(this.buffer.charAt(i));
      // we also have the state
      // 3: skipping initial space on e or E

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
              return exclusive_motion(i, j, end_of_word);
            break;
          default: // 1: alnum-word, 2: non-alnum-word
            end_of_word = j-1;
            if (end && isk != state) {
              return inclusive_motion(i, end_of_word);
            }
            if (!isk) {
              state = 0;
            } else if (isk != state) {
              return exclusive_motion(i, j, end_of_word);
            }
            break;
        }
        ++j;
      }
      // if we break out, we're at the end of the buffer
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
      if (inputOffset < str.length)
        return str.charAt(inputOffset++);
      return '';
    }
    var c = this.operatorpending || nextc();
    this.operatorpending = null;
    switch (this.mode) {
      case Mode.NORMAL:
        switch (c) {
          case 'S':
            this.changeText(this.lineBegin(), this.lineEnd(), '');
            // fallthru
          case 'A':
            this.cursor = this.lineEnd();
            // fallthru
          case 'a':
            if (this.buffer[this.cursor] != '\n') ++this.cursor;
            // fallthru
          case 'i':
            this.mode = Mode.INSERT;
            break;
          case 'D':
          case 'C':
            this.changeText(this.cursor, this.lineEnd(), '');
            if (c == 'C') this.mode = Mode.INSERT;
            this.cursor = this.lineEnd();
            break;
          case 'd':
          case 'c':
            var m = nextc();
            if (!m) {
              this.operatorpending = c;
              break;
            }
            var i, j;
            if (m == c) {
              i = this.lineBegin();
              if (c == 'c')
                j = this.lineEnd();
              else
                j = this.lineEnd()+1;
            } else {
              var motion = this.getMotion(m, nextc);
              var movement = this.parseMotion(motion);
              i = movement.from;
              if (c == 'c')
                j = movement.lastIncluded+1;
              else
                j = movement.to;
            }
            this.changeText(i, j, '');
            if (c == 'c')
              this.mode = Mode.INSERT;
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
            this.setLineOffset(lineOffset);
            break;
          case 'k':
            var lineOffset = this.lineOffset();
            this.moveLines(-1);
            this.setLineOffset(lineOffset);
            break;
          case 'x':
            this.changeText(this.cursor, this.cursor+1, '');
            break;
          case 'p':
            if (this.buffer[this.cursor] == '\n') {
              this.addText(this.registers.get());
            } else {
              ++this.cursor;
              this.addText(this.registers.get());
              --this.cursor;
            }
            break;
          case 'u':
            this.changeListJump(-1);
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
