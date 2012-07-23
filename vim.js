var loopcount = 0;
function InfiniteLoop() {}
function g() {
  if (++loopcount > 10000) throw new InfiniteLoop();
  return true;
}
function Mode() {
  this.startPos = 0;
}
function Linewise(s) { this.s = s; }
Linewise.prototype.toString = function () { return this.s; };
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
  this.options = {backspace:''}
  this.buffer = '\n';
  this.cursor = 0;
  this.operatorpending = null;
  this.registers = new Registers();
  this.lastChange = ''; // used by dot

  this.changeList = [''];
  this.changeListLength = 1;
  this.changeListPosition = 0;
}
Vim.prototype.setMode = function(mode) {
  if(mode == Mode.INSERT)
    mode.startPos = this.cursor;
  this.mode = mode;
}
Vim.prototype.setOpt = function(key, val) {
  if(val == undefined)
    this.options = key;
  else
    this.options[key] = val;
}
Vim.prototype.changeText = function (i, j, s, opt) {
  if (!opt) opt = {};
  if (j == this.buffer.length
      && (s.length == 0 || s.charAt(s.length-1) != '\n')
      && (i == 0 || this.buffer.charAt(i-1) != '\n')) {
    s += '\n'; // don't eat the last endline
  }
  if (i < this.cursor) {
    this.cursor -= Math.min(j-i, this.cursor-i);
  }
  var removed = this.buffer.substring(i, j);
  if (!opt.noyank) this.registers.set(opt.linewise ? new Linewise(removed) : removed);
  this.buffer = this.buffer.substring(0, i) + s + this.buffer.substring(j, this.buffer.length);
  if (this.cursor > 0 && this.cursor > this.buffer.length-1)
    this.cursor = this.buffer.length-1;
  this.changeList[++this.changeListPosition] = [this.cursor, this.buffer];
  this.changeListLength = this.changeListPosition+1;
  return removed;
};

