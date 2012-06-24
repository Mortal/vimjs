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
  return cursorPos-this.lineStart();
};
Vim.prototype.addText = function (c) {
  this.changeText(this.cursor, this.cursor, c);
  this.cursor += c.length;
};
Vim.prototype.input = function (str) {
  for (var i = 0, l = str.length; i < l;) {
    function nextc() {
      return str.charAt(i++);
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
