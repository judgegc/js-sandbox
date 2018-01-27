const assert = require('assert');

const Cmd = require('../src/command-processor');


const cstCmd = (name, desc) => {
  const cmd = "'cmd=" + name + "'\n";
  desc = desc ? "'desc=" + desc + "'\n" : '';
  return "'custom command'\n" + cmd + desc + 'console.log(42)';
}

const genForCmdProcess = (name, desc) => {
  return {type: 'source_code', language: 'js', content: cstCmd(name, desc)};
}

describe('CustomCommand', function () {
  describe('ParseArgs', function () {
    describe('without desc', function () {
      const nameCmd = 'nodesc';
      const cmd = new Cmd();
      const scc = cmd.process(genForCmdProcess(nameCmd, ''), 0)
      it('name command', function () {
          assert.equal(scc.args[0], nameCmd);
      });
      it('desc command', function () {
        assert.equal(scc.args[1], '');
      });
      it('source', function () {
        assert.equal(scc.args[2], cstCmd(nameCmd, ''));
      });
    });

    describe('with desc with space', function () {
      const nameCmd = 'withdescspaces';
      const descCmd = 'test desc spaces';
      const cmd = new Cmd();
      const scc = cmd.process(genForCmdProcess(nameCmd, descCmd), 0);

      it('name command', function () {
          assert.equal(scc.args[0], nameCmd);
      });

      it('desc command', function () {
        assert.equal(scc.args[1], descCmd);
      });

      it('source', function () {
        assert.equal(scc.args[2], cstCmd(nameCmd, descCmd));
      });
    });

    describe('with desc without spaces', function () {
      const nameCmd = 'withdesc';
      const descCmd = 'testdesc';
      const cmd = new Cmd();
      const scc = cmd.process(genForCmdProcess(nameCmd, descCmd), 0);

      it('name command', function () {
          assert.equal(scc.args[0], nameCmd);
      });

      it('desc command', function () {
        assert.equal(scc.args[1], descCmd);
      });

      it('source', function () {
        assert.equal(scc.args[2], cstCmd(nameCmd, descCmd));
      });
    });
  });
});