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
Vim.prototype.lineStart = function (i) {
  if ('undefined' == typeof i) i = this.cursor;
  while (i && this.buffer.charAt(i-1) != '\n')
    --i;
  return i;
};
Vim.prototype.lineEnd = function (i) {
  if ('undefined' == typeof i) i = this.cursor;
  while (i < this.buffer.length && this.buffer.charAt(i) != '\n')
    ++i;
  return i;
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
        }
        break;
      case Mode.INSERT:
        if (c == '\x1b') {
          this.mode = Mode.NORMAL;
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
