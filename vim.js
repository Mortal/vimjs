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
Vim.prototype.lineStart = function (cursorPos) {
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
  return cursorPos-this.lineStart();
};
Vim.prototype.addText = function (c) {
  this.changeText(this.cursor, this.cursor, c);
  this.cursor += c.length;
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
          case '0':
            this.cursor = this.lineStart();
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
            this.cursor = this.lineStart();
            this.addText('\n');
            --this.cursor;
            this.mode = Mode.INSERT;
            break;
          case 'h':
            --this.cursor;
            break;
          case 'l':
            ++this.cursor;
            break;
          case 'j':
            var initial = this.cursor;
            var lineOffset = this.lineOffset();
            var i = this.lineEnd()+1;
            if (i >= this.buffer.length) break;
            for (var j = 0; j < lineOffset; ++j) {
              if (this.buffer.charAt(i+1) != '\n')
                ++i;
            }
            this.cursor = i;
            break;
          case 'k':
            var initial = this.cursor;
            var lineOffset = this.lineOffset();
            var i = this.lineStart();
            if (i == 0) break;
            i = this.lineStart(i-1);
            for (var j = 0; j < lineOffset; ++j) {
              if (this.buffer.charAt(i+1) != '\n')
                ++i;
            }
            this.cursor = i;
            break;
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