// If cursor is beyond end-of-line, move to last character on line
Vim.prototype.cursorFixup = function () {
  if (this.cursor > 0 && this.buffer.charAt(this.cursor) == '\n' && this.buffer.charAt(this.cursor-1) != '\n')
    --this.cursor;
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
  if (cursorPos < 0)
    throw 'bad pos';
  while (g() && cursorPos && this.buffer.charAt(cursorPos-1) != '\n')
    --cursorPos;
  return cursorPos;
};
// Given an absolute cursor position, find the cursor position of the newline
// character terminating the same line.
Vim.prototype.lineEnd = function (cursorPos) {
  if ('undefined' == typeof cursorPos)
    cursorPos = this.cursor;
  while (g() && cursorPos < this.buffer.length && this.buffer.charAt(cursorPos) != '\n')
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
  while (g() && lines > 0) {
    if (this.cursor > this.buffer.length)
      break;
    if (this.buffer.charAt(this.cursor++) == '\n') --lines;
  }
  while (g() && lines < 0) {
    if (!this.cursor)
      break;
    if (this.buffer.charAt(--this.cursor) == '\n') ++lines;
    if (this.cursor > 0 && this.buffer.charAt(this.cursor-1) != '\n') --this.cursor;
  }
  if (this.cursor > 0 && this.cursor >= this.buffer.length-1)
    this.cursor = this.buffer.length-1;
};
Vim.prototype.setLineOffset = function (offs) {
  this.cursor = this.lineBegin();
  if (this.buffer[this.cursor] == '\n') return;
  for (var i = 0; g() && i < offs; ++i) {
    ++this.cursor;
    if (this.buffer[this.cursor] == '\n') {
      --this.cursor;
      return;
    }
  }
};
Vim.prototype.addText = function (c) {
  this.changeText(this.cursor, this.cursor, c, {noyank: true});
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
    return {from: from, to: to,
      lastIncluded: 'undefined' == typeof last ? to-1 : last,
      dest: 'undefined' == typeof dest ? to : dest,
      linewise: false};
  }
  function inclusive_motion(from, to) {
    return {from: from, to: to, lastIncluded: to, dest: to-1, linewise: false};
  }
  function backwards_exclusive_motion(from, to, last) {
    return {from: from, to: to,
      lastIncluded: 'undefined' == typeof last ? to-1 : last,
      dest: from,
      linewise: false};
  }
  function backwards_inclusive_motion(from, to) {
    return {from: from, to: to, lastIncluded: to, dest: from, linewise: false};
  }
  switch (motion) {
    case 'l':
    case ' ':
      if (this.buffer[this.cursor] == '\n' || this.buffer[this.cursor+1] == '\n') {
        var dest = this.cursor;
        if (motion == ' ' && this.cursor+2 < this.buffer.length)
          dest = this.cursor+2;
        return exclusive_motion(this.cursor, this.cursor+1, this.cursor, dest);
      } else
        return exclusive_motion(this.cursor, this.cursor+1);

    case 'h':
      if (!this.cursor || this.buffer.charAt(this.cursor-1) == '\n')
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
      if (end) {
        ++j;
        if (j+1 < this.buffer.length && this.buffer.charAt(j) == '\n')
          ++j;
      }
      // isKeyword returns either
      // 0: space
      // 1: alnum word
      // 2: non-alnum word
      var state = this.isKeyword(this.buffer.charAt(j));
      // we also have the state
      // 3: skipping initial space on e or E

      // if WORD, collapse state 1 and 2
      if (WORD && state == 2) state = 1;

      // if e or E and we start on a space, handle with care
      if (end && !state) state = 3;

      while (g() && j < this.buffer.length) {
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
              return inclusive_motion(i, j);
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
      // if we break out, we're at the end of the line
      if (end)
        return inclusive_motion(i, j);
      else if (i == j && j < this.buffer.length-1)
        return exclusive_motion(i, j+1, j, j+1);
      else
        return exclusive_motion(i, j, j-1, j+1);
    case '0':
      var j = this.cursor;
      var i = this.lineBegin();
      return backwards_exclusive_motion(i, j);
    default:
      return null;
  }
};
Vim.prototype.input = function (str) {
  for (var inputOffset = 0, l = str.length; g() && inputOffset < l;) {
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
            this.setMode(Mode.INSERT);
            this.lastChange = c;
            break;
          case 's':
            if (this.buffer.charAt(this.cursor) != '\n')
              this.changeText(this.cursor, this.cursor+1, '');
            this.setMode(Mode.INSERT);
            break;
          case 'D':
          case 'C':
            this.changeText(this.cursor, this.lineEnd(), '');
            if (c == 'C') this.setMode(Mode.INSERT);
            this.cursor = this.lineEnd();
            this.lastChange = c;
            break;
          case 'd':
          case 'c':
          case 'y':
            var m = nextc();
            if (!m) {
              this.operatorpending = c;
              break;
            }
            var i, j, linewise = false;
            if (m == c) {
              linewise = true;
              i = this.lineBegin();
              j = this.lineEnd()+1;
            } else {
              var motion = this.getMotion(m, nextc);
              var movement = this.parseMotion(motion);
              i = movement.from;
              linewise = movement.linewise;
              if (c == 'c')
                j = movement.lastIncluded+1;
              else
                j = movement.to;
            }
            var curs = this.cursor;
            this.changeText(i, j, (linewise && c == 'c') ? '\n' : '', {linewise: linewise});
            if (c == 'c')
              this.setMode(Mode.INSERT);
            else if (c == 'y') {
              this.input('P');
              this.cursor = curs;
            } else if (this.buffer.charAt(this.cursor) == '\n' && (this.cursor > 0 && this.buffer.charAt(this.cursor-1) != '\n')) {
              --this.cursor;
            }
            if (c != 'y')
              this.lastChange = c+m;
            break;
          case 'o':
            this.cursor = this.lineEnd();
            this.addText('\n');
            this.setMode(Mode.INSERT);
            this.lastChange = c;
            break;
          case 'O':
            this.cursor = this.lineBegin();
            this.addText('\n');
            --this.cursor;
            this.setMode(Mode.INSERT);
            this.lastChange = c;
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
          case '\x7f':
            // Just fallthrough to x
          case 'x':
            this.changeText(this.cursor, this.cursor+1, '');
            this.cursorFixup();
            this.lastChange = c;
            break;
          case 'P':
          case 'p':
            var reg = this.registers.get();
            if (reg instanceof Linewise) {
              this.cursor = (c == 'P') ? this.lineBegin() : this.lineEnd()+1;
              var pos = this.cursor;
              this.addText(reg.toString());
              this.cursor = pos;
              break;
            }
            if (c != 'P' && this.buffer[this.cursor] != '\n') {
              ++this.cursor;
            }
            this.addText(reg);
            --this.cursor;
            this.lastChange = c;
            break;
          case 'u':
            this.changeListJump(-1);
            break;
          case '.':
            this.input(this.lastChange);
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
          this.setMode(Mode.NORMAL);
          if (this.cursor && this.buffer.charAt(this.cursor-1) != '\n')
            --this.cursor;
          break;
        }
        else if (c == '\b') {
          if(this.options.backspace == 2 || this.mode.startPos != undefined && this.mode.startPos < this.cursor)
            this.changeText(this.cursor-1, this.cursor, '', {noyank:true});
          break;
        }
        else if (c == '\x7f') {
          this.changeText(this.cursor, this.cursor+1, '', {noyank:true});
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
Vim.prototype.getStatusline = function () {
  if (this.mode == Mode.INSERT) return '-- INSERT --';
  else return '';
};
// vim:set sw=2 sts=2 et:
