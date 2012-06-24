function Mode() {
}
Mode.NORMAL = new Mode();
Mode.INSERT = new Mode();
function Vim() {
  this.mode = Mode.NORMAL;
  this.lines = [''];
  this.curline = 0;
}
Vim.prototype.addText = function (c) {
  this.lines[this.curline] += c;
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
            this.mode = Mode.INSERT;
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
  return this.lines.join('\n')+'\n';
};
// vim:set sw=2 sts=2 et:
